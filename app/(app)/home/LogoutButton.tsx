// app/(app)/home/LogoutButton.tsx
"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [isPending, setIsPending] = useState(false);

  async function onLogout() {
    setIsPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
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
