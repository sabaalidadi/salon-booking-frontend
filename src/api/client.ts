// Thin fetch wrapper for the NestJS API.
//
// - Auth lives in httpOnly cookies set by the backend, so every request is
//   sent with `credentials: 'include'` and no token is ever touched in JS.
// - Successful responses are wrapped by the backend's TransformInterceptor as
//   { success, statusCode, message, data }; we unwrap and return `data`.
// - On a 401 we call POST /auth/refresh once (shared across concurrent
//   requests) and retry the original request.

const BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Envelope<T> = {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
};

let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message: unknown }).message;
    if (Array.isArray(msg)) return msg.join('، ');
    if (typeof msg === 'string' && msg) return msg;
  }
  if (status === 0) return 'ارتباط با سرور برقرار نشد';
  if (status === 403) return 'شما به این بخش دسترسی ندارید';
  if (status >= 500) return 'خطای سرور؛ لطفاً دوباره تلاش کنید';
  return 'درخواست ناموفق بود';
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body && !(init.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, errorMessage(null, 0));
  }
}

export async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; retry?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, retry = true } = options;
  const init: RequestInit = {
    method,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  };

  let res = await send(path, init);

  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refreshSession()) res = await send(path, init);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON body
  }

  if (!res.ok) throw new ApiError(res.status, errorMessage(json, res.status));

  return (json as Envelope<T> | null)?.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
