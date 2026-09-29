import { DJANGO_API } from "@/lib/config";

export interface ApiFieldError {
  code: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  errors: Record<string, ApiFieldError[]>;
}

export interface Role {
  id: number;
  code: string;
  name: string;
}

export interface CurrentPerson {
  id: number;
  name: string;
  paternal_surname: string;
  maternal_surname: string;
  email: string;
  person_role: Role;
  created_at: string;
  updated_at: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  person: CurrentPerson;
  user_role: Role;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  token_type: "Bearer";
  expires_in: number;
  user: CurrentUser;
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiError };

const BACKEND_UNAVAILABLE: ApiError = {
  code: "BACKEND_UNAVAILABLE",
  message: "No fue posible conectar con el servidor.",
  errors: {},
};

function fallbackError(): ApiError {
  return {
    code: "UNEXPECTED_API_RESPONSE",
    message: "El servidor devolvió una respuesta no válida.",
    errors: {},
  };
}

async function requestDjango<T>(
  path: string,
  init: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(new URL(path, DJANGO_API), {
      ...init,
      cache: "no-store",
    });

    if (response.ok) {
      const data =
        response.status === 204 ? null : ((await response.json()) as T);
      return { ok: true, status: response.status, data: data as T };
    }

    const error = (await response.json().catch(() => null)) as ApiError | null;
    return {
      ok: false,
      status: response.status,
      error: error ?? fallbackError(),
    };
  } catch {
    return {
      ok: false,
      status: 503,
      error: BACKEND_UNAVAILABLE,
    };
  }
}

export function login(credentials: LoginCredentials) {
  return requestDjango<LoginResponse>("/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

export function logout(access: string) {
  return requestDjango<null>("/auth/logout/", {
    method: "POST",
    headers: { Authorization: `Bearer ${access}` },
  });
}

export function getMe(access: string) {
  return requestDjango<CurrentUser>("/auth/me/", {
    method: "GET",
    headers: { Authorization: `Bearer ${access}` },
  });
}
