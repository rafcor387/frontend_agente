export type LoginResponse = {
  access: string;
  refresh: string;
};

export async function loginRequest(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/usuarios/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || err?.non_field_errors?.[0] || "Credenciales inválidas");
  }
  return res.json();
}
