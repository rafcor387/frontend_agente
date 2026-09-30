"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirm: confirmPassword,
        }),
      });

      if (res.status === 204) {
        setStatus("success");
        // El backend invalida el token → redirigir al login después de un momento
        setTimeout(() => {
          window.location.replace("/login");
        }, 2500);
        return;
      }

      const data = await res.json().catch(() => null);

      if (data?.errors && typeof data.errors === "object") {
        const mapped: Record<string, string> = {};
        for (const [field, errs] of Object.entries(data.errors)) {
          if (Array.isArray(errs) && errs.length > 0) {
            mapped[field] = (errs[0] as { message?: string }).message ?? String(errs[0]);
          }
        }
        setFieldErrors(mapped);
      }

      setGlobalError(data?.message || "No fue posible cambiar la contraseña.");
      setStatus("idle");
    } catch {
      setGlobalError("No fue posible conectar con el servidor.");
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="mb-4 text-5xl">✓</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          ¡Contraseña actualizada!
        </h2>
        <p className="text-sky-300/80 text-sm">
          Tu sesión fue cerrada. Redirigiendo al inicio de sesión…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sky-400 hover:text-sky-200 text-sm mb-8 transition"
      >
        ← Volver
      </button>

      <h2 className="text-2xl font-bold text-white mb-1">Cambiar contraseña</h2>
      <p className="text-sm text-neutral-400 mb-8">
        Ingresa tu contraseña actual y elige una nueva. Al guardar, tu sesión
        será cerrada y deberás volver a ingresar.
      </p>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-5 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
      >
        {/* Contraseña actual */}
        <PasswordField
          label="Contraseña actual"
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
          autoComplete="current-password"
          error={fieldErrors.current_password}
        />

        <hr className="border-white/10" />

        {/* Nueva contraseña */}
        <PasswordField
          label="Nueva contraseña"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggle={() => setShowNew((v) => !v)}
          autoComplete="new-password"
          error={fieldErrors.new_password}
        />

        {/* Confirmar nueva contraseña */}
        <PasswordField
          label="Confirmar nueva contraseña"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          autoComplete="new-password"
          error={fieldErrors.new_password_confirm}
        />

        {/* Error global */}
        {globalError && (
          <div className="rounded-lg bg-red-500/20 border border-red-400/40 px-4 py-3 text-sm text-red-300">
            {globalError}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg shadow-sky-900/40"
        >
          {status === "loading" ? "Guardando…" : "Guardar nueva contraseña"}
        </button>
      </form>
    </div>
  );
}

/* ── Componente reutilizable de campo de contraseña ── */
function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-sky-300 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className={`w-full rounded-lg bg-white/10 border px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400 transition pr-14 ${
            error ? "border-red-400/60" : "border-white/20"
          }`}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs transition"
          tabIndex={-1}
        >
          {show ? "Ocultar" : "Ver"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
