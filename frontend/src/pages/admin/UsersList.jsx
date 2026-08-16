import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('CITIZEN');
  const [isActive, setIsActive] = useState(true);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Erro ao buscar usuários', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setIsActive(user.isActive);
    setEditName(user.name);
    setEditEmail(user.email);
    setFeedback('');
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      setUpdating(true);
      await api.patch(`/admin/users/${editingUser.id}`, {
        role: selectedRole,
        isActive: isActive
      });
      setFeedback('Usuário atualizado com sucesso!');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Erro ao atualizar usuário.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/admin/users/${user.id}`);
      setFeedback(res.data?.message || 'Usuário excluído com sucesso!');
      fetchUsers();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Erro ao excluir usuário.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-12"><Spinner /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Usuários do Sistema</h2>
          <p className="text-gray-600">Gerenciamento de contas e permissões.</p>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
          {feedback}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
              <th className="p-4">Nome</th>
              <th className="p-4">Email</th>
              <th className="p-4">Perfil (Role)</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">Nenhum usuário encontrado.</td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{u.name}</td>
                  <td className="p-4 text-gray-600">{u.email}</td>
                  <td className="p-4">
                    <Badge variant={u.role === 'SUPER_ADMIN' ? 'danger' : (['COMUM', 'CITIZEN'].includes(u.role) ? 'success' : 'info')}>
                      {u.role === 'CITIZEN' ? 'Usuário Comum (COMUM)' : u.role === 'COMUM' ? 'Usuário Comum (COMUM)' : u.role}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {u.isActive ? (
                      <span className="flex items-center gap-1 text-sm text-green-600"><span className="w-2 h-2 rounded-full bg-green-500"></span> Ativo</span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-red-600"><span className="w-2 h-2 rounded-full bg-red-500"></span> Inativo</span>
                    )}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-3">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="text-brand-600 hover:text-brand-800 text-sm font-medium hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u)}
                      disabled={deleting || u.id === currentUser?.id}
                      className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline disabled:opacity-50"
                      title={u.id === currentUser?.id ? "Você não pode inativar a si mesmo" : "Inativar Usuário"}
                    >
                      Inativar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Editar Usuário */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Editar Permissões - ${editingUser?.name}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSaveUser} isLoading={updating}>Salvar Alterações</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nome (Somente Leitura)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed"
              value={editName}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail (Somente Leitura)</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed"
              value={editEmail}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Perfil / Função (Role)</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="COMUM">Usuário Comum (COMUM)</option>
              <option value="ATTENDANT">Atendente (ATTENDANT)</option>
              <option value="SECTOR_MANAGER">Gestor de Setor (SECTOR_MANAGER)</option>
              <option value="AUDITOR">Auditor de Controle (AUDITOR)</option>
              {currentUser?.role === 'SUPER_ADMIN' && (
                <option value="SUPER_ADMIN">Super Administrador (SUPER_ADMIN)</option>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="userActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={editingUser?.id === currentUser?.id}
              className="w-4 h-4 text-brand-600 rounded disabled:opacity-50"
            />
            <label htmlFor="userActive" className="text-sm font-semibold text-gray-700">
              Conta Ativa {editingUser?.id === currentUser?.id && '(Não é possível desativar a própria conta)'}
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
