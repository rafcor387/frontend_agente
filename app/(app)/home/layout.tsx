import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "./LogoutButton";
import { DJANGO_API } from "@/lib/config";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;

  // Fetch user data
  const meRes = await fetch(`${DJANGO_API}/usuarios/api/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
    credentials: "include",
    cache: "no-store",
  });

  if (!meRes.ok) {
    redirect("/login");
  }

  const me = await meRes.json();

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        {/* ✅ Left side: Logo + Username */}
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
          <h1 className="text-2xl font-semibold">Hola, {me.username}</h1>
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