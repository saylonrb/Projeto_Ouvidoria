import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

export default function SubmissionsList() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page,
        limit: 15,
        ...(statusFilter && { status: statusFilter })
      });
      const result = await api.get(`/admin/submissions?${query}`);
      setSubmissions(result.data || []);
      setTotalPages(result.meta?.totalPages || 1);
    } catch (err) {
      console.error('Erro ao buscar demandas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [page, statusFilter]); // eslint-disable-line

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2>Gestão de Demandas</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Acompanhe e gerencie todas as solicitações dos cidadãos.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <select 
            className="form-input" 
            style={{ maxWidth: '200px' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Todos os Status</option>
            <option value="RECEIVED">Recebido</option>
            <option value="TRIAGED">Triado</option>
            <option value="FORWARDED">Encaminhado</option>
            <option value="IN_PROGRESS">Em Andamento</option>
            <option value="COMPLETED">Resolvido</option>
            <option value="REJECTED">Rejeitado</option>
          </select>
          <Button variant="ghost" onClick={() => { setStatusFilter(''); setPage(1); }}>
            Limpar Filtros
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <Spinner />
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Protocolo / Data</th>
                    <th>Cidadão</th>
                    <th>Assunto / Local</th>
                    <th>Status</th>
                    <th>IA</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => (
                    <tr key={sub.id}>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{sub.protocol}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div>{sub.user?.name || 'Anônimo'}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{sub.user?.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{sub.title}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{sub.address || sub.neighborhood || 'Localização não informada'}</div>
                      </td>
                      <td>
                        <Badge variant={getStatusInfo(sub.status).color}>{getStatusInfo(sub.status).label}</Badge>
                      </td>
                      <td>
                        {sub.masterTicketId ? (
                          <Badge variant="warning" title="Agrupado por IA">Agrupado</Badge>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <Link to={`/admin/demandas/${sub.id}`}>
                          <Button variant="secondary" size="sm">Analisar</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                Página {page} de {totalPages}
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button 
                  variant="ghost" size="sm" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </Button>
                <Button 
                  variant="ghost" size="sm" 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
