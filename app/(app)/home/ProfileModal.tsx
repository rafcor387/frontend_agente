"use client";
import { useState, useEffect } from "react";
import { ChangePasswordModal } from "./ChangePasswordModal";

interface Role { id: number; code: string; name: string }
interface Person {
  id: number; name: string;
  paternal_surname: string; maternal_surname: string;
  email: string; person_role: Role;
  created_at: string; updated_at: string;
}
interface CurrentUser {
  id: number; username: string; person: Person;
  user_role: Role; is_active: boolean;
  is_staff: boolean; is_superuser: boolean;
  last_login: string | null;
  created_at: string; updated_at: string;
}

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChangePwd, setShowChangePwd] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo cargar el perfil.");
        return res.json() as Promise<CurrentUser>;
      })
      .then(setUser)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Si el modal de cambiar contraseña está abierto, mostrarlo encima
  if (showChangePwd) {
    return <ChangePasswordModal onClose={() => setShowChangePwd(false)} />;
  }

  const fullName = user
    ? [user.person.name, user.person.paternal_surname, user.person.maternal_surname]
        .filter(Boolean).join(" ")
    : "—";

  function fmt(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-VE", { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Mi perfil</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Contenido */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-400/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {user && (
          <div className="space-y-5">
            {/* Avatar / Nombre */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-sky-600 flex items-center justify-center text-xl font-bold text-white select-none">
                {user.person.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{fullName}</p>
                <p className="text-sm text-neutral-400">@{user.username}</p>
              </div>
            </div>

            <hr className="border-white/10" />

            {/* Datos */}
            <dl className="space-y-3 text-sm">
              <Row label="Correo"         value={user.person.email} />
              <Row label="Rol de persona" value={user.person.person_role.name} />
              <Row label="Rol de usuario" value={user.user_role.name} />
              <Row label="Estado"         value={user.is_active ? "Activo" : "Inactivo"} />
              <Row label="Último acceso"  value={fmt(user.last_login)} />
              <Row label="Miembro desde"  value={fmt(user.created_at)} />
            </dl>

            <hr className="border-white/10" />

            {/* Acción */}
            <button
              onClick={() => setShowChangePwd(true)}
              className="w-full py-2.5 rounded-lg border border-sky-500/50 hover:bg-sky-500/20 text-sky-300 font-medium transition-colors text-sm"
            >
              Cambiar contraseña
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <dt className="text-neutral-400 shrink-0">{label}</dt>
      <dd className="text-white text-right break-all">{value}</dd>
    </div>
  );
}
