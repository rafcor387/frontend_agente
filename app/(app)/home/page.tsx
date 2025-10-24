// app/(app)/home/page.tsx
import { cookies } from "next/headers";
import { DJANGO_API } from "@/lib/config";
import LogoutButton from "./LogoutButton";
import LoginPage from "app/(auth)/login/page"
import {redirect} from "next/navigation";
import { getCurrentUser } from '@/lib/auth';
import Chat from "@/components/Chat";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hola, {user.username}</h1>
        <LogoutButton />
      </header>

      {/* 👇 Add your chat component here */}
      <Chat />
    </main>
  );
}
