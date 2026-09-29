// app/api/auth/login/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { login, LoginCredentials } from "@/lib/auth-service";

export async function POST(req: Request) {
  let credentials: LoginCredentials;
  try {
    credentials = (await req.json()) as LoginCredentials;
  } catch {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: "El cuerpo de la solicitud no es un JSON válido.",
        errors: {},
      },
      { status: 400 },
    );
  }

  const result = await login(credentials);
  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  const jar = await cookies();
  jar.set("access", result.data.access, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: result.data.expires_in,
  });
  jar.delete("refresh");
  jar.delete("user_role");

  return NextResponse.json({
    user: result.data.user,
    expires_in: result.data.expires_in,
  });
}
