// app/api/invitations/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/config";

export async function POST(req: Request) {
  const jar = await cookies();
  const access = jar.get("access")?.value;

  if (!access) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "Debe iniciar sesión para realizar esta acción.", errors: {} },
      { status: 401 },
    );
  }

  let body: { email: string; person_role_code?: string };
  try {
    body = (await req.json()) as { email: string; person_role_code?: string };
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Cuerpo de solicitud inválido.", errors: {} },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(new URL("/invitations/", DJANGO_API), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
      body: JSON.stringify({
        email: body.email,
        person_role_code: body.person_role_code ?? "STUDENT",
      }),
      cache: "no-store",
    });

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
