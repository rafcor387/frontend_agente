"use client";
import { useState } from "react";
import Image from "next/image";

type View = "login" | "forgot";

export default function LoginPage() {
  const [view, setView] = useState<View>("login");

  return (
    <div className="auth-shell relative min-h-screen flex">
      {/* ── Fondo: imagen de la Tierra ── */}
      <Image
        src="/earth-bg.jpg"
        alt="Vista de la Tierra desde el espacio"
        fill
        priority
        className="object-cover object-center"
        style={{ zIndex: 0 }}
      />
      {/* Overlay oscuro sobre la imagen */}
      <div
        className="absolute inset-0 bg-black/50"
        style={{ zIndex: 1 }}
      />

      {/* ── Panel izquierdo con el formulario ── */}
      <aside
        className="relative flex flex-col justify-center w-full max-w-md px-10 py-12 bg-white/10 backdrop-blur-md border-r border-white/10 shadow-2xl"
        style={{ zIndex: 2 }}
      >
        {/* Logo / Marca */}
        <div className="mb-10 flex items-center gap-3">
          <Image
            src="/LFA.png"
            alt="LFA Logo"
            width={48}
            height={48}
            className="rounded-full"
          />
          <div>
            <p className="text-xs font-semibold tracking-widest text-sky-300 uppercase">
              Sistema de
            </p>
            <h1 className="text-xl font-bold text-white leading-tight">
              Radiosondeos LFA
            </h1>
          </div>
        </div>

        {view === "login" ? (
          <LoginForm onForgot={() => setView("forgot")} />
        ) : (
          <ForgotForm onBack={() => setView("login")} />
        )}
      </aside>

      {/* ── Zona derecha: texto decorativo ── */}
      <div
        className="hidden md:flex flex-1 flex-col items-center justify-center px-16 text-center"
        style={{ zIndex: 2 }}
      >
        <h2 className="text-4xl font-extrabold text-white drop-shadow-lg mb-4">
          Monitoreo atmosférico
        </h2>
        <p className="text-lg text-sky-200/80 max-w-sm drop-shadow">
          Análisis en tiempo real de perfiles de radiosondeo para el
          Laboratorio de Física Atmosférica.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Sub-formulario: Inicio de sesión               */
/* ─────────────────────────────────────────────── */
function LoginForm({ onForgot }: { onForgot: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message || "No fue posible iniciar sesión.");
        return;
      }
      window.location.replace("/home");
    } catch {
      setError("No fue posible conectar con el servidor.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-1">Bienvenido</h2>
      <p className="text-sm text-sky-300/80 mb-8">
        Ingresa tus credenciales para continuar
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {/* Usuario */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-sky-300 uppercase tracking-wide">
            Usuario
          </label>
          <input
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        {/* Contraseña */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-sky-300 uppercase tracking-wide">
            Contraseña
          </label>
          <div className="relative">
            <input
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400 transition pr-12"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs transition"
              tabIndex={-1}
            >
              {showPwd ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        {/* ¿Olvidaste tu contraseña? */}
        <div className="flex justify-end -mt-2">
          <button
            type="button"
            onClick={onForgot}
            className="text-xs text-sky-400 hover:text-sky-200 underline transition"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-400/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg shadow-sky-900/40"
        >
          {isPending ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>
    </>
  );
}

/* ─────────────────────────────────────────────── */
/*  Sub-formulario: Recuperar contraseña           */
/* ─────────────────────────────────────────────── */
function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setStatus("sent");
        setMessage(
          data?.message ||
            "Si el correo existe, recibirás un enlace para restablecer tu contraseña.",
        );
      } else {
        setStatus("error");
        setMessage(data?.message || "No fue posible procesar la solicitud.");
      }
    } catch {
      setStatus("error");
      setMessage("No fue posible conectar con el servidor.");
    }
  }

  return (
    <>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sky-400 hover:text-sky-200 text-sm mb-6 transition"
      >
        ← Volver al inicio de sesión
      </button>

      <h2 className="text-2xl font-bold text-white mb-1">
        Recuperar contraseña
      </h2>
      <p className="text-sm text-sky-300/80 mb-8">
        Ingresa tu correo y te enviaremos un enlace de restablecimiento.
      </p>

      {status === "sent" ? (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-400/40 px-4 py-4 text-sm text-emerald-300">
          ✓ {message}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-sky-300 uppercase tracking-wide">
              Correo electrónico
            </label>
            <input
              type="email"
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {status === "error" && message && (
            <div className="rounded-lg bg-red-500/20 border border-red-400/40 px-4 py-3 text-sm text-red-300">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg shadow-sky-900/40"
          >
            {status === "loading" ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
      )}
    </>
  );
}
