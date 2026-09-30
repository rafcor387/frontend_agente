import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/config";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const jar = await cookies();
  const access = jar.get("access")?.value;

  if (!access) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "Debe iniciar sesión para realizar esta acción.", errors: {} },
      { status: 401 }
    );
  }

  const { token: id } = await params;

  try {
    const res = await fetch(new URL(`/invitations/${id}/cancel/`, DJANGO_API), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
      },
      cache: "no-store",
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => null);
    return NextResponse.json(
      data ?? { code: "UNEXPECTED_RESPONSE", message: "Respuesta inesperada del servidor.", errors: {} },
      { status: res.status }
    );
  } catch {
    return NextResponse.json(
      { code: "BACKEND_UNAVAILABLE", message: "No fue posible conectar con el servidor.", errors: {} },
      { status: 503 }
    );
  }
}
