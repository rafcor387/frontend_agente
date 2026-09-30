// app/api/invitations/[token]/accept/route.ts
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/config";

interface AcceptBody {
  name: string;
  paternal_surname: string;
  maternal_surname: string;
  password: string;
  password_confirm: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  let body: AcceptBody;
  try {
    body = (await req.json()) as AcceptBody;
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Cuerpo de solicitud inválido.", errors: {} },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      new URL(`/invitations/${encodeURIComponent(token)}/accept/`, DJANGO_API),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: body.name,
          paternal_surname: body.paternal_surname,
          maternal_surname: body.maternal_surname,
          password: body.password,
          password_confirm: body.password_confirm,
        }),
        cache: "no-store",
      },
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
