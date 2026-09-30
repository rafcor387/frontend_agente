import UsersTable from "./UsersTable";

export default async function UsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Usuarios</h2>
        <p className="text-sm text-neutral-400">
          Lista de todos los usuarios registrados en el sistema.
        </p>
      </div>
      <UsersTable />
    </div>
  );
}