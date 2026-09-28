// app/api/auth/login/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const DJANGO_API = process.env.DJANGO_API ?? "http://127.0.0.1:8000";

export async function POST(req: Request) {
  const body = await req.json();

  // 1. CORREGIDA LA URL DE DJANGO (quitamos el /api/ fantasma)
  const res = await fetch(`${DJANGO_API}/usuarios/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(err, { status: res.status });
  }

  // 2. RECIBIMOS LOS DATOS Y EL NUEVO CAMPO ROL
  const { access, rol } = await res.json();

  const jar = await cookies();
  
  // 3. GUARDAMOS EL TOKEN
  jar.set("access", access, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15, 
  });

  // 4. GUARDAMOS EL ROL EN UNA COOKIE PÚBLICA PARA REACT
  jar.set("user_role", rol || "Sin Rol", {
    httpOnly: false, // Falso para que el cliente pueda leerlo si lo necesita
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}