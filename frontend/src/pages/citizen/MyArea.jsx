import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

export default function MyArea() {
  const { user, updateUserProfile } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySubmissions = async () => {
      try {
        const response = await api.get('/submissions/me');
        const list = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : (response?.data?.data || []));
        setSubmissions(list);
      } catch (err) {
        console.error('Erro ao buscar demandas do usuário', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchMySubmissions();
    }
  }, [user]);

  const [profileData, setProfileData] = useState({ name: '', phone: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      setProfileMsg('');
      const res = await api.put('/auth/profile', {
        name: profileData.name,
        phone: profileData.phone,
      });
      const updated = res.data || res;
      if (updateUserProfile) {
        updateUserProfile({ name: updated.name, phone: updated.phone });
      }
      setProfileMsg('Perfil atualizado com sucesso!');
      setEditingProfile(false);
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Erro ao atualizar perfil.');
    } finally {
      setSaveLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const map = {
      RECEIVED: { label: 'Recebido', color: 'neutral' },
      AI_PROCESSING: { label: 'Análise IA', color: 'info' },
      TRIAGED: { label: 'Triado', color: 'info' },
      FORWARDED: { label: 'Encaminhado', color: 'primary' },
      IN_PROGRESS: { label: 'Em Andamento', color: 'warning' },
      COMPLETED: { label: 'Resolvido', color: 'success' },
      REJECTED: { label: 'Rejeitado', color: 'danger' }
    };
    return map[status] || map.RECEIVED;
  };

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <div>
          <h2>Minha Área</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Bem-vindo(a), {user?.name}.</p>
        </div>
        <Link to="/nova-demanda">
          <Button variant="primary">Nova Demanda</Button>
        </Link>
      </div>

      {/* Profile Card */}
      <div className="card mb-8 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg">
              {user?.name ? user.name[0].toUpperCase() : '👤'}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 m-0">{user?.name}</h3>
              <p className="text-xs text-gray-500 m-0">{user?.email}</p>
              <p className="text-xs font-semibold text-brand-700 m-0 mt-0.5">
                📞 Telefone / WhatsApp: {user?.phone || profileData.phone || <span className="text-gray-400 font-normal">Não cadastrado</span>}
              </p>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={() => setEditingProfile(!editingProfile)}>
            {editingProfile ? 'Cancelar' : 'Editar Perfil'}
          </Button>
        </div>

        {profileMsg && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 text-xs text-blue-800 rounded-lg">
            {profileMsg}
          </div>
        )}

        {editingProfile && (
          <form onSubmit={handleUpdateProfile} className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3 items-end max-w-xl">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="(94) 99999-0000"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button type="submit" variant="primary" size="sm" isLoading={saveLoading}>
              Salvar Alterações
            </Button>
          </form>
        )}
      </div>

      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-6)' }}>Histórico de Solicitações</h3>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <Spinner />
          </div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)', opacity: 0.5 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <p>Você ainda não registrou nenhuma demanda.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Assunto</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const statusInfo = getStatusInfo(sub.status);
                  const protocolNumber = sub.protocol || sub.trackingProtocol || 'OUV-S/N';
                  const locationText = sub.address || sub.neighborhood || sub.location || 'Localização não informada';
                  return (
                    <tr key={sub.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', fontWeight: 'bold' }}>
                        {protocolNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{sub.title}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{locationText}</div>
                      </td>
                      <td style={{ fontSize: 'var(--font-size-sm)' }}>
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>
                      </td>
                      <td>
                        <Link to={`/rastrear?protocol=${protocolNumber}`}>
                          <Button variant="ghost" size="sm">Detalhes</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
