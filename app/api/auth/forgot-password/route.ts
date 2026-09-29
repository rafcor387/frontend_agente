// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/config";

export async function POST(req: Request) {
  let body: { email: string };
  try {
    body = (await req.json()) as { email: string };
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Cuerpo de solicitud inválido.", errors: {} },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(new URL("/auth/password/forgot/", DJANGO_API), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(
      data ?? { message: "Solicitud procesada." },
      { status: res.status },
    );
  } catch {
    return NextResponse.json(
      { code: "BACKEND_UNAVAILABLE", message: "No fue posible conectar con el servidor.", errors: {} },
      { status: 503 },
    );
  }
}
