import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import HeaderNav from "./HeaderNav";

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

        {/* Right side: Client Component con modales */}
        <HeaderNav
          fullName={fullName}
          email={user.person.email}
          roleName={user.user_role.name}
          isAdministrator={user.user_role.code === "ADMINISTRATOR"}
        />
      </header>

      {children}
    </main>
  );
}
