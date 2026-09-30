"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 10;

const invitationStatuses = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "CANCELADA", label: "Cancelada" },
  { value: "ACEPTADA", label: "Aceptada" },
  { value: "EXPIRADA", label: "Expirada" },
] as const;

type InvitationStatus = (typeof invitationStatuses)[number]["value"];

interface Invitation {
  id: number;
  email: string;
  person_role: {
    id: number;
    code: string;
    name: string;
  };
  status: InvitationStatus;
  invited_by: {
    id: number;
    username: string;
    full_name: string;
  };
  created_at: string;
}

interface InvitationListResponse {
  count: number;
  items: Invitation[];
}

interface Filters {
  email: string;
  status: InvitationStatus | "";
}

const statusLabels = Object.fromEntries(
  invitationStatuses.map(({ value, label }) => [value, label]),
) as Record<InvitationStatus, string>;

const statusStyles: Record<InvitationStatus, string> = {
  PENDIENTE: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  CANCELADA: "bg-red-500/10 text-red-300 border-red-500/20",
  ACEPTADA: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  EXPIRADA: "bg-neutral-500/10 text-neutral-300 border-neutral-500/20",
};

async function getErrorMessage(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return typeof data?.message === "string" ? data.message : fallback;
}

export default function InvitationsTable({ refreshTrigger }: { refreshTrigger: number }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<InvitationStatus | "">("");
  const [filters, setFilters] = useState<Filters>({ email: "", status: "" });
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  const fetchInvitations = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (filters.email) params.set("email", filters.email);
    if (filters.status) params.set("status", filters.status);

    const response = await fetch(`/api/invitations?${params.toString()}`);
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "No se pudo cargar las invitaciones."),
      );
    }

    const data = (await response.json()) as InvitationListResponse;
    if (!Array.isArray(data.items) || typeof data.count !== "number") {
      throw new Error("El servidor devolvió una respuesta de invitaciones inválida.");
    }

    setInvitations(data.items);
    setCount(data.count);
    setError(null);
    return data;
  }, [filters, page]);

  useEffect(() => {
    let active = true;

    async function loadInvitations() {
      setLoading(true);
      try {
        await fetchInvitations();
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "No se pudo cargar las invitaciones.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInvitations();
    return () => {
      active = false;
    };
  }, [fetchInvitations, refreshTrigger, reloadTrigger]);

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setFilters({ email: email.trim(), status });
    setReloadTrigger((current) => current + 1);
  };

  const handleClearFilters = () => {
    setEmail("");
    setStatus("");
    setPage(1);
    setFilters({ email: "", status: "" });
    setReloadTrigger((current) => current + 1);
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta invitación?")) return;

    setCancelingId(id);
    try {
      const response = await fetch(`/api/invitations/${id}/cancel`, { method: "POST" });
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "No se pudo cancelar la invitación."),
        );
      }

      const data = await fetchInvitations();
      if (data.items.length === 0 && page > 1) setPage((current) => current - 1);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "No se pudo cancelar la invitación.",
      );
    } finally {
      setCancelingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="mt-8 space-y-4">
      <form
        onSubmit={handleFilter}
        className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end"
      >
        <label className="space-y-1.5 text-sm text-neutral-300">
          <span className="block font-medium">Email invitado</span>
          <input
            type="search"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Buscar por email"
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none placeholder:text-neutral-500 focus:border-sky-400/60"
          />
        </label>

        <label className="space-y-1.5 text-sm text-neutral-300">
          <span className="block font-medium">Estado</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as InvitationStatus | "")}
            className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-sky-400/60"
          >
            <option value="">Todos</option>
            {invitationStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
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
      ) : loading && invitations.length === 0 ? (
        <div className="text-sm text-sky-300">Cargando invitaciones...</div>
      ) : invitations.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-400">
          No se encontraron invitaciones.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-neutral-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Email invitado</th>
                  <th className="px-6 py-4 font-semibold">Rol</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold">Invitado por</th>
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="transition-colors hover:bg-white/5">
                    <td className="px-6 py-4 font-medium text-white">{invitation.email}</td>
                    <td className="px-6 py-4">{invitation.person_role.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${statusStyles[invitation.status]}`}
                      >
                        {statusLabels[invitation.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {invitation.invited_by.full_name || invitation.invited_by.username}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(invitation.created_at).toLocaleString("es-BO", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {invitation.status === "PENDIENTE" ? (
                        <button
                          type="button"
                          onClick={() => handleCancel(invitation.id)}
                          disabled={cancelingId !== null}
                          className="rounded border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancelingId === invitation.id ? "Cancelando…" : "Cancelar"}
                        </button>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {count} {count === 1 ? "invitación" : "invitaciones"}
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
  );
}
