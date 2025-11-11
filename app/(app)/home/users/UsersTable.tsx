"use client";

import { useEffect, useState } from "react";
import type { User } from "./types";

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch("/api/users");
        
        if (!res.ok) {
          throw new Error("Error al cargar usuarios");
        }
        
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-500">Cargando usuarios...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="space-y-3">
            {/* Usuario */}
            <div>
              <span className="text-sm font-semibold text-gray-700">Usuario: </span>
              <span className="text-sm text-gray-900">{user.username}</span>
            </div>

            {/* Nombre Completo */}
            <div>
              <span className="text-sm font-semibold text-gray-700">Nombre completo: </span>
              <span className="text-sm text-gray-900">
                {user.persona.nombres} {user.persona.apellido_paterno} {user.persona.apellido_materno}
              </span>
            </div>

            {/* Rol (Sistema) */}
            <div>
              <span className="text-sm font-semibold text-gray-700">Rol: </span>
              <span className="text-sm text-gray-900">{user.rol_user.nombre}</span>
            </div>

            {/* Rol en la institución */}
            <div>
              <span className="text-sm font-semibold text-gray-700">Rol en la institución: </span>
              <span className="text-sm text-gray-900">{user.persona.rol_persona.nombre}</span>
            </div>
          </div>
        </div>
      ))}

      {users.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          No hay usuarios registrados
        </div>
      )}
    </div>
  );
}