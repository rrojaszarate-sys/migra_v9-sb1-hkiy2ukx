import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../types/database';
import { Plus, Edit, Trash2, Search, Users, Shield, Eye, EyeOff, Key } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PasswordUpdateModal } from './PasswordUpdateModal';

export function UserManager() {
  const { user: currentUser, refreshSession } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Visualizador' as const,
    status: 'Activo' as const
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const logActivity = async (actionType: string, recordId: string, details: any) => {
    if (!currentUser) return;
    
    try {
      await supabase
        .from('activity_log')
        .insert([{
          user_email: currentUser.email,
          action_type: actionType,
          affected_table: 'users',
          record_id: parseInt(recordId),
          details
        }]);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser?.role !== 'Administrador') {
      alert('Solo los administradores pueden gestionar usuarios');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        const { data, error } = await supabase
          .from('users')
          .update(formData)
          .eq('id', editingUser.id)
          .select()
          .single();

        if (error) throw error;

        setUsers(users.map(u => u.id === editingUser.id ? data : u));
        await logActivity('UPDATE', editingUser.id, { 
          old: editingUser, 
          new: data 
        });
      } else {
        // Create new user via Edge Function
        let { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          // Try to refresh the session if it's invalid but user context indicates we should be authenticated
          if (currentUser && refreshSession) {
            await refreshSession();
            const { data: refreshedSession } = await supabase.auth.getSession();
            session = refreshedSession;
          }
          
          if (!session.session) {
            throw new Error('No active session');
          }
        }

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create',
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            status: formData.status
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create user');
        }

        const { user: data } = await response.json();

        setUsers([data, ...users]);
        await logActivity('CREATE', data.id, data);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(`Error al guardar usuario: ${error.message}`);
    }
  };

  const handleEdit = (user: User) => {
    if (currentUser?.role !== 'Administrador') {
      alert('Solo los administradores pueden editar usuarios');
      return;
    }

    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status
    });
    setShowForm(true);
  };

  const handlePasswordUpdate = (user: User) => {
    if (currentUser?.role !== 'Administrador') {
      alert('Solo los administradores pueden cambiar contraseñas');
      return;
    }

    setPasswordUser(user);
    setShowPasswordModal(true);
  };

  const handlePasswordSuccess = (temporaryPassword?: string) => {
    setShowPasswordModal(false);
    setPasswordUser(null);
    
    if (temporaryPassword) {
      alert(`Contraseña actualizada exitosamente.\n\nContraseña temporal: ${temporaryPassword}\n\nGuarde esta información de forma segura.`);
    } else {
      alert('Contraseña actualizada exitosamente.');
    }
  };
  const handleToggleStatus = async (user: User) => {
    if (currentUser?.role !== 'Administrador') {
      alert('Solo los administradores pueden cambiar el estado de usuarios');
      return;
    }

    if (user.id === currentUser.id) {
      alert('No puede desactivar su propia cuenta');
      return;
    }

    const newStatus = user.status === 'Activo' ? 'Inactivo' : 'Activo';
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          status: newStatus
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUsers(users.map(u => u.id === user.id ? data : u));
      await logActivity('UPDATE', user.id, {
        field: 'status',
        old_value: user.status,
        new_value: newStatus
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error al cambiar el estado del usuario');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'Visualizador',
      status: 'Activo'
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrador':
        return 'bg-red-100 text-red-800';
      case 'Editor':
        return 'bg-blue-100 text-blue-800';
      case 'Visualizador':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Activo' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (currentUser?.role !== 'Administrador') {
    return (
      <div className="text-center py-8">
        <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
        <p className="text-gray-500">Solo los administradores pueden acceder a la gestión de usuarios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Administración de Usuarios</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Usuario
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los roles</option>
            <option value="Administrador">Administrador</option>
            <option value="Editor">Editor</option>
            <option value="Visualizador">Visualizador</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
          <div className="text-sm text-gray-500 flex items-center">
            Total: {filteredUsers.length} usuarios
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingUser ? 'Editar Usuario' : 'Agregar Usuario'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  disabled={!!editingUser}
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña Inicial *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Visualizador">Visualizador</option>
                  <option value="Editor">Editor</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Actualizar' : 'Crear Usuario'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        {user.id === currentUser.id && (
                          <div className="text-xs text-blue-600">(Tú)</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at 
                      ? new Date(user.created_at).toLocaleDateString('es-MX')
                      : 'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      title="Editar usuario"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </button>
                    <button
                      onClick={() => handlePasswordUpdate(user)}
                      className="text-purple-600 hover:text-purple-900 inline-flex items-center ml-3"
                      title="Cambiar contraseña"
                    >
                      <Key className="h-4 w-4 mr-1" />
                      Contraseña
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={user.id === currentUser.id}
                      className={`inline-flex items-center ml-3 ${
                        user.id === currentUser.id 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : user.status === 'Activo'
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                      }`}
                      title={user.id === currentUser.id ? 'No puede desactivar su propia cuenta' : 
                             user.status === 'Activo' ? 'Desactivar usuario' : 'Activar usuario'}
                    >
                      {user.status === 'Activo' ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Activar
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Update Modal */}
      {showPasswordModal && passwordUser && (
        <PasswordUpdateModal
          user={passwordUser}
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordUser(null);
          }}
          onSuccess={handlePasswordSuccess}
        />
      )}

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
          <p className="text-gray-500">
            {searchTerm || roleFilter || statusFilter
              ? 'No hay usuarios que coincidan con los filtros aplicados.'
              : 'Aún no hay usuarios registrados en el sistema.'
            }
          </p>
        </div>
      )}
    </div>
  );
}