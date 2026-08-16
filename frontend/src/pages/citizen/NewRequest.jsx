import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function NewRequest() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Meio de comunicação: 'TEXT', 'VOICE', 'PHOTO'
  const [commMode, setCommMode] = useState('TEXT');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPlaybackUrl, setAudioPlaybackUrl] = useState(null);
  const [attachedPhotos, setAttachedPhotos] = useState([]);

  // Form State dinâmico adaptado por tipo
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('ouvidoria_draft');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      type: 'SOLICITACAO', // SOLICITACAO, RECLAMACAO, DENUNCIA, SUGESTAO, ELOGIO
      categoryId: '',
      categoryName: 'Triagem Automática por IA',
      complaintReason: 'Atraso na execução do serviço',
      previousProtocol: '',
      isAnonymous: true,
      denunciaType: 'Descarte Ilegal ou Crimes Ambientais',
      sugestaoScope: 'Toda a Cidade',
      sugestaoArea: 'Mobilidade & Transporte',
      praiseTargetType: 'Unidade ou Equipe de Atendimento',
      praisePersonOrUnit: '',
      title: '',
      description: '',
      location: '',
      lat: null,
      lng: null,
    };
  });

  useEffect(() => {
    localStorage.setItem('ouvidoria_draft', JSON.stringify(formData));
  }, [formData]);

  const manifestationTypes = [
    {
      id: 'SOLICITACAO',
      title: 'Solicitação / Reparo',
      icon: '',
      badge: 'Manutenção Urbana',
      color: 'border-blue-200 hover:border-blue-500 bg-blue-50/50',
      description: 'Pedido de tapa-buraco, troca de lâmpada queimada, limpeza de bueiro ou poda.',
    },
    {
      id: 'RECLAMACAO',
      title: 'Reclamação',
      icon: '',
      badge: 'Serviço/Prazo',
      color: 'border-amber-200 hover:border-amber-500 bg-amber-50/50',
      description: 'Insatisfação com atrasos de obras, mau atendimento público ou serviço incompleto.',
    },
    {
      id: 'DENUNCIA',
      title: 'Denúncia (Com Sigilo)',
      icon: '',
      badge: 'Irregularidade',
      color: 'border-red-200 hover:border-red-500 bg-red-50/50',
      description: 'Relato de ato ilícito, vazamento clandestino, descarte ilegal ou violação legal.',
    },
    {
      id: 'SUGESTAO',
      title: 'Sugestão de Melhoria',
      icon: '',
      badge: 'Ideias & Projetos',
      color: 'border-emerald-200 hover:border-emerald-500 bg-emerald-50/50',
      description: 'Proposta de projeto, ciclovia, nova praça ou ideia para o seu bairro.',
    },
    {
      id: 'ELOGIO',
      title: 'Elogio & Agradecimento',
      icon: '',
      badge: 'Reconhecimento',
      color: 'border-purple-200 hover:border-purple-500 bg-purple-50/50',
      description: 'Reconhecimento a um servidor, equipe médica, escola ou departamento.',
    },
  ];

  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const initialTextRef = useRef('');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startMediaRecorderFallback = (stream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioPlaybackUrl(url);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);

        setFormData((prev) => ({
          ...prev,
          description: prev.description
            ? `${prev.description}\n[Áudio Gravado da Manifestação]`
            : '[Áudio Gravado da Manifestação]',
        }));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error('MediaRecorder failed', e);
      setError('Seu navegador não suporta captura de áudio. Por favor, digite seu relato.');
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      return;
    }

    setError('');
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err) {
      console.error('Mic permission error:', err);
      setError('Acesso ao microfone negado. Por favor, permita a permissão de áudio no seu navegador para gravar.');
      return;
    }

    initialTextRef.current = formData.description || '';
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);

    // Gravador Primário Nativo HTML5 (Estável, nunca fecha sozinho)
    try {
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioPlaybackUrl(url);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);

        setFormData((prev) => ({
          ...prev,
          description: prev.description && !prev.description.includes('[Áudio Gravado')
            ? `${prev.description}\n[Áudio Gravado da Manifestação]`
            : (prev.description || '[Áudio Gravado da Manifestação]'),
        }));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error('MediaRecorder failed:', e);
      setError('Seu navegador não suporta captura de áudio. Por favor, digite seu relato.');
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      return;
    }

    // Transcrição secundária via voz (em segundo plano)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onresult = (event) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }
          const combined = initialTextRef.current
            ? `${initialTextRef.current}\n${fullTranscript.trim()}`
            : fullTranscript.trim();

          setFormData((prev) => ({ ...prev, description: combined }));
        };

        recognition.onerror = (e) => {
          console.warn('SpeechRecognition info:', e.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition background start skipped:', err);
      }
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file) => URL.createObjectURL(file));
    setAttachedPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleNext = () => {
    if (step === 1 && !formData.type) {
      setError('Por favor, selecione o tipo de manifestação.');
      return;
    }
    if (step === 3) {
      if (!formData.title.trim() || formData.title.trim().length < 3) {
        setError('Por favor, informe um título curto.');
        return;
      }
      if (!formData.description.trim() || formData.description.trim().length < 5) {
        setError('Por favor, forneça o relato da solicitação (mínimo 5 caracteres ou gravação de voz).');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const getLocationGPS = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            location: formData.location || 'Localização obtida via GPS',
          });
          setLoading(false);
          setError('');
        },
        () => {
          setError('Não foi possível obter sua localização GPS automaticamente. Digite o endereço manualmente.');
          setLoading(false);
        }
      );
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      let fullDescription = formData.description;
      if (formData.type === 'ELOGIO' && formData.praisePersonOrUnit) {
        fullDescription = `[Elogiado: ${formData.praiseTargetType} - ${formData.praisePersonOrUnit}]\n\n${fullDescription}`;
      } else if (formData.type === 'RECLAMACAO' && formData.previousProtocol) {
        fullDescription = `[Protocolo Anterior Relacionado: ${formData.previousProtocol}]\n[Motivo: ${formData.complaintReason}]\n\n${fullDescription}`;
      } else if (formData.type === 'DENUNCIA') {
        fullDescription = `[Tipo de Denúncia: ${formData.denunciaType}]\n[Sigilo Solicitado: ${formData.isAnonymous ? 'SIM (Manter Identidade Protegida)' : 'NÃO'}]\n\n${fullDescription}`;
      } else if (formData.type === 'SUGESTAO') {
        fullDescription = `[Área: ${formData.sugestaoArea}]\n[Alcance: ${formData.sugestaoScope}]\n\n${fullDescription}`;
      }

      const response = await api.post('/submissions', {
        type: formData.type,
        title: formData.title,
        description: fullDescription,
        address: formData.location,
        location: formData.location,
        latitude: formData.lat || undefined,
        longitude: formData.lng || undefined,
        categoryId: formData.categoryId || undefined,
      });
      
      const apiResponse = response?.data?.data || response?.data || response;
      const trackingProtocol = 
        apiResponse?.submission?.trackingProtocol ||
        apiResponse?.submission?.protocol ||
        apiResponse?.trackingProtocol ||
        apiResponse?.protocol || '';

      localStorage.removeItem('ouvidoria_draft');
      navigate('/minha-area', { 
        state: { message: 'Sua manifestação foi registrada com sucesso na Ouvidoria!' }
      });
    } catch (err) {
      if (err.response?.status === 401) {
        // Redireciona para login mantendo o estado
        navigate('/login?redirect=/nova-demanda');
        return;
      }
      setError(err.response?.data?.message || 'Erro ao enviar a demanda. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-12)' }}>
      <div className="card" style={{ maxWidth: '820px', margin: '0 auto', padding: 'var(--space-8)' }}>
        
        {/* Step Indicator */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h2>Registrar Nova Manifestação na Ouvidoria</h2>
          
          <div className="mt-4 mb-6 p-4 bg-brand-50 border border-brand-200 rounded-xl inline-block text-left animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                🤖
              </div>
              <div>
                <h4 className="text-brand-900 font-bold m-0 mb-1">Prefere conversar?</h4>
                <p className="text-sm text-brand-700 m-0 mb-2">
                  Fale com nosso assistente virtual em linguagem natural e ele preencherá tudo para você.
                </p>
                <button 
                  onClick={() => {
                    const fab = document.querySelector('.chatbot-fab');
                    if (fab) fab.click();
                  }}
                  className="text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Abrir Assistente Virtual
                </button>
              </div>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)' }}>
            Passo {step} de 4 — {
              step === 1 ? 'Tipo de Manifestação' : 
              step === 2 ? (
                formData.type === 'ELOGIO' ? 'Destinatário do Elogio' :
                formData.type === 'DENUNCIA' ? 'Opções de Sigilo & Categoria' :
                formData.type === 'SUGESTAO' ? 'Área da Proposta de Melhoria' :
                formData.type === 'RECLAMACAO' ? 'Motivo & Protocolos Anteriores' :
                'Setor / Categoria de Manutenção'
              ) : 
              step === 3 ? 'Comunicação e Relato' : 'Revisão e Envio'
            }
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
            {[1, 2, 3, 4].map((item) => (
              <div 
                key={item}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: step >= item ? 'var(--color-primary-500)' : 'var(--bg-surface)',
                  color: step >= item ? 'white' : 'var(--text-tertiary)',
                  border: `2px solid ${step >= item ? 'var(--color-primary-500)' : 'var(--border-default)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: 'var(--font-size-sm)'
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mb-6">
            {error}
          </div>
        )}

        {/* Passo 1: Seleção do Tipo de Manifestação */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-800 mb-2">1. Como deseja manifestar à Ouvidoria?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Cada opção possui um fluxo personalizado para o seu atendimento.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {manifestationTypes.map((item) => {
                const isSelected = formData.type === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setFormData({ ...formData, type: item.id })}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${item.color} ${
                      isSelected ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-md bg-white' : 'bg-white/80'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-3xl">{item.icon}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Passo 2 DINÂMICO PARA ELOGIO */}
        {step === 2 && formData.type === 'ELOGIO' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">2. Quem você gostaria de elogiar?</h3>
              <p className="text-sm text-gray-600">
                Identifique a equipe, servidor ou unidade municipal que prestou um excelente serviço.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Tipo do Elogiado:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  'Unidade ou Equipe de Atendimento',
                  'Servidor Específico / Médico / Atendente',
                  'Secretaria ou Órgão Municipal'
                ].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, praiseTargetType: t })}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      formData.praiseTargetType === t 
                        ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20' 
                        : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <Input
                label="Nome do Servidor, Posto de Saúde, Escola ou Equipe Elogiada"
                value={formData.praisePersonOrUnit}
                onChange={(e) => setFormData({ ...formData, praisePersonOrUnit: e.target.value })}
                placeholder="Ex: Dra. Juliana (UBS Cidade Nova) ou Equipe da Limpeza Urbana"
              />
            </div>
          </div>
        )}

        {/* Passo 2 DINÂMICO PARA DENÚNCIA */}
        {step === 2 && formData.type === 'DENUNCIA' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">2. Opções de Sigilo & Categoria da Denúncia</h3>
              <p className="text-sm text-gray-600">
                A Ouvidoria garante sigilo absoluto aos cidadãos que relatam irregularidades.
              </p>
            </div>

            {/* Proteção de Identidade */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
                <span className="text-sm font-bold text-red-900">
                  🔒 Manter minha identidade em SIGILO ABSOLUTO durante as investigações
                </span>
              </label>
              <p className="text-xs text-red-700 pl-8">
                Seus dados não serão divulgados nem repassados aos fiscais ou denunciados em nenhuma hipótese.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Selecione o Tipo de Irregularidade:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Descarte Ilegal de Lixo / Crimes Ambientais',
                  'Obra Irregular ou Ocupação Clandestina',
                  'Vandalismo ou Danos ao Patrimônio Público',
                  'Mau Atendimento ou Desvio de Conduta',
                  'Vigilância Sanitária & Alimentos',
                  'Perturbação do Sossego & Poluição Sonora'
                ].map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setFormData({ ...formData, denunciaType: dt })}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      formData.denunciaType === dt
                        ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-red-300'
                    }`}
                  >
                    {dt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Passo 2 DINÂMICO PARA SUGESTAO */}
        {step === 2 && formData.type === 'SUGESTAO' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">2. 💡 Área & Alcance da sua Sugestão</h3>
              <p className="text-sm text-gray-600">
                Conte-nos sobre a sua ideia para sabermos qual projeto municipal ela pode integrar.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Área Temática da Ideia:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    'Mobilidade & Transporte',
                    'Cultura, Esporte & Lazer',
                    'Educação & Tecnologia',
                    'Meio Ambiente & Praças',
                    'Saúde & Bem-Estar',
                    'Outra Área'
                  ].map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setFormData({ ...formData, sugestaoArea: area })}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        formData.sugestaoArea === area
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Alcance Beneficiado:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Meu Bairro / Comunitário', 'Toda a Cidade / Municipal'].map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => setFormData({ ...formData, sugestaoScope: scope })}
                      className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        formData.sugestaoScope === scope
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-gray-200 bg-white text-gray-700'
                      }`}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Passo 2 DINÂMICO PARA RECLAMACAO */}
        {step === 2 && formData.type === 'RECLAMACAO' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">2. Motivo da Reclamação</h3>
              <p className="text-sm text-gray-600">
                Nos ajude a identificar o gargalo do atendimento ou o problema ocorrido.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Motivo Principal:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Atraso na execução de obra ou serviço público',
                  'Mau atendimento em posto de saúde ou repartição',
                  'Falta de medicamentos ou insumos públicos',
                  'Serviço mal executado ou abandonado',
                  'Cobrança indevida de taxas ou IPTU'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setFormData({ ...formData, complaintReason: reason })}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      formData.complaintReason === reason
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <Input
                label="Número de Protocolo Anterior (Opcional - se for cobrança de chamado não atendido)"
                value={formData.previousProtocol}
                onChange={(e) => setFormData({ ...formData, previousProtocol: e.target.value })}
                placeholder="Ex: OUV-2026-000045"
              />
            </div>
          </div>
        )}

        {/* Passo 2 PADRÃO PARA SOLICITACAO (Secretarias Municipais) */}
        {step === 2 && formData.type === 'SOLICITACAO' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">2. 🛠️ Escolha o Setor de Manutenção Urbana</h3>
              <p className="text-sm text-gray-600">
                Selecione a secretaria responsável ou deixe que a Inteligência Artificial classifique para você.
              </p>
            </div>

            {/* Opção IA */}
            <div
              onClick={() => setFormData({ ...formData, categoryId: '', categoryName: 'Triagem Automática por IA' })}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                !formData.categoryId 
                  ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <h4 className="font-bold text-brand-700 text-sm">Classificação Automática por IA (Recomendado)</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    A IA analisará seu texto e direcionará imediatamente ao setor correto.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'cat-luz', name: 'Iluminação Pública & Postes' },
                { id: 'cat-buraco', name: 'Vias, Asfalto & Pavimentação' },
                { id: 'cat-agua', name: 'Água, Saneamento & Bueiros' },
                { id: 'cat-lixo', name: 'Limpeza Urbana & Lixo' },
                { id: 'cat-arvores', name: 'Praças, Parques & Podas' },
                { id: 'cat-transito', name: 'Trânsito & Transporte Público' },
                { id: 'cat-saude', name: 'Saúde & Zoonoses' },
                { id: 'cat-educacao', name: 'Educação, Creches & Escolas' },
                { id: 'cat-social', name: 'Assistência Social & Habitação' },
                { id: 'cat-ambiente', name: 'Meio Ambiente & Defesa Civil' },
                { id: 'cat-seguranca', name: 'Segurança & Guarda Municipal' },
                { id: 'cat-tributos', name: 'Tributos, Fiscalização & Alvarás' },
              ].map((cat) => {
                const isSelected = formData.categoryId === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setFormData({ ...formData, categoryId: cat.id, categoryName: cat.name })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/20' 
                        : 'border-gray-200 bg-white hover:border-brand-300'
                    }`}
                  >
                    <h5 className="font-bold text-xs text-gray-800">{cat.name}</h5>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Passo 3: Meio de Comunicação, Detalhes e Mídia */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                3. {
                  formData.type === 'ELOGIO' ? 'Escreva a Mensagem do Elogio' :
                  formData.type === 'DENUNCIA' ? 'Relato da Denúncia & Localização' :
                  formData.type === 'SUGESTAO' ? 'Detalhes da Proposta de Melhoria' :
                  formData.type === 'RECLAMACAO' ? 'Relato da Reclamação' :
                  'Como prefere comunicar sua solicitação?'
                }
              </h3>
              <p className="text-sm text-gray-600">
                Escolha o meio de comunicação mais confortável (texto, gravação por áudio ou fotos).
              </p>
            </div>

            {/* Tabs de Modo de Comunicação */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCommMode('TEXT')}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  commMode === 'TEXT'
                    ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Texto Escrito
              </button>

              <button
                type="button"
                onClick={() => setCommMode('VOICE')}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  commMode === 'VOICE'
                    ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Gravador por Áudio
              </button>

              <button
                type="button"
                onClick={() => setCommMode('PHOTO')}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  commMode === 'PHOTO'
                    ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Anexar Foto / Mídia
              </button>
            </div>

            {/* Modo Voz / Gravador */}
            {commMode === 'VOICE' && (
              <div className="p-6 bg-blue-50/70 border border-blue-200 rounded-2xl text-center space-y-4">
                <div className="max-w-md mx-auto">
                  <h4 className="text-sm font-bold text-blue-900 mb-1">
                    Gravação por Áudio / Ditado por Voz
                  </h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Clique no botão abaixo e fale. Sua voz será transcrita no relato automaticamente ou gravada em áudio.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleRecord}
                    className={`px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-md ${
                      isRecording 
                        ? 'bg-red-600 text-white ring-4 ring-red-200 animate-pulse' 
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                    }`}
                  >
                    {isRecording ? 'Parar Gravação' : 'Iniciar Gravação de Áudio'}
                  </button>

                  {isRecording ? (
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider block animate-pulse">
                        ● Gravando... {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
                      </span>
                      <span className="text-xs text-gray-500 block">Clique no botão para parar</span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-gray-700 block">
                      Clique no botão para iniciar a gravação
                    </span>
                  )}
                </div>

                {audioPlaybackUrl && (
                  <div className="mt-4 p-3 bg-white border border-blue-200 rounded-xl text-left shadow-sm">
                    <p className="text-xs font-bold text-gray-700 mb-1.5">
                      Prévia do seu Áudio Gravado:
                    </p>
                    <audio controls src={audioPlaybackUrl} className="w-full h-10 rounded-lg outline-none" />
                  </div>
                )}
              </div>
            )}

            {/* Modo Foto */}
            {commMode === 'PHOTO' && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-amber-900">
                  Selecione fotos de evidência:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-700"
                />

                {attachedPhotos.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {attachedPhotos.map((imgSrc, idx) => (
                      <img key={idx} src={imgSrc} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-amber-300" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Inputs Principais */}
            <Input
              label={
                formData.type === 'ELOGIO' ? 'Título do Elogio' :
                formData.type === 'DENUNCIA' ? 'Assunto / Resumo da Denúncia' :
                formData.type === 'SUGESTAO' ? 'Título da Proposta de Melhoria' :
                'Assunto / Título simples'
              }
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite um título resumido"
              required
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.type === 'ELOGIO' ? 'Mensagem de Agradecimento' : 'Relato Detalhado'}
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-brand-500 text-sm"
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva com detalhes o seu relato..."
                required
              />
            </div>

            <div>
              <Input
                label="Localização da Ocorrência (Endereço, Rua, Número e Bairro)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Av. Beira Rio, 450, Bairro Cidade Nova"
                required
              />
            </div>

          </div>
        )}

        {/* Passo 4: Revisão & Envio */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-800 mb-2">4. Revisar e Enviar para a Ouvidoria</h3>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Tipo de Manifestação:</span>
                <span className="font-bold text-brand-700 text-sm flex items-center gap-1.5 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
                  {manifestationTypes.find(m => m.id === formData.type)?.title}
                </span>
              </div>

              {formData.type === 'ELOGIO' && (
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Destinatário do Elogio:</span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {formData.praisePersonOrUnit || formData.praiseTargetType}
                  </span>
                </div>
              )}

              {formData.type === 'DENUNCIA' && (
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Proteção de Identidade:</span>
                  <span className="font-bold text-red-700 text-sm">
                    {formData.isAnonymous ? 'Sigilo Absoluto Solicitado' : 'Identificado'}
                  </span>
                </div>
              )}

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Título:</span>
                <p className="font-bold text-gray-900 text-base">{formData.title}</p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Relato:</span>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.description}</p>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Localização:</span>
                <p className="text-sm text-gray-700">{formData.location || 'Não informada'}</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-3">
              <p>Ao enviar, seu protocolo único será gerado e você poderá acompanhar o andamento em tempo real no site.</p>
            </div>
          </div>
        )}

        {/* Buttons Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
          <Button variant="ghost" onClick={handleBack} disabled={step === 1 || loading}>
            Voltar
          </Button>
          
          {step < 4 ? (
            <Button variant="primary" onClick={handleNext}>
              Próximo Passo &rarr;
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} isLoading={loading}>
              Enviar para a Ouvidoria
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
