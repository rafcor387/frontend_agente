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
  // Decodificamos el token directamente, sin llamar a Django
  const user = await getCurrentUser();

  // Si no hay token válido, mandamos al login
  if (!user) {
    redirect("/login");
  }

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
          <h1 className="text-2xl font-semibold">Hola, {user.email}</h1>
        </div>
        
        {/* Right side: Navigation */}
        <div className="flex items-center gap-3">
          <Link
            href="/home/users"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
          >
            Usuarios
          </Link>
          <LogoutButton />
        </div>
      </header>

      {children}
    </main>
  );
}