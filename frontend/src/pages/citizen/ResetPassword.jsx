import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function ResetPassword() {

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingBlock: 'var(--space-12)' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: 'var(--space-8)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'var(--gradient-brand)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 'var(--font-size-xl)',
            margin: '0 auto var(--space-4)'
          }}>
            <span style={{ fontSize: '32px' }}>🔒</span>
          </div>
          <h2>Recuperação de Senha</h2>
        </div>

        <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--color-warning-50, #fffbeb)',
            color: 'var(--color-warning-700, #92400e)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            border: '1px solid var(--color-warning-200, #fde68a)'
          }}>
            <p style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Funcionalidade em desenvolvimento</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              A recuperação de senha por e-mail estará disponível em breve. Por enquanto, entre em contato com a Ouvidoria pelo telefone 156 ou WhatsApp (94) 99999-0156 para redefinir sua senha.
            </p>
          </div>
          <Link to="/login">
            <Button variant="secondary" fullWidth>Voltar ao Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
