import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 py-24 overflow-hidden">
        {/* Decorator background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white backdrop-blur-sm text-sm font-semibold mb-8 animate-slideInUp">
            <span className="w-2 h-2 rounded-full bg-accent-yellow animate-pulse"></span>
            Portal Oficial de Serviços
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 animate-slideInUp tracking-tight" style={{ animationDelay: '0.1s' }}>
            Ouvidoria Municipal <br className="hidden md:block" /> de Parauapebas
          </h1>
          
          <p className="text-lg md:text-xl text-brand-50 max-w-2xl mx-auto mb-10 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
            Registre, acompanhe e resolva demandas urbanas com transparência. 
            A prefeitura trabalhando junto com você por uma cidade melhor.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slideInUp" style={{ animationDelay: '0.3s' }}>
            {/* Opção 1: Formulário */}
            <div className="flex flex-col items-center bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 w-full max-w-sm hover:bg-white/20 transition-all hover:-translate-y-1">
              <h3 className="text-xl font-bold text-white mb-2">Opção 1: Formulário</h3>
              <p className="text-sm text-brand-100 mb-6 text-center">
                Preencha detalhadamente a sua solicitação passo a passo.
              </p>
              <Link to="/nova-demanda" className="w-full px-6 py-3 bg-white text-brand-900 font-bold rounded-xl shadow-lg hover:bg-gray-50 transition-all text-center">
                Preencher Formulário
              </Link>
            </div>

            {/* Opção 2: Chatbot */}
            <div className="flex flex-col items-center bg-brand-900/40 p-6 rounded-2xl backdrop-blur-md border border-brand-400/30 w-full max-w-sm hover:bg-brand-900/60 transition-all hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-yellow/20 rounded-full blur-2xl pointer-events-none"></div>
              <h3 className="text-xl font-bold text-accent-yellow mb-2">Opção 2: Assistente Virtual</h3>
              <p className="text-sm text-brand-100 mb-6 text-center">
                Prefere conversar? Fale com nosso assistente em linguagem natural.
              </p>
              <button 
                onClick={() => {
                  const fab = document.querySelector('.chatbot-fab');
                  if (fab) fab.click();
                }}
                className="w-full px-6 py-3 bg-accent-yellow hover:bg-yellow-400 text-brand-900 font-bold rounded-xl shadow-lg transition-all text-center"
              >
                Conversar no Chat
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <Link to="/rastrear" className="inline-block px-8 py-3 bg-transparent hover:bg-white/10 border border-white/30 text-white font-bold rounded-xl transition-all">
              Rastrear Solicitação Existente
            </Link>
          </div>
        </div>
      </section>

      {/* Features / Como Funciona */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">Como Funciona</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Sua participação é fundamental. Veja como é simples solicitar melhorias para a nossa cidade.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center hover:bg-white hover:shadow-xl hover:border-brand-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">1. Registre</h3>
              <p className="text-gray-600 leading-relaxed">Relate problemas como buracos, lâmpadas queimadas ou vazamentos informando o local exato.</p>
            </div>
            
            {/* Card 2 */}
            <div className="group bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center hover:bg-white hover:shadow-xl hover:border-accent-blue/30 transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto bg-blue-50 text-accent-blue rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent-blue group-hover:text-white transition-all duration-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">2. Triagem Inteligente</h3>
              <p className="text-gray-600 leading-relaxed">Nosso sistema processa sua demanda e encaminha imediatamente para o setor responsável da prefeitura.</p>
            </div>

            {/* Card 3 */}
            <div className="group bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center hover:bg-white hover:shadow-xl hover:border-accent-yellow/30 transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent-yellow group-hover:text-white transition-all duration-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">3. Acompanhamento</h3>
              <p className="text-gray-600 leading-relaxed">Acompanhe pelo número do protocolo cada passo do atendimento com total transparência.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section / Consulta */}
      <section className="py-20 bg-brand-50 border-t border-brand-100">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="w-full md:w-1/2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wider mb-4">
              Transparência
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6 leading-tight">
              Acompanhe as obras e <br className="hidden lg:block" />
              melhorias no município
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Disponibilizamos um painel público completo onde você pode consultar os relatos ativos e as regiões que já foram atendidas pela gestão municipal.
            </p>
            <Link to="/demandas-publicas" className="inline-flex items-center justify-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-md transition-colors group">
              Consultar Demandas Públicas
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
          <div className="w-full md:w-1/2 flex justify-center">
            {/* Ilustração ou Elemento Decorativo */}
            <div className="relative w-full max-w-md aspect-square bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
              <div className="absolute inset-0 bg-brand-500/5"></div>
              <svg className="w-32 h-32 text-brand-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/80 backdrop-blur rounded-xl shadow-sm border border-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Demanda Concluída</p>
                    <p className="text-xs text-gray-500">Bairro Cidade Nova</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
