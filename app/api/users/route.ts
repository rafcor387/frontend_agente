import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DJANGO_API } from "@/lib/config";

export async function GET(req: Request) {
  const jar = await cookies();
  const access = jar.get("access")?.value;

  if (!access) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "Debe iniciar sesión.", errors: {} },
      { status: 401 },
    );
  }

  try {
    const requestUrl = new URL(req.url);
    const backendUrl = new URL("/users/", DJANGO_API);

    for (const param of [
      "page",
      "name",
      "person_role",
      "user_role",
      "username",
      "is_active",
    ]) {
      const value = requestUrl.searchParams.get(param);
      if (value) backendUrl.searchParams.set(param, value);
    }

    const response = await fetch(backendUrl, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);

    return NextResponse.json(data ?? { count: 0, items: [] }, { status: response.status });
  } catch {
    return NextResponse.json(
      { code: "BACKEND_UNAVAILABLE", message: "No fue posible conectar con el servidor.", errors: {} },
      { status: 503 },
    );
  }
}
