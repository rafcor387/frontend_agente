// app/(app)/home/page.tsx
import { cookies } from "next/headers";
import { DJANGO_API } from "@/lib/config";
import LogoutButton from "./LogoutButton";

export default async function HomePage() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;

  // Llama a Django usando Bearer token
  const meRes = await fetch(`${DJANGO_API}/usuarios/api/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
    // Si usas CORS + credenciales:
    credentials: "include",
    cache: "no-store",
  });

  if (!meRes.ok) {
    // Sin sesión válida, el middleware te redirige si entras por /home.
    // Aquí puedes renderizar algo mínimo o nada.
    return <div>Sesión inválida</div>;
  }

  const me = await meRes.json();

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hola, {me.username}</h1>
        <LogoutButton />
      </header>

      <p>¡Bienvenido a tu Home protegida!</p>
    </main>
  );
}
