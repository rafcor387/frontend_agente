import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "./LogoutButton";
import { getCurrentUser } from "@/lib/auth";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Django valida el token y devuelve el usuario actual mediante /auth/me/.
  const user = await getCurrentUser();

  // Si no hay token válido, mandamos al login
  if (!user) {
    redirect("/login");
  }

  const fullName = [
    user.person.name,
    user.person.paternal_surname,
    user.person.maternal_surname,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        {/* Left side: Logo + Username */}
        <div className="flex items-center gap-3">
          <Link 
            href="/home"
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src="/LFA.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Hola, {fullName}</h1>
            <p className="text-sm text-neutral-500">
              {user.person.email} · {user.user_role.name}
            </p>
          </div>
        </div>
        
        {/* Right side: Navigation */}
        <div className="flex items-center gap-3">
          <Link
            href="/home/users"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
          >
            Usuarios
          </Link>
          <Link
            href="/home/change-password"
            className="px-4 py-2 rounded-lg border border-sky-500/50 hover:bg-sky-500/20 text-sky-300 font-medium transition-colors"
          >
            Cambiar contraseña
          </Link>
          <LogoutButton />
        </div>
      </header>

      {children}
    </main>
  );
}
