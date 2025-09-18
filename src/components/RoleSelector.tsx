import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Calendar, User, Shield, AlertTriangle } from 'lucide-react';
import { isDevelopmentMode, getAuthConfig } from '../utils/authConfig';

export function RoleSelector() {
  const { setUserRole } = useAuth();
  const config = getAuthConfig();

  // Don't show role selector in production mode
  if (!isDevelopmentMode() || !config.enableRoleSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Selector de Roles No Disponible
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  El selector de roles está deshabilitado en modo producción.
                  Use el formulario de inicio de sesión completo.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 btn btn-primary"
                >
                  Ir al Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roles = [
    {
      id: 'Visualizador' as const,
      name: 'Visualizador',
      description: 'Solo lectura - Ver dashboard y reportes',
      icon: User,
      color: 'bg-blue-500 hover:bg-blue-600',
      permissions: ['Ver dashboard', 'Ver reportes', 'Consultar datos']
    },
    {
      id: 'Ejecutivo' as const,
      name: 'Ejecutivo',
      description: 'Gestión de eventos y facturación',
      icon: User,
      color: 'bg-green-500 hover:bg-green-600',
      permissions: ['Gestionar eventos', 'Crear facturas', 'Editar datos', 'Ver dashboard']
    },
    {
      id: 'Administrador' as const,
      name: 'Administrador',
      description: 'Acceso completo al sistema',
      icon: Shield,
      color: 'bg-red-500 hover:bg-red-600',
      permissions: ['Acceso completo', 'Gestión de usuarios', 'Configuración del sistema', 'Logs de actividad']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-3 mb-8">
          <Calendar className="h-12 w-12 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MADE</h1>
            <p className="text-sm text-gray-600">Event Manager Pro</p>
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">
          Seleccionar Rol de Usuario
        </h2>
        <p className="text-center text-sm text-gray-600 mb-8">
          Seleccione su rol para acceder al sistema (Modo Desarrollo)
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setUserRole(role.id)}
              className="bg-white rounded-lg shadow-xl p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-blue-200"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full ${role.color} text-white`}>
                  <role.icon className="h-8 w-8" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {role.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {role.description}
                  </p>
                </div>

                <div className="w-full">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Permisos incluidos:
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {role.permissions.map((permission, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>

                <button className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${role.color}`}>
                  Seleccionar {role.name}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Development Mode Notice */}
        <div className="mt-8 text-center mx-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Modo de Desarrollo
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Selector temporal de roles para desarrollo y pruebas. 
                    Si las credenciales de login no funcionan, use este selector para acceder 
                    como administrador y generar usuarios de prueba.
                  </p>
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <p><strong>Credenciales de desarrollo:</strong></p>
                    <p>admin@made.com / admin123 (Administrador)</p>
                    <p>ejecutivo@made.com / ejecutivo123 (Ejecutivo)</p>
                    <p>visualizador@made.com / visualizador123 (Visualizador)</p>
                  </div>
                  <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
                    <strong>Variable de entorno:</strong> VITE_AUTH_MODE={config.mode}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}