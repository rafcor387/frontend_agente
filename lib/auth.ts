import { cookies } from "next/headers";
import { getMe } from "@/lib/auth-service";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;

  if (!access) return null;

  const result = await getMe(access);
  return result.ok ? result.data : null;
}
