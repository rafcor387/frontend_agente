"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type {
  PersonRoleCode,
  User,
  UserDetail,
  UserListResponse,
  UserRoleCode,
} from "./types";

const PAGE_SIZE = 10;

const personRoleOptions: { value: PersonRoleCode; label: string }[] = [
  { value: "STUDENT", label: "Estudiante" },
  { value: "INTERN", label: "Pasante" },
  { value: "TEACHER", label: "Docente" },
  { value: "ASSISTANT", label: "Auxiliar" },
];

const userRoleOptions: { value: UserRoleCode; label: string }[] = [
  { value: "ADMINISTRATOR", label: "Administrador" },
  { value: "USER", label: "Usuario" },
];

interface Filters {
  name: string;
  username: string;
  personRole: PersonRoleCode | "";
  userRole: UserRoleCode | "";
}

interface ActionState {
  userId: number;
  type: "edit" | "status";
}

async function getErrorMessage(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return typeof data?.message === "string" ? data.message : fallback;
}

async function getUserDetail(userId: number) {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "No se pudo obtener el usuario."));
  }
  return (await response.json()) as UserDetail;
}

export default function UsersTable({ currentUserId }: { currentUserId: number | null }) {
  const [users, setUsers] = useState<User[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [personRole, setPersonRole] = useState<PersonRoleCode | "">("");
  const [userRole, setUserRole] = useState<UserRoleCode | "">("");
  const [filters, setFilters] = useState<Filters>({
    name: "",
    username: "",
    personRole: "",
    userRole: "",
  });
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ActionState | null>(null);
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [editPersonRole, setEditPersonRole] = useState<PersonRoleCode>("STUDENT");
  const [editUserRole, setEditUserRole] = useState<UserRoleCode>("USER");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (filters.name) params.set("name", filters.name);
    if (filters.username) params.set("username", filters.username);
    if (filters.personRole) params.set("person_role", filters.personRole);
    if (filters.userRole) params.set("user_role", filters.userRole);

    const response = await fetch(`/api/users?${params.toString()}`);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, "No se pudieron cargar los usuarios."));
    }

    const data = (await response.json()) as UserListResponse;
    if (!Array.isArray(data.items) || typeof data.count !== "number") {
      throw new Error("El servidor devolvió una respuesta de usuarios inválida.");
    }

    setUsers(data.items);
    setCount(data.count);
    setError(null);
    return data;
  }, [filters, page]);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setLoading(true);
      try {
        const data = await fetchUsers();
        if (active && data.items.length === 0 && data.count > 0 && page > 1) {
          setPage(Math.ceil(data.count / PAGE_SIZE));
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadUsers();
    return () => {
      active = false;
    };
  }, [fetchUsers, page, reloadTrigger]);

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setFilters({
      name: name.trim(),
      username: username.trim(),
      personRole,
      userRole,
    });
    setReloadTrigger((current) => current + 1);
  };

  const handleClearFilters = () => {
    setName("");
    setUsername("");
    setPersonRole("");
    setUserRole("");
    setPage(1);
    setFilters({ name: "", username: "", personRole: "", userRole: "" });
    setReloadTrigger((current) => current + 1);
  };

  const handleOpenEdit = async (userId: number) => {
    setAction({ userId, type: "edit" });
    try {
      const detail = await getUserDetail(userId);
      setEditingUser(detail);
      setEditPersonRole(detail.person.person_role.code);
      setEditUserRole(detail.user_role.code);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo obtener el usuario.");
    } finally {
      setAction(null);
    }
  };

  const handleSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;

    setSavingEdit(true);
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_role_code: editPersonRole,
          user_role_code: editUserRole,
        }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "No se pudieron actualizar los roles."));
      }

      setEditingUser(null);
      setReloadTrigger((current) => current + 1);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudieron actualizar los roles.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    setAction({ userId, type: "status" });
    try {
      const detail = await getUserDetail(userId);
      const nextActive = !detail.is_active;
      const verb = nextActive ? "activar" : "suspender";

      if (!window.confirm(`¿Estás seguro de que deseas ${verb} a ${detail.username}?`)) return;

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextActive }),
      });
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            nextActive ? "No se pudo activar el usuario." : "No se pudo suspender el usuario.",
          ),
        );
      }

      setReloadTrigger((current) => current + 1);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo cambiar el estado del usuario.");
    } finally {
      setAction(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <div className="space-y-4">
        <form
          onSubmit={handleFilter}
          className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:grid-cols-2 xl:grid-cols-4"
        >
          <label className="space-y-1.5 text-sm text-neutral-300">
            <span className="block font-medium">Nombre</span>
            <input
              type="search"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Buscar por nombre"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none placeholder:text-neutral-500 focus:border-sky-400/60"
            />
          </label>

          <label className="space-y-1.5 text-sm text-neutral-300">
            <span className="block font-medium">Usuario</span>
            <input
              type="search"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Buscar por username"
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none placeholder:text-neutral-500 focus:border-sky-400/60"
            />
          </label>

          <label className="space-y-1.5 text-sm text-neutral-300">
            <span className="block font-medium">Rol de persona</span>
            <select
              value={personRole}
              onChange={(event) => setPersonRole(event.target.value as PersonRoleCode | "")}
              className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-sky-400/60"
            >
              <option value="">Todos</option>
              {personRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm text-neutral-300">
            <span className="block font-medium">Rol de usuario</span>
            <select
              value={userRole}
              onChange={(event) => setUserRole(event.target.value as UserRoleCode | "")}
              className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-sky-400/60"
            >
              <option value="">Todos</option>
              {userRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2 md:col-span-2 xl:col-span-4">
            <button
              type="submit"
              className="rounded-lg border border-sky-500/30 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-200 transition-colors hover:bg-sky-500/25"
            >
              Filtrar
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/10"
            >
              Limpiar
            </button>
          </div>
        </form>

        {error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : loading && users.length === 0 ? (
          <div className="text-sm text-sky-300">Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-400">
            No se encontraron usuarios.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-neutral-300">
                <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-neutral-400">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Usuario</th>
                    <th className="px-4 py-4 font-semibold">Nombre</th>
                    <th className="px-4 py-4 font-semibold">Email</th>
                    <th className="px-4 py-4 font-semibold">Rol de persona</th>
                    <th className="px-4 py-4 font-semibold">Rol de usuario</th>
                    <th className="px-4 py-4 font-semibold">Estado</th>
                    <th className="px-4 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => {
                    const fullName = [
                      user.person.name,
                      user.person.paternal_surname,
                      user.person.maternal_surname,
                    ]
                      .filter(Boolean)
                      .join(" ");
                    const busy = action?.userId === user.id;
                    const isCurrentUser = user.id === currentUserId;

                    return (
                      <tr key={user.id} className="transition-colors hover:bg-white/5">
                        <td className="px-4 py-4 font-medium text-white">{user.username}</td>
                        <td className="px-4 py-4">{fullName}</td>
                        <td className="px-4 py-4">{user.person.email}</td>
                        <td className="px-4 py-4">{user.person.person_role.name}</td>
                        <td className="px-4 py-4">{user.user_role.name}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${
                              user.is_active
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                : "border-red-500/20 bg-red-500/10 text-red-300"
                            }`}
                          >
                            {user.is_active ? "Activo" : "Suspendido"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {isCurrentUser ? (
                            <span className="text-neutral-600">—</span>
                          ) : (
                            <div className="flex min-w-max gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(user.id)}
                                disabled={action !== null}
                                className="rounded border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-300 transition-colors hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {busy && action.type === "edit" ? "Cargando…" : "Editar"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user.id)}
                                disabled={action !== null}
                                className={`rounded border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                  user.is_active
                                    ? "border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                }`}
                              >
                                {busy && action.type === "status"
                                  ? "Procesando…"
                                  : user.is_active
                                    ? "Suspender"
                                    : "Activar"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {count} {count === 1 ? "usuario" : "usuarios"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => current - 1)}
                  disabled={page === 1 || loading}
                  className="rounded border border-white/10 px-3 py-1.5 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <span>
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page >= totalPages || loading}
                  className="rounded border border-white/10 px-3 py-1.5 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
        >
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl"
          >
            <div>
              <h3 id="edit-user-title" className="text-lg font-semibold text-white">
                Editar roles
              </h3>
              <p className="mt-1 text-sm text-neutral-400">
                {editingUser.username} · {editingUser.person.email}
              </p>
            </div>

            <label className="block space-y-1.5 text-sm text-neutral-300">
              <span className="font-medium">Rol de persona</span>
              <select
                value={editPersonRole}
                onChange={(event) => setEditPersonRole(event.target.value as PersonRoleCode)}
                className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-sky-400/60"
              >
                {personRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5 text-sm text-neutral-300">
              <span className="font-medium">Rol de usuario</span>
              <select
                value={editUserRole}
                onChange={(event) => setEditUserRole(event.target.value as UserRoleCode)}
                className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-sky-400/60"
              >
                {userRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={savingEdit}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-lg border border-sky-500/30 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-200 transition-colors hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingEdit ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
