import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

export default function TrackRequest() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [protocol, setProtocol] = useState(searchParams.get('protocol') || '');
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const protoFromUrl = searchParams.get('protocol');
    if (protoFromUrl) {
      setProtocol(protoFromUrl.toUpperCase());
      handleSearch(protoFromUrl.toUpperCase());
    }
  }, []); // eslint-disable-line

  const handleSearch = async (protocolToSearch) => {
    const query = protocolToSearch || protocol;
    if (!query) return;

    setLoading(true);
    setError('');
    setSubmission(null);
    setSearchParams({ protocol: query.toUpperCase() });

    try {
      const result = await api.get(`/submissions/track/${query.toUpperCase()}`);
      setSubmission(result.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Protocolo não encontrado. Verifique se o código foi digitado corretamente (Ex: OUV-2026-000051).');
      } else {
        setError('Erro ao buscar a solicitação. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    RECEIVED: { label: 'Recebido', color: 'neutral', stepIndex: 1, desc: 'Sua demanda foi registrada e aguarda análise.' },
    AI_PROCESSING: { label: 'Análise IA', color: 'info', stepIndex: 2, desc: 'A IA está classificando o problema e verificando ocorrências parecidas.' },
    TRIAGED: { label: 'Triado', color: 'info', stepIndex: 2, desc: 'Classificação concluída e prioridade definida.' },
    FORWARDED: { label: 'Encaminhado ao Setor', color: 'primary', stepIndex: 3, desc: 'Enviado para a Secretaria / Departamento responsável para ação.' },
    IN_PROGRESS: { label: 'Em Andamento', color: 'warning', stepIndex: 4, desc: 'Equipe técnica responsável executando o atendimento no local.' },
    COMPLETED: { label: 'Resolvido / Concluído', color: 'success', stepIndex: 5, desc: 'Serviço finalizado e registrado na Ouvidoria.' },
    REJECTED: { label: 'Rejeitado / Arquivado', color: 'danger', stepIndex: -1, desc: 'Solicitação não pôde ser atendida ou dados insuficientes.' }
  };

  const getStatusInfo = (status) => statusMap[status] || statusMap.RECEIVED;

  // Constrói o histórico dinâmico de timeline combinando o histórico real com os marcos do ciclo de vida
  const buildTimeline = (sub) => {
    const history = sub.statusHistory && sub.statusHistory.length > 0 ? sub.statusHistory : [];
    
    const steps = [
      {
        status: 'RECEIVED',
        title: 'Solicitação Registrada',
        description: 'Demanda aberta no sistema de Ouvidoria.',
        date: sub.createdAt,
        done: true,
      },
      {
        status: 'TRIAGED',
        title: 'Triagem & Classificação por IA',
        description: sub.category?.name 
          ? `Classificado na categoria "${sub.category.name}" com análise automática.` 
          : 'Demanda analisada e categorizada para encaminhamento.',
        date: sub.createdAt,
        done: ['TRIAGED', 'FORWARDED', 'IN_PROGRESS', 'COMPLETED'].includes(sub.status),
      },
      {
        status: 'FORWARDED',
        title: 'Encaminhado ao Setor Técnico',
        description: sub.masterTicket?.department
          ? `Solicitação recebida pela secretaria responsável: ${sub.masterTicket.department}.`
          : 'Solicitação recebida pela Secretaria Responsável para agendamento de equipe.',
        date: sub.updatedAt,
        done: ['FORWARDED', 'IN_PROGRESS', 'COMPLETED'].includes(sub.status),
      },
      {
        status: 'IN_PROGRESS',
        title: 'Em Atendimento / Execução',
        description: 'Equipe técnica mobilizada realizando os reparos ou verificações no local.',
        date: sub.updatedAt,
        done: ['IN_PROGRESS', 'COMPLETED'].includes(sub.status),
      },
      {
        status: 'COMPLETED',
        title: 'Atendimento Concluído',
        description: 'Serviço finalizado e verificado pela fiscalização da Ouvidoria.',
        date: sub.updatedAt,
        done: sub.status === 'COMPLETED',
      }
    ];

    if (sub.status === 'REJECTED') {
      steps.push({
        status: 'REJECTED',
        title: 'Solicitação Arquivada',
        description: 'A solicitação foi analisada e arquivada pela administração.',
        date: sub.updatedAt,
        done: true,
        isError: true,
      });
    }

    // Mescla comentários reais do backend se existirem
    if (history.length > 0) {
      history.forEach((h) => {
        const match = steps.find(s => s.status === h.status);
        if (match) {
          match.comment = h.comment;
          match.date = h.createdAt;
        }
      });
    }

    return steps;
  };

  return (
    <div className="container py-8 md:py-12">
      
      {/* Header & Search */}
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2">
          Rastrear Demanda
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Acompanhe em tempo real todas as etapas do atendimento da sua solicitação.
        </p>

        <div className="flex gap-2 max-w-md mx-auto">
          <Input 
            placeholder="Ex: OUV-2026-000051" 
            value={protocol}
            onChange={(e) => setProtocol(e.target.value.toUpperCase())}
            containerClassName="flex-1"
          />
          <Button 
            variant="primary" 
            onClick={() => handleSearch(protocol)} 
            isLoading={loading}
          >
            Buscar
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-left">
            <span className="font-bold text-red-600">Erro: </span> {error}
          </div>
        )}
      </div>

      {/* Main Track Detail Card */}
      {submission && (
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
          
          {/* Status Header Banner */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-brand-900 text-white flex flex-wrap justify-between items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-brand-300 font-semibold">Protocolo de Atendimento</span>
              <h3 className="text-2xl font-mono font-bold tracking-tight text-white mt-0.5">
                {submission.trackingProtocol || submission.protocol}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-300 block mb-1">Status Atual</span>
              <Badge variant={getStatusInfo(submission.status).color} className="text-xs px-3 py-1 font-bold">
                {getStatusInfo(submission.status).label}
              </Badge>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* Visual Process Stepper Bar */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Progresso do Atendimento
              </h4>

              <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-600 transition-all duration-500 z-0"
                  style={{
                    width: `${
                      submission.status === 'REJECTED' ? 100 :
                      submission.status === 'COMPLETED' ? 100 :
                      submission.status === 'IN_PROGRESS' ? 75 :
                      submission.status === 'FORWARDED' ? 50 :
                      submission.status === 'TRIAGED' ? 25 : 10
                    }%`
                  }}
                ></div>

                {/* Steps Circles */}
                {[
                  { key: 'RECEIVED', label: 'Recebido', icon: '' },
                  { key: 'TRIAGED', label: 'Triagem IA', icon: '' },
                  { key: 'FORWARDED', label: 'Encaminhado', icon: '' },
                  { key: 'IN_PROGRESS', label: 'Em Andamento', icon: '' },
                  { key: 'COMPLETED', label: 'Resolvido', icon: '' },
                ].map((st, idx) => {
                  const currentStep = getStatusInfo(submission.status).stepIndex;
                  const stepNum = idx + 1;
                  const isDone = currentStep >= stepNum && submission.status !== 'REJECTED';
                  const isCurrent = currentStep === stepNum && submission.status !== 'REJECTED';

                  return (
                    <div key={st.key} className="relative z-10 flex flex-col items-center group">
                      <div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          isDone 
                            ? 'bg-brand-600 text-white shadow-md' 
                            : isCurrent
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                            : 'bg-white border-2 border-gray-300 text-gray-400'
                        }`}
                      >
                        {isDone ? '✓' : ''}
                      </div>
                      <span className={`text-[11px] font-semibold mt-2 hidden sm:block ${
                        isDone || isCurrent ? 'text-gray-900 font-bold' : 'text-gray-400'
                      }`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Demand Summary Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 m-0">{submission.title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed m-0">{submission.description}</p>
              
              <div className="pt-3 border-t border-gray-200 flex flex-wrap justify-between items-center text-xs text-gray-600 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5">
                    <strong>Local:</strong> {submission.location || submission.address || 'Não especificado'}
                  </span>
                  {submission.masterTicket?.department && (
                    <span className="flex items-center gap-1.5 text-brand-700">
                      <strong>Secretaria Responsável:</strong> {submission.masterTicket.department}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 text-right">
                  <span className="flex items-center gap-1.5 justify-end">
                    <strong>Registrado em:</strong> {new Date(submission.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="flex items-center gap-1.5 justify-end text-amber-700">
                    <strong>Prazo Previsto:</strong> {
                      new Date(new Date(submission.createdAt).setDate(new Date(submission.createdAt).getDate() + 30)).toLocaleDateString('pt-BR')
                    }
                  </span>
                </div>
              </div>

              {submission.masterTicketId && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
                  <span className="text-brand-600 font-bold ml-2">Agrupado por IA</span>
                  <span>
                    <strong>Agrupamento Inteligente de IA:</strong> Esta solicitação foi vinculada a um grupo de atendimento no seu bairro para agilizar o reparo coletivo.
                  </span>
                </div>
              )}
            </div>

            {/* Dynamic Chronological Timeline */}
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                Histórico e Linha do Tempo de Atendimento
              </h4>

              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {buildTimeline(submission).map((item, idx) => (
                  <div key={idx} className="relative flex flex-col items-start group">
                    
                    {/* Node Dot */}
                    <div 
                      className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white transition-colors ${
                        item.isError 
                          ? 'bg-red-500' 
                          : item.done 
                          ? 'bg-brand-600 ring-2 ring-brand-100' 
                          : 'bg-gray-300'
                      }`}
                    ></div>

                    <div className="flex justify-between items-baseline w-full">
                      <h5 className={`text-sm font-bold ${item.done ? 'text-gray-900' : 'text-gray-400'}`}>
                        {item.title}
                      </h5>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {item.date ? new Date(item.date).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>

                    <p className={`text-xs mt-1 ${item.done ? 'text-gray-600' : 'text-gray-400'}`}>
                      {item.description}
                    </p>

                    {item.comment && (
                      <div className="mt-2 p-2.5 bg-blue-50 border-l-2 border-brand-500 text-xs text-blue-900 rounded-r">
                        <strong>Nota do Atendente:</strong> {item.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Public Submissions Link CTA */}
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">Dúvidas sobre o protocolo?</span>
              <Link to="/demandas-publicas" className="text-xs font-bold text-brand-600 hover:underline">
                Consultar Demais Demandas &rarr;
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
