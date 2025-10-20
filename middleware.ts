// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const access = req.cookies.get("access")?.value;

  // Si no hay access y la ruta empieza con /home -> redirige a /login
  if (!access && req.nextUrl.pathname.startsWith("/home")) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  // Opcional: evita cache del middleware para leer cookies siempre actualizadas
  const res = NextResponse.next();
  res.headers.set("x-middleware-cache", "no-cache");
  return res;
}

export const config = {
  matcher: ["/home/:path*"], // las rutas protegidas
};
