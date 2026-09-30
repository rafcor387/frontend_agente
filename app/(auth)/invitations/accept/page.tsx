"use client";
import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function InvitationAcceptPage() {
  return (
    <Suspense>
      <InvitationAcceptContent />
    </Suspense>
  );
}

/* ── Datos de la invitación que devuelve el backend ── */
interface InvitationInfo {
  email: string;
  person_role: { id: number; code: string; name: string };
  status: string;
  expires_at: string;
}

type PageState =
  | { phase: "loading" }
  | { phase: "invalid"; message: string }
  | { phase: "form"; invitation: InvitationInfo }
  | { phase: "success"; username: string };

function InvitationAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [pageState, setPageState] = useState<PageState>({ phase: "loading" });

  /* ── 1. Validar el token al montar ── */
  useEffect(() => {
    if (!token) {
      setPageState({ phase: "invalid", message: "El enlace no contiene un token válido." });
      return;
    }

    fetch(`/api/invitations/${encodeURIComponent(token)}/validate`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (res.ok && data?.valid) {
          setPageState({ phase: "form", invitation: data.invitation as InvitationInfo });
        } else {
          setPageState({
            phase: "invalid",
            message: data?.message ?? "La invitación no es válida o ha expirado.",
          });
        }
      })
      .catch(() => {
        setPageState({ phase: "invalid", message: "No fue posible conectar con el servidor." });
      });
  }, [token]);

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <Image
        src="/earth-bg.jpg"
        alt="Fondo atmosférico"
        fill
        priority
        className="object-cover object-center"
        style={{ zIndex: 0 }}
      />
      <div className="absolute inset-0 bg-black/55" style={{ zIndex: 1 }} />

      <div
        className="relative w-full max-w-lg mx-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl p-10"
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

        {/* ── Cargando ── */}
        {pageState.phase === "loading" && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sky-300/80 text-sm">Verificando invitación…</p>
          </div>
        )}

        {/* ── Token inválido / expirado ── */}
        {pageState.phase === "invalid" && (
          <div className="text-center">
            <div className="mb-4 text-4xl">✕</div>
            <h2 className="text-xl font-bold text-white mb-2">Invitación inválida</h2>
            <p className="text-red-300 text-sm mb-8">{pageState.message}</p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              Ir al inicio de sesión
            </button>
          </div>
        )}

        {/* ── Formulario de registro ── */}
        {pageState.phase === "form" && (
          <RegisterForm
            token={token}
            invitation={pageState.invitation}
            onSuccess={(username) => setPageState({ phase: "success", username })}
          />
        )}

        {/* ── Éxito ── */}
        {pageState.phase === "success" && (
          <div className="text-center">
            <div className="mb-4 text-5xl">✓</div>
            <h2 className="text-xl font-bold text-white mb-2">¡Cuenta creada!</h2>
            <p className="text-sky-300/80 text-sm mb-2">
              Tu cuenta fue creada con el usuario:
            </p>
            <p className="text-lg font-mono font-bold text-white mb-8">
              {pageState.username}
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
            >
              Iniciar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Formulario de aceptación de invitación     */
/* ─────────────────────────────────────────── */
function RegisterForm({
  token,
  invitation,
  onSuccess,
}: {
  token: string;
  invitation: InvitationInfo;
  onSuccess: (username: string) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    paternal_surname: "",
    maternal_surname: "",
    password: "",
    password_confirm: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 201) {
        onSuccess(data?.username ?? "—");
        return;
      }

      if (data?.errors && typeof data.errors === "object") {
        const mapped: Record<string, string> = {};
        for (const [field, errs] of Object.entries(data.errors)) {
          if (Array.isArray(errs) && errs.length > 0) {
            mapped[field] = (errs[0] as { message?: string }).message ?? String(errs[0]);
          }
        }
        setFieldErrors(mapped);
      }

      setGlobalError(data?.message ?? "No fue posible completar el registro.");
    } catch {
      setGlobalError("No fue posible conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  const expiresAt = new Date(invitation.expires_at).toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-1">Crear tu cuenta</h2>

      {/* Info de la invitación */}
      <div className="mb-6 rounded-lg bg-sky-500/10 border border-sky-400/25 px-4 py-3 text-sm text-sky-300 space-y-0.5">
        <p>
          <span className="text-white/60">Correo:</span>{" "}
          <span className="font-medium">{invitation.email}</span>
        </p>
        <p>
          <span className="text-white/60">Rol:</span>{" "}
          <span className="font-medium">{invitation.person_role.name}</span>
        </p>
        <p>
          <span className="text-white/60">Vence:</span>{" "}
          <span className="font-medium">{expiresAt}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Nombre */}
        <TextField
          label="Nombre"
          value={form.name}
          onChange={set("name")}
          autoComplete="given-name"
          error={fieldErrors.name}
          required
        />

        {/* Apellido paterno */}
        <TextField
          label="Apellido paterno"
          value={form.paternal_surname}
          onChange={set("paternal_surname")}
          autoComplete="family-name"
          error={fieldErrors.paternal_surname}
          required
        />

        {/* Apellido materno */}
        <TextField
          label="Apellido materno (opcional)"
          value={form.maternal_surname}
          onChange={set("maternal_surname")}
          autoComplete="family-name"
          error={fieldErrors.maternal_surname}
        />

        <hr className="border-white/10" />

        {/* Contraseña */}
        <PasswordField
          label="Contraseña"
          value={form.password}
          onChange={set("password")}
          show={showPwd}
          onToggle={() => setShowPwd((v) => !v)}
          autoComplete="new-password"
          error={fieldErrors.password}
          required
        />

        {/* Confirmar contraseña */}
        <PasswordField
          label="Confirmar contraseña"
          value={form.password_confirm}
          onChange={set("password_confirm")}
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          autoComplete="new-password"
          error={fieldErrors.password_confirm}
          required
        />

        {/* Error global */}
        {globalError && (
          <div className="rounded-lg bg-red-500/20 border border-red-400/40 px-4 py-3 text-sm text-red-300">
            {globalError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg shadow-sky-900/40"
        >
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
    </>
  );
}

/* ── Campos reutilizables ── */
function TextField({
  label,
  value,
  onChange,
  autoComplete,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-sky-300 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="text"
        className={`w-full rounded-lg bg-white/10 border px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400 transition ${
          error ? "border-red-400/60" : "border-white/20"
        }`}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
  error?: string;
  required?: boolean;
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
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
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
