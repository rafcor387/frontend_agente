'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const id = searchParams.get('id');

  const [formData, setFormData] = useState({
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    rol_persona_id: '', // Inicialmente vacío para obligar a seleccionar
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !id) {
      setError('El enlace de invitación es inválido o está incompleto.');
    }
  }, [token, id]);

  // CAMBIO AQUÍ: Permitimos HTMLInputElement O HTMLSelectElement
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!token || !id) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/usuarios/users/persona/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Invitation-Token': token,
        },
        body: JSON.stringify({
          nombres: formData.nombres,
          apellido_paterno: formData.apellido_paterno,
          apellido_materno: formData.apellido_materno,
          rol_persona_id: Number(formData.rol_persona_id),
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes permiso o la invitación ha expirado.');
        }
        throw new Error('Error al guardar los datos.');
      }

      router.push(`/create-password?token=${token}&id=${id}`);

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900">
        <div className="p-6 bg-white rounded shadow text-red-600 font-bold">
          {error || 'Faltan parámetros en la URL.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Completa tus datos
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900">Nombres</label>
            <input
              type="text"
              name="nombres"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-black p-2 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">Apellido Paterno</label>
            <input
              type="text"
              name="apellido_paterno"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-black p-2 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">Apellido Materno</label>
            <input
              type="text"
              name="apellido_materno"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-black p-2 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
            />
          </div>

          {/* --- AQUÍ ESTÁ EL DROPDOWN (SELECT) --- */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Rol / Cargo</label>
            <select
              name="rol_persona_id"
              required
              value={formData.rol_persona_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-black p-2 focus:border-blue-500 focus:outline-none"
            >
              {/* Opción por defecto deshabilitada */}
              <option value="" disabled>Selecciona un rol</option>
              
              {/* Las opciones que pediste */}
              <option value="1">Docente</option>
              <option value="2">Auxiliar</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">Selecciona tu función en la institución.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition disabled:bg-blue-300 font-medium"
          >
            {loading ? 'Guardando...' : 'Siguiente'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-black">Cargando formulario...</div>}>
      <RegisterForm />
    </Suspense>
  );
}