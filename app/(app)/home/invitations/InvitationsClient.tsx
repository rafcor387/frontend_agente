"use client";
import { useState } from "react";
import EmailForm from "../users/EmailForm";
import InvitationsTable from "./InvitationsTable";

export default function InvitationsClient() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      {/* Formulario */}
      <div className="max-w-2xl">
        <EmailForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      </div>

      {/* Tabla */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Historial de invitaciones</h3>
        <InvitationsTable refreshTrigger={refreshKey} />
      </div>
    </div>
  );
}
