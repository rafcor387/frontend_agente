// app/api/auth/refresh/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/config";

export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get("refresh")?.value;

  if (!refresh) {
    return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
  }

  const res = await fetch(`${DJANGO_API}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    // refresh inválido -> eliminar cookies
    cookieStore.delete("access");
    cookieStore.delete("refresh");
    return NextResponse.json({ detail: "Refresh failed" }, { status: 401 });
  }

  const data = await res.json(); // { access: "..." }
  cookieStore.set("access", data.access, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15,
  });

  return NextResponse.json({ ok: true });
}
