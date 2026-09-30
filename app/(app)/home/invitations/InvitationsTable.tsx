"use client";
import { useEffect, useState } from "react";

interface Invitation {
  id: number;
  email: string;
  person_role: {
    id: number;
    code: string;
    name: string;
  };
  status: string;
  invited_by: {
    id: number;
    username: string;
    full_name: string;
  };
  created_at: string;
}

export default function InvitationsTable({ refreshTrigger }: { refreshTrigger: number }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/invitations")
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo cargar las invitaciones");
        return res.json() as Promise<Invitation[]>;
      })
      .then((data) => {
        setInvitations(data);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading && invitations.length === 0) {
    return <div className="text-sky-300 text-sm mt-4">Cargando invitaciones...</div>;
  }

  if (error) {
    return <div className="text-red-400 text-sm mt-4">{error}</div>;
  }

  if (invitations.length === 0) {
    return <div className="text-neutral-400 text-sm mt-4">No hay invitaciones registradas.</div>;
  }

  return (
    <div className="mt-8 border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="text-xs uppercase bg-white/5 text-neutral-400 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-semibold">Email Invitado</th>
              <th className="px-6 py-4 font-semibold">Rol</th>
              <th className="px-6 py-4 font-semibold">Estado</th>
              <th className="px-6 py-4 font-semibold">Invitado por</th>
              <th className="px-6 py-4 font-semibold">Fecha</th>
              <th className="px-6 py-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invitations.map((inv) => (
              <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{inv.email}</td>
                <td className="px-6 py-4">{inv.person_role.name}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      inv.status === "PENDIENTE"
                        ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
                        : inv.status === "ACEPTADA"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : "bg-neutral-500/10 text-neutral-300 border-neutral-500/20"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {inv.invited_by.full_name || inv.invited_by.username}
                </td>
                <td className="px-6 py-4">
                  {new Date(inv.created_at).toLocaleString("es-VE", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-6 py-4">
                  {/* Espacio reservado para los botones de acciones futuras */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
