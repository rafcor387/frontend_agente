'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CreatePasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Recuperamos el token (el ID ya no es estrictamente necesario para el backend en este paso,
  // pero el token es vital).
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Enlace inválido. Falta el token de seguridad.');
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!token) return;

    // Validación simple de coincidencia
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      // Endpoint del backend (ajusta la ruta si es necesario)
      const response = await fetch('http://127.0.0.1:8000/usuarios/users/register-complete/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // LA LLAVE MAESTRA: El token va en la cabecera
          'Invitation-Token': token, 
        },
        body: JSON.stringify({
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la cuenta.');
      }

      setSuccess(true);

      // Opcional: Redirigir al login después de unos segundos
      setTimeout(() => {
        // Asumiendo que tienes una página de login
        router.push('/login'); 
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900">
        <div className="p-6 bg-white rounded shadow text-red-600 font-bold">
          {error || 'Token no encontrado.'}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">¡Registro Exitoso!</h2>
          <p className="text-gray-700 mb-4">
            Tu cuenta ha sido creada correctamente.
          </p>
          <p className="text-sm text-gray-500">
            Redirigiendo al inicio de sesión...
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Ir al Login ahora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Crear Contraseña
        </h2>
        <p className="text-center text-gray-600 mb-6 text-sm">
          Crea una contraseña segura para acceder al sistema.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900">Nueva Contraseña</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-black p-2 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">Confirmar Contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white text-black p-2 focus:border-blue-500 focus:outline-none"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition disabled:bg-green-300 font-medium"
          >
            {loading ? 'Creando cuenta...' : 'Finalizar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CreatePasswordPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-black">Cargando...</div>}>
      <CreatePasswordForm />
    </Suspense>
  );
}