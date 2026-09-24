/**
 * URL del backend. Se define en frontend/.env.local con VITE_API_URL.
 * Si falta, se usa el backend desplegado en Render.
 * Se recorta la barra final para no generar rutas con doble slash.
 */
const getApiUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) throw new Error('VITE_API_URL no está definido en .env.local');
  return url.replace(/\/+$/, '');
};

const API_URL = getApiUrl();

const TOKEN_KEY = 'lavadero.token';

import { secureRequestPayload, unpackEncryptedToken } from './security';

export class ApiError extends Error {
  status: number;
  issues?: { path: string; message: string }[];

  constructor(status: number, message: string, issues?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

// ---------------------------------------------------------------------
// Token (localStorage)
// ---------------------------------------------------------------------

export const tokenStore = {
  get: () => (typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)),
  set: (token: string) => window.localStorage.setItem(TOKEN_KEY, token),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};

/**
 * Parámetros de consulta. Se acepta cualquier objeto plano: los valores
 * vacíos se omiten y solo se serializan primitivos.
 */
type Query = Record<string, unknown>;

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'object') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; query?: Query; formData?: FormData } = {},
): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    let serializedBody: string | FormData | undefined;
    if (options.formData) {
      serializedBody = options.formData;
    } else if (options.body !== undefined) {
      const securedBody = await secureRequestPayload(options.body);
      serializedBody = JSON.stringify(securedBody);
    }

    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: serializedBody,
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      0,
      `No se pudo conectar con el servidor (${API_URL}). Si el backend está en Render, puede estar iniciando tras inactividad. Espera unos segundos o revisa VITE_API_URL en .env`,
    );
  }

  if (response.status === 401 && typeof window !== 'undefined') {
    tokenStore.clear();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Tu sesión expiró, inicia sesión de nuevo');
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (payload.error as string) ?? `Error ${response.status}`,
      payload.issues as { path: string; message: string }[] | undefined,
    );
  }

  // Si la respuesta incluye un token de datos cifrado opaco ($enc$tok:...),
  // se desempaqueta en memoria de manera transparente para alimentar la aplicación
  // sin exponer los datos del usuario en texto plano en la red.
  if (
    payload &&
    typeof payload === 'object' &&
    typeof (payload as any).data === 'string' &&
    (payload as any).data.startsWith('$enc$tok:')
  ) {
    const unpacked = unpackEncryptedToken<Record<string, unknown>>((payload as any).data);
    if (unpacked && typeof unpacked === 'object') {
      payload = { ...payload, ...unpacked };
    }
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  del: <T>(path: string, query?: Query) => request<T>('DELETE', path, { query }),
  upload: <T>(path: string, formData: FormData) => request<T>('POST', path, { formData }),
};

export { API_URL };
