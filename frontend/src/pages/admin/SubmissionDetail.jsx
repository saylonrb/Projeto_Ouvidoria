import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { getStatusInfo } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

export default function SubmissionDetail() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/submissions/${id}`);
      const data = response?.data || response;
      setSubmission(data);
      if (data?.status) setNewStatus(data.status);
    } catch (err) {
      console.error('Erro ao buscar demanda', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const handleUpdateStatus = async (statusToSet = newStatus) => {
    try {
      setUpdating(true);
      setFeedbackMsg('');
      await api.patch(`/admin/submissions/${id}/status`, {
        status: statusToSet,
        comment: comment.trim() || `Status alterado para ${statusToSet} pelo administrador.`
      });
      setFeedbackMsg('Status atualizado com sucesso!');
      setIsModalOpen(false);
      fetchSubmission();
    } catch (err) {
      setFeedbackMsg(err.response?.data?.message || 'Erro ao atualizar status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-12"><Spinner /></div>;
  if (!submission) return <div className="text-center mt-12 text-red-500 font-bold">Demanda não encontrada.</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/demandas" className="text-gray-500 hover:text-brand-600 transition-colors">
          &larr; Voltar
        </Link>
        <h2 className="text-2xl font-bold text-gray-800 m-0">
          Detalhes da Demanda
        </h2>
      </div>

      {feedbackMsg && (
        <div className="mb-4 p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
          {feedbackMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-mono text-xs text-gray-500 mb-1 block">Protocolo: {submission.protocol}</span>
                <h3 className="text-xl font-bold text-gray-800">{submission.title}</h3>
              </div>
              <Badge variant={getStatusInfo(submission.status).variant}>
                {getStatusInfo(submission.status).label}
              </Badge>
            </div>
            
            <p className="text-gray-700 whitespace-pre-wrap mt-4">{submission.description}</p>
            
            <hr className="my-6 border-gray-100" />
            
            <h4 className="font-bold text-gray-800 mb-3">Localização</h4>
            <p className="text-sm text-gray-600">{submission.address || submission.neighborhood || 'Não informada'}</p>
            {submission.latitude && submission.longitude && (
              <p className="text-xs text-gray-400 mt-1 font-mono">Coords: {submission.latitude}, {submission.longitude}</p>
            )}
          </div>

          {currentUser?.role !== 'AUDITOR' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h4 className="font-bold text-gray-800 mb-2">Ações de Atendimento</h4>
              <p className="text-sm text-gray-600 mb-4">
                Atualize o andamento desta demanda para notificar o cidadão e manter o histórico organizado.
              </p>
              <div className="flex gap-3">
                <Button variant="primary" onClick={() => { setNewStatus(submission.status); setIsModalOpen(true); }}>
                  Atualizar Andamento
                </Button>
              </div>
            </div>
          )}

          {/* Histórico de Status */}
          {submission.statusHistory && submission.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h4 className="font-bold text-gray-800 mb-4">Histórico de Alterações</h4>
              <div className="flex flex-col gap-3">
                {submission.statusHistory.map((hist) => (
                  <div key={hist.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <Badge variant={getStatusInfo(hist.status).variant}>{getStatusInfo(hist.status).label}</Badge>
                      <span className="text-xs text-gray-400">{new Date(hist.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    {hist.comment && <p className="text-gray-600 text-xs mt-1">{hist.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="font-bold text-gray-800 mb-3">Dados do Cidadão</h4>
            <div className="text-sm text-gray-600 flex flex-col gap-2">
              <p><strong>Nome:</strong> {submission.user?.name}</p>
              <p><strong>Email:</strong> {submission.user?.email}</p>
              <p><strong>Telefone:</strong> {submission.user?.phone || 'Não informado'}</p>
              <p><strong>Data de Abertura:</strong> {new Date(submission.createdAt).toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="font-bold text-gray-800 mb-3">Classificação e IA</h4>
            <div className="text-sm text-gray-600 flex flex-col gap-2">
              <p><strong>Categoria:</strong> {submission.category?.name || 'Não classificado'}</p>
              <p><strong>Processado por IA:</strong> {submission.aiProcessed ? 'Sim' : 'Não'}</p>
              {submission.masterTicket && (
                <div className="mt-2 p-3 bg-brand-50 border border-brand-100 rounded-lg">
                  <p className="text-xs text-brand-600 font-bold mb-1">Vinculado à Demanda Agrupada:</p>
                  <Link to={`/admin/tickets-ia/${submission.masterTicket.id}`} className="text-sm text-brand-700 hover:underline">
                    {submission.masterTicket.internalCode}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Alterar Status */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Atualizar Andamento da Demanda"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={() => handleUpdateStatus()} isLoading={updating}>Salvar Andamento</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            A alteração de andamento ficará salva no histórico e o cidadão poderá acompanhar essa mudança na área dele.
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Novo Status</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="RECEIVED">Recebido</option>
              <option value="TRIAGED">Triado</option>
              <option value="FORWARDED">Encaminhado ao Setor</option>
              <option value="IN_PROGRESS">Em Atendimento</option>
              <option value="TEAM_DISPATCHED">Equipe em Deslocamento</option>
              <option value="COMPLETED">Concluído / Resolvido</option>
              <option value="REJECTED">Indeferido / Rejeitado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Observações / Justificativa</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800"
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Digite um comentário que será enviado ao cidadão..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
