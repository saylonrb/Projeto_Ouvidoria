import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { getStatusInfo } from '../../utils/formatters';

export default function MasterTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const result = await api.get('/admin/master-tickets');
        setTickets(result.data || []);
      } catch (err) {
        console.error('Erro ao buscar tickets mestres', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2>Demandas Agrupadas pela IA</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Demandas repetidas sobre o mesmo problema agrupadas de forma inteligente.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <Spinner />
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
            Nenhuma demanda agrupada no momento.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Título Resumido (IA)</th>
                  <th>Categoria Resumida</th>
                  <th>Localização</th>
                  <th>Demandas Filhas</th>
                  <th>Status Único</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                      <div className="font-bold text-gray-800">{ticket.title}</div>
                      <div className="text-xs font-mono text-gray-400">{ticket.internalCode}</div>
                    </td>
                    <td>{typeof ticket.category === 'object' ? ticket.category?.name : (ticket.category || 'Não definida')}</td>
                    <td style={{ fontSize: 'var(--font-size-sm)' }}>
                      {ticket.neighborhood || ticket.address || 'Não informada'}
                    </td>
                    <td>
                      <Badge variant="warning">{ticket._count?.submissions || 0} vinculadas</Badge>
                    </td>
                    <td>
                      <Badge variant={getStatusInfo(ticket.status).variant}>
                        {getStatusInfo(ticket.status).label}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/tickets-ia/${ticket.id}`}>
                          <Button variant="secondary" size="sm">Ver Detalhes</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
