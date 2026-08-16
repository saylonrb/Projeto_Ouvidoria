import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

// ── Renderiza markdown simplificado ─────────────────────────────
function renderMarkdown(text, onLinkClick) {
  if (!text) return null;

  // Divide por linhas para preservar quebras
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const parts = [];
    let remaining = line;
    let keyIdx = 0;

    // Processa padrões inline: **bold**, [link](url)
    const regex = /(\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\))/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(remaining)) !== null) {
      // Texto antes do match
      if (match.index > lastIndex) {
        parts.push(<span key={`t-${lineIdx}-${keyIdx++}`}>{remaining.substring(lastIndex, match.index)}</span>);
      }

      if (match[2]) {
        // **bold**
        parts.push(<strong key={`b-${lineIdx}-${keyIdx++}`}>{match[2]}</strong>);
      } else if (match[3] && match[4]) {
        // [text](url)
        const isInternal = match[4].startsWith('/');
        if (isInternal) {
          parts.push(
            <Link
              key={`l-${lineIdx}-${keyIdx++}`}
              to={match[4]}
              className="chat-link"
              onClick={onLinkClick}
            >
              {match[3]}
            </Link>
          );
        } else {
          parts.push(
            <a key={`l-${lineIdx}-${keyIdx++}`} href={match[4]} target="_blank" rel="noopener noreferrer" className="chat-link">
              {match[3]}
            </a>
          );
        }
      }

      lastIndex = regex.lastIndex;
    }

    // Texto restante
    if (lastIndex < remaining.length) {
      parts.push(<span key={`r-${lineIdx}-${keyIdx++}`}>{remaining.substring(lastIndex)}</span>);
    }

    return (
      <React.Fragment key={`line-${lineIdx}`}>
        {parts.length > 0 ? parts : remaining}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

// ── Componente Principal ────────────────────────────────────────
export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [wizardState, setWizardState] = useState({ step: 'idle', type: null, description: null, location: null });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Mensagem de boas-vindas ao abrir o chat pela primeira vez
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      sendToBackend('');
    }
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Foca no input ao abrir
  useEffect(() => {
    if (isOpen && !loading) {
      inputRef.current?.focus();
    }
  }, [isOpen, loading]);

  // Envia mensagem para o backend
  const sendToBackend = async (textToSend) => {
    const query = textToSend ?? input;
    if (loading) return;
    // Permite query vazia apenas na inicialização
    if (query !== '' && !query.trim()) return;

    // Adiciona mensagem do usuário (se não for a inicialização silenciosa)
    if (query.trim()) {
      setMessages(prev => [...prev, { id: Date.now(), text: query, sender: 'user' }]);
    }
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/chat', {
        message: query,
        wizardState,
        history: messages.slice(-6),
      });

      const data = response.data || response;
      const botText = data.response || 'Desculpe, ocorreu um erro. Tente novamente.';

      // Atualiza o wizardState do backend
      if (data.wizardState) {
        setWizardState(data.wizardState);
      }

      // Adiciona mensagem do bot
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: botText,
        sender: 'bot',
        options: data.options || null,
        protocolFound: data.protocolFound || null,
      }]);

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: 'Você precisa estar logado para falar comigo e abrir demandas. Por favor, faça seu login ou cadastre-se.',
          sender: 'bot',
          options: [
            { label: '🔑 Fazer Login', text: 'Quero fazer login agora', action: 'LOGIN' },
            { label: '📝 Cadastrar', text: 'Quero me cadastrar', action: 'REGISTER' }
          ]
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: 'Desculpe, não consegui me conectar com o servidor. Tente novamente em instantes.',
          sender: 'bot',
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendToBackend(input);
    }
  };

  const handleOptionClick = (opt) => {
    if (opt.action === 'LOGIN') {
      window.location.href = '/login?redirect=/minha-area';
      return;
    }
    if (opt.action === 'REGISTER') {
      window.location.href = '/login?register=true&redirect=/minha-area';
      return;
    }
    sendToBackend(opt.text || opt.label);
  };

  const resetChat = () => {
    setMessages([]);
    setWizardState({ step: 'idle', type: null, description: null, location: null });
    setSuggestions([]);
  };

  const handleSuggestionClick = (text) => {
    sendToBackend(text);
  };

  return (
    <>
      {/* Botão Flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir assistente virtual"
          className="chatbot-fab"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Janela do Chat */}
      {isOpen && (
        <div className="chatbot-window">

          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8" />
                  <rect x="4" y="8" width="16" height="12" rx="2" />
                  <path d="M2 14h2" />
                  <path d="M20 14h2" />
                  <path d="M15 13v2" />
                  <path d="M9 13v2" />
                </svg>
              </div>
              <div>
                <h4 className="chatbot-title">
                  {wizardState?.isHumanHandover ? 'Atendimento com Ouvidor' : 'Assistente — Ouvidoria'}
                </h4>
                <div className="chatbot-status">
                  <span className={`chatbot-status-dot ${wizardState?.isHumanHandover ? 'bg-amber-500' : ''}`} />
                  {wizardState?.isHumanHandover ? 'Fila Humana' : 'Online'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={resetChat} className="chatbot-close" aria-label="Limpar chat" title="Limpar conversa">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)} className="chatbot-close" aria-label="Fechar chat" title="Fechar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-msg-row ${msg.sender === 'user' ? 'chatbot-msg-user' : 'chatbot-msg-bot'}`}>
                <div className={`chatbot-bubble ${msg.sender === 'user' ? 'chatbot-bubble-user' : 'chatbot-bubble-bot'}`}>
                  <div className="chatbot-bubble-text">
                    {renderMarkdown(msg.text, () => setIsOpen(false))}
                  </div>

                  {/* Options buttons inside the bubble */}
                  {msg.options && msg.options.length > 0 && (
                    <div className="chatbot-options">
                      {msg.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOptionClick(opt)}
                          className="chatbot-option-btn"
                        >
                          <span>{opt.label}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-msg-row chatbot-msg-bot">
                <div className="chatbot-bubble chatbot-bubble-bot chatbot-typing">
                  <span className="chatbot-dot" /><span className="chatbot-dot" /><span className="chatbot-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !loading && (
            <div className="chatbot-suggestions">
              {suggestions.map((sug, idx) => (
                <button key={idx} onClick={() => handleSuggestionClick(sug)} className="chatbot-suggestion-pill">
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={loading}
              className="chatbot-input"
            />
            <button type="submit" disabled={loading || !input.trim()} className="chatbot-send-btn" aria-label="Enviar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
