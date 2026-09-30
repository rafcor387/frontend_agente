import InvitationsClient from "./InvitationsClient";

export default function InvitationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Invitaciones</h2>
        <p className="text-sm text-neutral-400">
          Envía invitaciones por correo y gestiona el estado de las mismas.
        </p>
      </div>
      <InvitationsClient />
    </div>
  );
}
