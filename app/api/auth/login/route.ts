// app/api/auth/login/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const DJANGO_API = process.env.DJANGO_API ?? "http://127.0.0.1:8000";

export async function POST(req: Request) {
  const body = await req.json(); // { username, password }

  // Apunta a TU endpoint real en Django:
  const res = await fetch(`${DJANGO_API}/usuarios/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // credentials: "include" solo hace falta si Django usa cookies propias
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status });
  }

  const { access, refresh } = await res.json();

  const jar = await cookies();
  jar.set("access", access, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15, // ajusta al exp de tu JWT
  });
  jar.set("refresh", refresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
