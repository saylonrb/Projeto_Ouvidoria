import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  
  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-subtle)',
      paddingBlock: 'var(--space-12)',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-8)',
          marginBottom: 'var(--space-8)'
        }}>
          <div>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Ouvidoria Inteligente</h3>
            <p>Plataforma moderna para gestão e acompanhamento de demandas públicas municipais.</p>
          </div>
          <div>
            <h4 style={{ marginBottom: 'var(--space-4)' }}>Cidadão</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><Link to="/nova-demanda" className="text-gray-600 hover:text-brand-600 transition-colors">Abrir Demanda</Link></li>
              <li><Link to="/rastrear" className="text-gray-600 hover:text-brand-600 transition-colors">Rastrear Demanda</Link></li>
              <li><Link to="/demandas-publicas" className="text-gray-600 hover:text-brand-600 transition-colors">Consultar Demandas</Link></li>
              {user && (
                <li><Link to="/minha-area" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">Minha Área</Link></li>
              )}
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: 'var(--space-4)' }}>Informações</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <li><Link to="/faq">Perguntas Frequentes</Link></li>
              <li><Link to="/privacidade">Privacidade (LGPD)</Link></li>
              <li><a href="tel:0800000000">0800 000 0000</a></li>
            </ul>
          </div>
        </div>
        <div className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
          <p>&copy; {new Date().getFullYear()} Prefeitura Municipal. Todos os direitos reservados.</p>
          <p>Desenvolvido com foco em Acessibilidade e Transparência.</p>
        </div>
      </div>
    </footer>
  );
}
