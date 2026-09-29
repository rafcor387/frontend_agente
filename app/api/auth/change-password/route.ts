// app/api/auth/change-password/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/config";

interface ChangePasswordBody {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export async function POST(req: Request) {
  const jar = await cookies();
  const access = jar.get("access")?.value;

  if (!access) {
    return NextResponse.json(
      {
        code: "AUTH_REQUIRED",
        message: "Debe iniciar sesión para realizar esta acción.",
        errors: {},
      },
      { status: 401 },
    );
  }

  let body: ChangePasswordBody;
  try {
    body = (await req.json()) as ChangePasswordBody;
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Cuerpo de solicitud inválido.", errors: {} },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(new URL("/auth/password/change/", DJANGO_API), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access}`,
      },
      body: JSON.stringify({
        current_password: body.current_password,
        new_password: body.new_password,
        new_password_confirm: body.new_password_confirm,
      }),
      cache: "no-store",
    });

    if (res.status === 204) {
      // Contraseña cambiada: invalidar sesión (el backend incrementa token_version)
      jar.delete("access");
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
