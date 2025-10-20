import { getAccessToken } from "./session";

export async function apiGet<T>(path: string): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}
