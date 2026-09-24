/**
 * =====================================================================
 *  Módulo de Seguridad del Cliente: Cifrado Híbrido Asimétrico RSA-2048 + César
 * =====================================================================
 * 
 * Cifra datos sensibles (contraseñas, credenciales, etc.) antes de ser transmitidos
 * en las peticiones HTTP (visibles en DevTools -> Network -> Payload como cifrado).
 * 
 * Algoritmo:
 * 1. Cifrado César (desplazamiento paramétrico shift 7)
 * 2. Cifrado Asimétrico RSA-2048 con padding OAEP y hash SHA-256 usando Web Crypto API
 * 3. Empaquetado seguro: $enc$rsa:7:<base64>
 */

const DEFAULT_SHIFT = 7;

// Clave pública RSA-2048 del servidor (formato SPKI PEM)
const DEFAULT_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6B+Vs7rE4RMNVxve7TPy
eNYf0ILbta+2hVRhpR314SDo60eEX4FgEd5XVio45Pf+D0w4d7Hi/M0Ixg7miGvt
JYINerHpvLrMUic3GZUt+6lp2KloNzB7WhU3XKkbsDTYcOMa4IMAecaUQkWEJJgj
9+SCQdYM0zESe9kQukXZFaUHW7kyZl74ERW8r2uw2yr/bkFm8AoMnVYtvSyNWGPw
Ykr2PehQDDepUyYCYHApEUk2JNAImeLNOlDFoXhEAZG2Cig21QYxzAqfOrZQJyp4
tMO5Al/DzxCZRS7zudNrxHDLdL2U/hmogMuAY5Xg6t/ce/YqbQZzaC3Ye55+13QL
lQIDAQAB
-----END PUBLIC KEY-----`;

let cachedCryptoKey: CryptoKey | null = null;

/**
 * Cifrado César sobre cadenas de texto (rango imprimible ASCII 32-126).
 */
export function caesarEncrypt(text: string, shift: number = DEFAULT_SHIFT): string {
  if (!text) return '';
  const normalizedShift = ((shift % 95) + 95) % 95;
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 32 && code <= 126) {
        return String.fromCharCode(((code - 32 + normalizedShift) % 95) + 32);
      }
      return char;
    })
    .join('');
}

/**
 * Descifrado César sobre cadenas de texto (rango imprimible ASCII 32-126).
 */
export function caesarDecrypt(text: string, shift: number = DEFAULT_SHIFT): string {
  if (!text) return '';
  const normalizedShift = ((shift % 95) + 95) % 95;
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 32 && code <= 126) {
        return String.fromCharCode(((code - 32 - normalizedShift + 95) % 95) + 32);
      }
      return char;
    })
    .join('');
}

/**
 * Desempaqueta y descifra un token cifrado opaco ($enc$tok:7:<base64url>)
 * generado por el servidor, sin exponer datos del usuario ni nombres de algoritmos en la red.
 */
export function unpackEncryptedToken<T = any>(tokenStr: string): T | null {
  if (!tokenStr || typeof tokenStr !== 'string') return null;
  if (!tokenStr.startsWith('$enc$tok:')) return null;

  try {
    const parts = tokenStr.slice('$enc$tok:'.length).split(':');
    const shift = parts.length >= 2 ? parseInt(parts[0], 10) : DEFAULT_SHIFT;
    let b64 = parts.length >= 2 ? parts[1] : parts[0];
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) {
      b64 += '=';
    }
    const binaryStr = window.atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const caesarText = new TextDecoder().decode(bytes);
    const jsonStr = caesarDecrypt(caesarText, isNaN(shift) ? DEFAULT_SHIFT : shift);
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    console.warn('[Security] unpackEncryptedToken failed:', err);
    return null;
  }
}

/**
 * Obtiene la clave pública activa del servidor o usa la predeterminada.
 */
async function fetchServerPublicKey(): Promise<string> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';
    if (apiUrl && typeof window !== 'undefined') {
      const res = await fetch(`${apiUrl}/api/security/public-key`, { cache: 'force-cache' });
      if (res.ok) {
        const data = await res.json();
        if (data?.publicKey) return data.publicKey;
      }
    }
  } catch {
    // Usar la clave por defecto
  }
  return DEFAULT_PUBLIC_KEY_PEM;
}

/**
 * Convierte una clave PEM SPKI a CryptoKey importada para RSA-OAEP SHA-256.
 */
async function getOrImportRsaKey(): Promise<CryptoKey | null> {
  if (cachedCryptoKey) return cachedCryptoKey;

  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  let pem = DEFAULT_PUBLIC_KEY_PEM;
  try {
    pem = await fetchServerPublicKey();
  } catch {
    pem = DEFAULT_PUBLIC_KEY_PEM;
  }

  try {
    const cleanB64 = pem.replace(/-----[^\n]+-----/g, '').replace(/\s+/g, '');
    const binaryStr = window.atob(cleanB64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    cachedCryptoKey = await window.crypto.subtle.importKey(
      'spki',
      bytes.buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt'],
    );

    return cachedCryptoKey;
  } catch (error) {
    console.warn('[Security] No se pudo importar la clave pública RSA en WebCrypto:', error);
    return null;
  }
}

/**
 * Cifra un texto plano utilizando Cifrado Asimétrico RSA-2048 + César (Shift 7).
 * Retorna el token cifrado con prefijo `$enc$rsa:7:<base64>`.
 */
export async function encryptClientStealth(
  plainText: string,
  shift: number = DEFAULT_SHIFT,
): Promise<string> {
  if (!plainText || typeof plainText !== 'string') return plainText;
  if (plainText.startsWith('$enc$')) return plainText; // Ya cifrado

  // Paso 1: Cifrado César
  const caesarText = caesarEncrypt(plainText, shift);

  // Paso 2: Cifrado Asimétrico RSA-2048 con Web Crypto API
  try {
    const rsaKey = await getOrImportRsaKey();
    if (rsaKey && window.crypto?.subtle) {
      const encoded = new TextEncoder().encode(caesarText);
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        rsaKey,
        encoded,
      );
      const bytes = new Uint8Array(encryptedBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = window.btoa(binary);
      return `$enc$rsa:${shift}:${b64}`;
    }
  } catch (err) {
    console.warn('[Security] Error al cifrar asimétricamente con RSA, usando fallback César:', err);
  }

  // Fallback si WebCrypto no está disponible en el entorno
  return `$enc$caesar:${shift}:${window.btoa(caesarText)}`;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'pin',
  'secret',
]);

/**
 * Cifra de forma recursiva los campos sensibles de un objeto antes de enviarlo
 * en el Payload de la petición HTTP.
 */
export async function secureRequestPayload<T>(body: T): Promise<T> {
  if (!body || typeof body !== 'object') return body;

  if (Array.isArray(body)) {
    const list = await Promise.all(body.map((item) => secureRequestPayload(item)));
    return list as unknown as T;
  }

  const clone: Record<string, any> = { ...(body as Record<string, any>) };
  let hasEncrypted = false;

  for (const [key, value] of Object.entries(clone)) {
    if (SENSITIVE_KEYS.has(key) && typeof value === 'string' && value.length > 0) {
      clone[key] = await encryptClientStealth(value, DEFAULT_SHIFT);
      hasEncrypted = true;
    } else if (value && typeof value === 'object' && !(value instanceof File) && !(value instanceof Blob)) {
      clone[key] = await secureRequestPayload(value);
    }
  }

  return clone as T;
}
