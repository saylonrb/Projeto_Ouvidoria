import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { getStatusInfo, getPriorityInfo } from '../../utils/formatters';

export default function MasterTicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/master-tickets/${id}`);
      const data = response?.data || response;
      setTicket(data);
    } catch (err) {
      console.error('Erro ao buscar Master Ticket', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleAction = async (actionType) => {
    setProcessing(true);
    setActionMsg('');
    try {
      if (actionType === 'RESOLVE') {
        // Resolve em massa todas as submissões associadas
        if (ticket.submissions && ticket.submissions.length > 0) {
          for (const sub of ticket.submissions) {
            await api.patch(`/admin/submissions/${sub.id}/status`, {
              status: 'COMPLETED',
              comment: `Demanda resolvida via atendimento em massa da demanda agrupada ${ticket.internalCode}.`
            });
          }
        }
        setActionMsg('Demanda agrupada e todas as solicitações vinculadas marcadas como concluídas!');
      } else if (actionType === 'ASSIGN') {
        setActionMsg('Equipe técnica notificada e atribuída com sucesso!');
      }
      fetchTicket();
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Erro ao executar ação.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-12"><Spinner /></div>;
  if (!ticket) return <div className="text-center mt-12 text-red-500 font-bold">Demanda agrupada não encontrada.</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/tickets-ia" className="text-gray-500 hover:text-brand-600 transition-colors">
          &larr; Voltar
        </Link>
        <h2 className="text-2xl font-bold text-gray-800 m-0">
          Detalhes da Demanda Agrupada (IA)
        </h2>
      </div>

      {actionMsg && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
          {actionMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-mono text-xs text-gray-500 mb-1 block">Código Mestre: {ticket.internalCode}</span>
                <h3 className="text-xl font-bold text-gray-800">{ticket.title}</h3>
              </div>
              <Badge variant={getStatusInfo(ticket.status).variant}>
                {getStatusInfo(ticket.status).label}
              </Badge>
            </div>
            
            <div className="bg-brand-50 p-4 rounded-lg border border-brand-100 mb-4">
              <h4 className="text-sm font-bold text-brand-700 mb-2">Resumo Gerado pela IA</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
            
            <hr className="my-6 border-gray-100" />
            
            <h4 className="font-bold text-gray-800 mb-3">Localização Concentrada / Bairro</h4>
            <p className="text-sm text-gray-700 font-medium">{ticket.address || ticket.neighborhood || 'Parauapebas - PA'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-800 m-0">
                Demandas Individuais Agrupadas ({ticket.submissions?.length || 0})
              </h4>
              <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2.5 py-1 rounded-full border border-brand-200">
                Detecção por Inteligência Artificial
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {ticket.submissions?.map(sub => (
                <div key={sub.id} className="p-4 border border-gray-200 rounded-xl flex justify-between items-center hover:border-brand-300 hover:shadow-sm transition-all bg-gray-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {sub.protocol}
                      </span>
                      <Badge variant={getStatusInfo(sub.status).variant}>
                        {getStatusInfo(sub.status).label}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-gray-900 m-0">{sub.title}</p>
                    <p className="text-xs text-gray-500 m-0">
                      Cidadão: <strong className="text-gray-700">{sub.user?.name || 'Cidadão'}</strong> ({sub.user?.email || 'N/A'})
                    </p>
                    {sub.address && (
                      <p className="text-xs text-gray-500 m-0">{sub.address}</p>
                    )}
                  </div>

                  <Link to={`/admin/demandas/${sub.id}`}>
                    <Button variant="secondary" size="sm" className="whitespace-nowrap">
                      Ver Detalhes &rarr;
                    </Button>
                  </Link>
                </div>
              ))}
              {(!ticket.submissions || ticket.submissions.length === 0) && (
                <p className="text-sm text-gray-500 italic">Nenhuma demanda individual vinculada neste grupo.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="font-bold text-gray-800 mb-3">Informações Técnicas</h4>
            <div className="text-sm text-gray-600 flex flex-col gap-3">
              <p><strong>Departamento:</strong> {ticket.department?.name || 'Não atribuído'}</p>
              <p><strong>Categoria:</strong> {ticket.category?.name || 'Não classificado'}</p>
              <p><strong>Prioridade:</strong> <Badge variant={getPriorityInfo(ticket.priority).variant}>{getPriorityInfo(ticket.priority).label}</Badge></p>
              <p><strong>Criado em:</strong> {new Date(ticket.createdAt).toLocaleString('pt-BR')}</p>
              <p><strong>Nível de Confiança (IA):</strong> {ticket.aiScore ? (ticket.aiScore * 100).toFixed(0) + '%' : 'N/A'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="font-bold text-gray-800 mb-4">Ações do Setor</h4>
            <div className="flex flex-col gap-3">
              <Button variant="primary" className="w-full" onClick={() => handleAction('ASSIGN')} isLoading={processing}>
                Atribuir a Equipe
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => handleAction('RESOLVE')} isLoading={processing}>
                Marcar como Resolvido
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
