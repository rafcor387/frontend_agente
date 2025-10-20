// app/(app)/home/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onLogout() {
    // Llama a tu handler
    await fetch("/api/auth/logout", { method: "POST" });
    // Redirige a /login
    startTransition(() => router.replace("/login"));
  }

  return (
    <button
      onClick={onLogout}
      disabled={isPending}
      className="px-3 py-2 rounded border border-neutral-700 hover:bg-neutral-800"
      aria-label="Cerrar sesión"
    >
      {isPending ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
