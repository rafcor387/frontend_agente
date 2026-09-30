// app/api/invitations/[token]/validate/route.ts
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/config";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  try {
    const res = await fetch(
      new URL(`/invitations/${encodeURIComponent(token)}/validate/`, DJANGO_API),
      { method: "GET", cache: "no-store" },
    );

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
