import UsersTable from "./UsersTable";
import EmailForm from "./EmailForm";

export default async function UsersPage() {
  return (
    <div className="space-y-6">
      {/* Email Form */}
      <EmailForm />

      {/* Users List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Lista de Usuarios
        </h2>
        <UsersTable />
      </div>
    </div>
  );
}