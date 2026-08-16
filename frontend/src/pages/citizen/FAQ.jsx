import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await api.get('/knowledge-base');
        // A API retorna { status: 'success', data: [...] } e o interceptor retorna response.data
        setFaqs(response.data || response || []);
      } catch (err) {
        console.error('Erro ao buscar FAQ', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(search.toLowerCase()) ||
    faq.answer.toLowerCase().includes(search.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  // Agrupar por categoria
  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const cat = faq.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-12)', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h2>Central de Ajuda</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Como podemos ajudar você hoje?</p>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <Input 
          placeholder="Pesquisar por dúvidas, termos ou categorias..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="mb-0"
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <Spinner />
        </div>
      ) : Object.keys(groupedFaqs).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
          Nenhum resultado encontrado para "{search}".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {Object.entries(groupedFaqs).map(([category, items]) => (
            <div key={category}>
              <h3 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-primary-600)', borderBottom: '2px solid var(--color-primary-100)', paddingBottom: 'var(--space-2)' }}>
                {category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {items.map(faq => (
                  <div key={faq.id} className="card card-hover" style={{ padding: 'var(--space-4)' }}>
                    <h4 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-2)' }}>
                      {faq.question}
                    </h4>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      {faq.answer}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                      {faq.tags.map(tag => (
                        <span key={tag} style={{ fontSize: '10px', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-tertiary)' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
