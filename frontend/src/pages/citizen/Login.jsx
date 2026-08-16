import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Sincroniza estado com parametro de URL ?register=true
    const registerParam = searchParams.get('register');
    setIsRegister(registerParam === 'true');
  }, [searchParams]);

  useEffect(() => {
    // Inicializa o Google Sign-In
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        callback: handleGoogleResponse
      });
      
      const btnContainer = document.getElementById("google-button");
      if (btnContainer) {
        window.google.accounts.id.renderButton(
          btnContainer,
          { theme: "outline", size: "large", width: "100%", text: "continue_with" }
        );
      }
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      setLoading(true);
      const user = await googleLogin(response.credential);
      if (['SUPER_ADMIN', 'SECTOR_MANAGER', 'ATTENDANT'].includes(user?.role)) {
        navigate('/admin');
      } else {
        const redirectTo = searchParams.get('redirect') || '/minha-area';
        navigate(redirectTo);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao conectar com Google');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSwitchTab = (toRegister) => {
    setIsRegister(toRegister);
    setError('');
    setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    if (toRegister) {
      setSearchParams({ register: 'true' });
    } else {
      setSearchParams({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        if (formData.password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('As senhas não coincidem. Verifique o campo de confirmação.');
          setLoading(false);
          return;
        }

        await register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });
        const redirectTo = searchParams.get('redirect') || '/minha-area';
        navigate(redirectTo);
      } else {
        const user = await login(formData.email, formData.password);
        if (['SUPER_ADMIN', 'SECTOR_MANAGER', 'ATTENDANT'].includes(user?.role)) {
          navigate('/admin');
        } else {
          const redirectTo = searchParams.get('redirect') || '/minha-area';
          navigate(redirectTo);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err?.message || 'Erro ao realizar autenticação. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingBlock: 'var(--space-12)' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: 'var(--space-8)' }}>
        
        {/* Tab Header Switcher */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
              !isRegister
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleSwitchTab(false)}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
              isRegister
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleSwitchTab(true)}
          >
            Cadastrar-se
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h2>{isRegister ? 'Crie sua conta' : 'Acesse o sistema'}</h2>
          <p className="text-sm text-gray-500 mt-1">Ouvidoria Municipal Inteligente</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {isRegister && (
            <Input
              label="Nome Completo"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Digite seu nome completo"
            />
          )}

          <Input
            label="E-mail"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="seu@email.com"
          />

          {isRegister && (
            <Input
              label="Telefone / WhatsApp (Opcional)"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(94) 99999-0000"
            />
          )}

          <Input
            label="Senha"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder={isRegister ? "Mínimo 6 caracteres" : "Sua senha"}
          />

          {isRegister && (
            <Input
              label="Confirmar Senha"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repita sua senha"
            />
          )}

          {!isRegister && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/recuperar-senha" style={{ fontSize: 'var(--font-size-sm)' }}>
                Esqueceu a senha?
              </Link>
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth isLoading={loading}>
            {isRegister ? 'Cadastrar' : 'Entrar'}
          </Button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', marginBlock: 'var(--space-6)' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
          <span style={{ padding: '0 var(--space-3)', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
            OU
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
        </div>

        <div id="google-button"></div>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-size-sm)' }}>
          {isRegister ? (
            <span>
              Já tem uma conta?{' '}
              <button
                type="button"
                className="text-brand-600 font-bold hover:underline"
                onClick={() => handleSwitchTab(false)}
              >
                Faça login
              </button>
            </span>
          ) : (
            <span>
              Não tem conta?{' '}
              <button
                type="button"
                className="text-brand-600 font-bold hover:underline"
                onClick={() => handleSwitchTab(true)}
              >
                Cadastre-se
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
