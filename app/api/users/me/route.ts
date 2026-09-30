import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/config";

export async function PATCH(req: Request) {
  const jar = await cookies();
  const access = jar.get("access")?.value;

  if (!access) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "Debe iniciar sesión para realizar esta acción.", errors: {} },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsedBody: unknown = await req.json();
    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      throw new Error("Invalid body");
    }
    body = parsedBody as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Cuerpo de solicitud inválido.", errors: {} },
      { status: 400 },
    );
  }

  const allowedFields = ["name", "paternal_surname", "maternal_surname"];
  const payload = Object.fromEntries(
    allowedFields.filter((field) => field in body).map((field) => [field, body[field]]),
  );

  try {
    const response = await fetch(new URL("/users/me/", DJANGO_API), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);

    return NextResponse.json(
      data ?? { code: "UNEXPECTED_RESPONSE", message: "Respuesta inesperada del servidor.", errors: {} },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      { code: "BACKEND_UNAVAILABLE", message: "No fue posible conectar con el servidor.", errors: {} },
      { status: 503 },
    );
  }
}
