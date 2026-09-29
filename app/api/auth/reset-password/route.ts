// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/config";

interface ResetPasswordBody {
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export async function POST(req: Request) {
  let body: ResetPasswordBody;
  try {
    body = (await req.json()) as ResetPasswordBody;
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Cuerpo de solicitud inválido.", errors: {} },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(new URL("/auth/password/confirm/", DJANGO_API), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: body.token,
        new_password: body.new_password,
        new_password_confirm: body.new_password_confirm,
      }),
      cache: "no-store",
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => null);
    return NextResponse.json(
      data ?? { code: "UNEXPECTED_RESPONSE", message: "Respuesta inesperada del servidor.", errors: {} },
      { status: res.status },
    );
  } catch {
    return NextResponse.json(
      { code: "BACKEND_UNAVAILABLE", message: "No fue posible conectar con el servidor.", errors: {} },
      { status: 503 },
    );
  }
}
