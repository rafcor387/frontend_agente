import { cookies } from "next/headers";
import { DJANGO_API } from "@/lib/config";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;

  if (!access) return null;

  const res = await fetch(`${DJANGO_API}/usuarios/api/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  
  return res.json();
}