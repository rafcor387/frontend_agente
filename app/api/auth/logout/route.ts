// app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const jar = await cookies();
  jar.delete("access");
  jar.delete("refresh");
  return NextResponse.json({ ok: true });
}
