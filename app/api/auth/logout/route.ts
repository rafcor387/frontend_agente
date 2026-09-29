// app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logout } from "@/lib/auth-service";

export async function POST() {
  const jar = await cookies();
  const access = jar.get("access")?.value;
  const result = access ? await logout(access) : null;

  jar.delete("access");
  jar.delete("refresh");
  jar.delete("user_role");

  if (result && !result.ok && result.status >= 500) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return new NextResponse(null, { status: 204 });
}
