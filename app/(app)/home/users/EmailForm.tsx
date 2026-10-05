"use client";

import { useState } from "react";

const ROLES: { code: string; label: string }[] = [
  { code: "STUDENT",   label: "Estudiante" },
  { code: "INTERN",    label: "Pasante"    },
  { code: "TEACHER",   label: "Docente"    },
  { code: "ASSISTANT", label: "Auxiliar"   },
];

export default function EmailForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [roleCode, setRoleCode] = useState("STUDENT");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: "error", text: "Por favor ingresa un correo electrónico." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, person_role_code: roleCode }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 201) {
        const rolLabel = ROLES.find((r) => r.code === roleCode)?.label ?? roleCode;
        setMessage({
          type: "success",
          text: `Invitación enviada a ${data?.email ?? email} con rol ${rolLabel}. Vence el ${
            data?.expires_at
              ? new Date(data.expires_at).toLocaleString("es-VE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "en 48 h"
          }.`,
        });
        setEmail("");
        onSuccess?.();
        return;
      }

      const errMsg =
        data?.errors?.email?.[0]?.message ??
        data?.errors?.person_role_code?.[0]?.message ??
        data?.message ??
        "No fue posible enviar la invitación.";
      setMessage({ type: "error", text: errMsg });
    } catch {
      setMessage({ type: "error", text: "No fue posible conectar con el servidor." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-1">Invitar nuevo usuario</h3>
      <p className="text-sm text-neutral-400 mb-4">
        Se enviará un enlace de registro al correo indicado con el rol seleccionado.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          {/* Email */}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
            disabled={loading}
            required
          />

          {/* Selector de rol */}
          <select
            value={roleCode}
            onChange={(e) => setRoleCode(e.target.value)}
            disabled={loading}
            className="px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition cursor-pointer appearance-none"
            style={{ minWidth: "120px" }}
          >
            {ROLES.map((r) => (
              <option key={r.code} value={r.code} className="bg-neutral-900 text-white">
                {r.label}
              </option>
            ))}
          </select>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando…" : "Invitar"}
          </button>
        </div>

        {/* Feedback */}
        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm border ${
              message.type === "success"
                ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                : "bg-red-500/15 border-red-400/40 text-red-300"
            }`}
          >
            {message.type === "success" ? "✓ " : "✕ "}
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}