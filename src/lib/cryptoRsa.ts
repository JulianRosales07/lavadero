/**
 * =====================================================================
 *  Módulo de Cifrado de Capa de Aplicación RSA-OAEP / SHA-256 (Cootranar E2EE)
 * =====================================================================
 * 
 * Propósito:
 * 1. Cifrado E2EE / Zero-Trust de credenciales sensibles (correo, contraseña, etc.)
 *    antes de salir del navegador hacia la red.
 * 2. Protección frente a proxies corporativos, MITM y DevTools (Pestaña Network).
 *    En la red, la petición viaja como { data: "<base64>" }.
 * 3. Prevención de ataques de repetición (Replay Attacks) mediante la inyección
 *    automática de una marca de tiempo (_t: Date.now()).
 * 
 * Implementación:
 * - Web Crypto API nativa (window.crypto.subtle).
 * - RSA-OAEP con SHA-256 (2048 bits).
 * - Esquema híbrido automático AES-256-GCM para payloads que superen el límite de bloque (~190 bytes).
 */

const DEFAULT_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6B+Vs7rE4RMNVxve7TPy
eNYf0ILbta+2hVRhpR314SDo60eEX4FgEd5XVio45Pf+D0w4d7Hi/M0Ixg7miGvt
JYINerHpvLrMUic3GZUt+6lp2KloNzB7WhU3XKkbsDTYcOMa4IMAecaUQkWEJJgj
9+SCQdYM0zESe9kQukXZFaUHW7kyZl74ERW8r2uw2yr/bkFm8AoMnVYtvSyNWGPw
Ykr2PehQDDepUyYCYHApEUk2JNAImeLNOlDFoXhEAZG2Cig21QYxzAqfOrZQJyp4
tMO5Al/DzxCZRS7zudNrxHDLdL2U/hmogMuAY5Xg6t/ce/YqbQZzaC3Ye55+13QL
lQIDAQAB
-----END PUBLIC KEY-----`;

let cachedRsaKey: CryptoKey | null = null;

/**
 * Convierte un ArrayBuffer a string Base64.
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convierte una clave PEM (SPKI) a ArrayBuffer para Web Crypto API.
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleanB64 = pem
    .replace(/-----[^\n]+-----/g, '')
    .replace(/\s+/g, '');
  const binaryStr = window.atob(cleanB64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Consulta la clave pública activa del servidor o utiliza la clave de respaldo.
 */
export async function obtenerClavePublicaServidor(): Promise<string> {
  try {
    const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    if (apiUrl && typeof window !== 'undefined') {
      // Intenta primero /api/auth/public-key, luego /api/security/public-key
      const res = await fetch(`${apiUrl}/api/auth/public-key`, { cache: 'force-cache' }).catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        if (json?.publicKey) return json.publicKey;
      }
      const resSec = await fetch(`${apiUrl}/api/security/public-key`, { cache: 'force-cache' }).catch(() => null);
      if (resSec && resSec.ok) {
        const jsonSec = await resSec.json();
        if (jsonSec?.publicKey) return jsonSec.publicKey;
      }
    }
  } catch {
    // Si falla la red, usar clave por defecto
  }
  return DEFAULT_PUBLIC_KEY_PEM;
}

/**
 * Importa o reutiliza la clave pública RSA en formato CryptoKey para Web Crypto API.
 */
export async function getCryptoKey(): Promise<CryptoKey | null> {
  if (cachedRsaKey) return cachedRsaKey;

  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  let pem = DEFAULT_PUBLIC_KEY_PEM;
  try {
    pem = await obtenerClavePublicaServidor();
  } catch {
    pem = DEFAULT_PUBLIC_KEY_PEM;
  }

  try {
    const spkiBuffer = pemToArrayBuffer(pem);
    cachedRsaKey = await window.crypto.subtle.importKey(
      'spki',
      spkiBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt'],
    );
    return cachedRsaKey;
  } catch (error) {
    console.error('[CryptoRSA] Error al importar clave pública RSA:', error);
    return null;
  }
}

/**
 * Cifra un payload (objeto) inyectando la marca de tiempo (_t: Date.now())
 * y retorna un objeto listo para el envío HTTP: { data: "<base64>" }.
 */
export async function cifrarPayload<T extends object>(payload: T): Promise<{ data: string }> {
  // 1. Inyección de timestamp para prevención de replay attacks
  const payloadConTimestamp = {
    ...payload,
    _t: (payload as any)._t || Date.now(),
  };

  const jsonStr = JSON.stringify(payloadConTimestamp);
  const encodedBuffer = new TextEncoder().encode(jsonStr);

  const rsaKey = await getCryptoKey();
  if (!rsaKey || !window.crypto?.subtle) {
    throw new Error('Web Crypto API no disponible en este entorno.');
  }

  // 2. RSA-OAEP SHA-256 Directo (Límite: ~190 bytes para claves de 2048 bits)
  if (encodedBuffer.byteLength <= 190) {
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      rsaKey,
      encodedBuffer,
    );
    return { data: arrayBufferToBase64(encryptedBuffer) };
  }

  // 3. Esquema Híbrido AES-256-GCM si el payload supera los 190 bytes
  const aesKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt'],
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedContentBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    aesKey,
    encodedBuffer,
  );

  // Separar ciphertext y auth tag (los últimos 16 bytes de AES-GCM en WebCrypto son el tag)
  const fullBytes = new Uint8Array(encryptedContentBuffer);
  const tagBytes = fullBytes.slice(fullBytes.byteLength - 16);
  const cipherBytes = fullBytes.slice(0, fullBytes.byteLength - 16);

  // Exportar clave AES y cifrarla con RSA-OAEP
  const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    rsaKey,
    rawAesKey,
  );

  const envelope = {
    k: arrayBufferToBase64(encryptedKeyBuffer),
    iv: arrayBufferToBase64(iv),
    d: arrayBufferToBase64(cipherBytes),
    tag: arrayBufferToBase64(tagBytes),
  };

  const envelopeJson = JSON.stringify(envelope);
  const envelopeB64 = window.btoa(envelopeJson);

  return { data: envelopeB64 };
}
