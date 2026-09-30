import { getCurrentUser } from "@/lib/auth";
import UsersTable from "./UsersTable";

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Usuarios</h2>
        <p className="text-sm text-neutral-400">
          Consulta usuarios, administra sus roles y controla su acceso al sistema.
        </p>
      </div>
      <UsersTable currentUserId={currentUser?.id ?? null} />
    </div>
  );
}
