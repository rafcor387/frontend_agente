"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenFromUrl = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  // Si no hay token en la URL, informar al usuario
  const missingToken = !tokenFromUrl;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError(null);
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenFromUrl,
          new_password: newPassword,
          new_password_confirm: confirmPassword,
        }),
      });

      if (res.status === 204) {
        setStatus("success");
        return;
      }

      const data = await res.json().catch(() => null);

      // Extraer errores por campo del backend
      if (data?.errors && typeof data.errors === "object") {
        const mapped: Record<string, string> = {};
        for (const [field, errs] of Object.entries(data.errors)) {
          if (Array.isArray(errs) && errs.length > 0) {
            mapped[field] = (errs[0] as { message?: string }).message ?? String(errs[0]);
          }
        }
        setFieldErrors(mapped);
      }
      setGlobalError(data?.message || "No fue posible restablecer la contraseña.");
      setStatus("idle");
    } catch {
      setGlobalError("No fue posible conectar con el servidor.");
      setStatus("idle");
    }
  }

  return (
    <div className="auth-shell relative min-h-screen flex items-center justify-center">
      {/* Fondo */}
      <Image
        src="/earth-bg.jpg"
        alt="Fondo atmosférico"
        fill
        priority
        className="object-cover object-center"
        style={{ zIndex: 0 }}
      />
      <div className="absolute inset-0 bg-black/55" style={{ zIndex: 1 }} />

      {/* Tarjeta central */}
      <div
        className="relative w-full max-w-md mx-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl p-10"
        style={{ zIndex: 2 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <Image src="/LFA.png" alt="LFA" width={40} height={40} className="rounded-full" />
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-sky-300 uppercase">
              Sistema de
            </p>
            <h1 className="text-base font-bold text-white leading-tight">Radiosondeos LFA</h1>
          </div>
        </div>

        {missingToken ? (
          /* ── Sin token ── */
          <div className="text-center">
            <p className="text-red-300 mb-6">
              El enlace no contiene un token válido. Por favor solicita un nuevo
              correo de recuperación.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : status === "success" ? (
          /* ── Éxito ── */
          <div className="text-center">
            <div className="mb-4 text-4xl">✓</div>
            <h2 className="text-xl font-bold text-white mb-2">
              ¡Contraseña restablecida!
            </h2>
            <p className="text-sky-300/80 text-sm mb-8">
              Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              Ir al inicio de sesión
            </button>
          </div>
        ) : (
          /* ── Formulario ── */
          <>
            <h2 className="text-2xl font-bold text-white mb-1">Nueva contraseña</h2>
            <p className="text-sm text-sky-300/80 mb-8">
              Ingresa y confirma tu nueva contraseña.
            </p>

            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              {/* Nueva contraseña */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-sky-300 uppercase tracking-wide">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    className={`w-full rounded-lg bg-white/10 border px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400 transition pr-14 ${
                      fieldErrors.new_password ? "border-red-400/60" : "border-white/20"
                    }`}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs transition"
                    tabIndex={-1}
                  >
                    {showNew ? "Ocultar" : "Ver"}
                  </button>
                </div>
                {fieldErrors.new_password && (
                  <p className="text-xs text-red-400">{fieldErrors.new_password}</p>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-sky-300 uppercase tracking-wide">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className={`w-full rounded-lg bg-white/10 border px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400 transition pr-14 ${
                      fieldErrors.new_password_confirm ? "border-red-400/60" : "border-white/20"
                    }`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs transition"
                    tabIndex={-1}
                  >
                    {showConfirm ? "Ocultar" : "Ver"}
                  </button>
                </div>
                {fieldErrors.new_password_confirm && (
                  <p className="text-xs text-red-400">{fieldErrors.new_password_confirm}</p>
                )}
              </div>

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
                {status === "loading" ? "Guardando…" : "Restablecer contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
