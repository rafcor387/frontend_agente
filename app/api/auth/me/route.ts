import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getMe } from "@/lib/auth-service";

export async function GET() {
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

  const result = await getMe(access);
  if (!result.ok) {
    if (result.status === 401) {
      jar.delete("access");
    }
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data);
}
