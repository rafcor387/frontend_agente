"use client";
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

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

  if (showEditProfile && user) {
    return (
      <EditProfileModal
        user={user}
        onClose={() => setShowEditProfile(false)}
        onSaved={(updatedUser) => {
          setUser(updatedUser);
          setShowEditProfile(false);
          router.refresh();
        }}
      />
    );
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

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowChangePwd(true)}
                className="rounded-lg border border-sky-500/50 py-2.5 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/20"
              >
                Cambiar contraseña
              </button>
              <button
                type="button"
                onClick={() => setShowEditProfile(true)}
                className="rounded-lg border border-white/20 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-white/10"
              >
                Editar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditProfileModal({
  user,
  onClose,
  onSaved,
}: {
  user: CurrentUser;
  onClose: () => void;
  onSaved: (user: CurrentUser) => void;
}) {
  const [name, setName] = useState(user.person.name);
  const [paternalSurname, setPaternalSurname] = useState(user.person.paternal_surname);
  const [maternalSurname, setMaternalSurname] = useState(user.person.maternal_surname);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          paternal_surname: paternalSurname.trim(),
          maternal_surname: maternalSurname.trim(),
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "No se pudo actualizar el perfil.",
        );
      }

      onSaved(data as CurrentUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 id="edit-profile-title" className="text-xl font-bold text-white">
              Editar perfil
            </h2>
            <p className="mt-1 text-sm text-neutral-400">Actualiza tus datos personales.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-2xl leading-none text-white/40 transition hover:text-white disabled:opacity-50"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <label className="block space-y-1.5 text-sm text-neutral-300">
          <span className="font-medium">Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            disabled={saving}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-sky-400/60 disabled:opacity-60"
          />
        </label>

        <label className="block space-y-1.5 text-sm text-neutral-300">
          <span className="font-medium">Apellido paterno</span>
          <input
            type="text"
            value={paternalSurname}
            onChange={(event) => setPaternalSurname(event.target.value)}
            maxLength={100}
            required
            disabled={saving}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-sky-400/60 disabled:opacity-60"
          />
        </label>

        <label className="block space-y-1.5 text-sm text-neutral-300">
          <span className="font-medium">Apellido materno</span>
          <input
            type="text"
            value={maternalSurname}
            onChange={(event) => setMaternalSurname(event.target.value)}
            maxLength={100}
            required
            disabled={saving}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-sky-400/60 disabled:opacity-60"
          />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg border border-sky-500/30 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-200 transition-colors hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
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
