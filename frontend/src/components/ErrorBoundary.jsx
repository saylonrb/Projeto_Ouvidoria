import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para que a próxima renderização mostre a UI de fallback.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Você também pode registrar o erro em um serviço de relatórios de erro
    console.error("ErrorBoundary pegou um erro:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Você pode renderizar qualquer UI de fallback customizada
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#e53e3e', fontSize: '2rem', marginBottom: '1rem' }}>Ops! Algo deu errado.</h1>
          <p style={{ color: '#4a5568', marginBottom: '2rem' }}>
            A aplicação encontrou um erro inesperado e não pôde carregar esta tela.
          </p>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3182ce',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Voltar para a Página Inicial
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
