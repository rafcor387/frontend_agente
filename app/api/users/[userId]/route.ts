import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/config";

type RouteContext = { params: Promise<{ userId: string }> };

async function getAccessToken() {
  const jar = await cookies();
  return jar.get("access")?.value;
}

function invalidUserId() {
  return NextResponse.json(
    { code: "VALIDATION_ERROR", message: "El identificador del usuario no es válido.", errors: {} },
    { status: 400 },
  );
}

function backendUnavailable() {
  return NextResponse.json(
    { code: "BACKEND_UNAVAILABLE", message: "No fue posible conectar con el servidor.", errors: {} },
    { status: 503 },
  );
}

export async function GET(_req: Request, { params }: RouteContext) {
  const access = await getAccessToken();
  if (!access) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "Debe iniciar sesión.", errors: {} },
      { status: 401 },
    );
  }

  const { userId } = await params;
  if (!/^\d+$/.test(userId)) return invalidUserId();

  try {
    const response = await fetch(new URL(`/users/${userId}/`, DJANGO_API), {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);

    return NextResponse.json(
      data ?? { code: "UNEXPECTED_RESPONSE", message: "Respuesta inesperada del servidor.", errors: {} },
      { status: response.status },
    );
  } catch {
    return backendUnavailable();
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const access = await getAccessToken();
  if (!access) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "Debe iniciar sesión para realizar esta acción.", errors: {} },
      { status: 401 },
    );
  }

  const { userId } = await params;
  if (!/^\d+$/.test(userId)) return invalidUserId();

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

  const allowedFields = ["person_role_code", "user_role_code", "is_active"];
  const payload = Object.fromEntries(
    allowedFields.filter((field) => field in body).map((field) => [field, body[field]]),
  );

  try {
    const response = await fetch(new URL(`/users/${userId}/`, DJANGO_API), {
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
    return backendUnavailable();
  }
}
