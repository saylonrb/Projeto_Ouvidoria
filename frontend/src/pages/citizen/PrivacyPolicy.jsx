import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl bg-white min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Política de Privacidade</h1>
      
      <div className="prose prose-brand max-w-none text-gray-600">
        <p className="lead text-lg mb-6">
          A Prefeitura de Parauapebas valoriza a sua privacidade. Esta política descreve como coletamos, 
          usamos, protegemos e tratamos os seus dados pessoais na Ouvidoria Municipal, 
          em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </p>

        <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4 border-b pb-2">1. Coleta de Dados</h2>
        <p className="mb-4">
          Ao utilizar a Ouvidoria, coletamos informações essenciais para garantir o retorno e 
          acompanhamento da sua manifestação:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Nome completo</li>
          <li>E-mail e telefone de contato</li>
          <li>Endereço (opcional, quando aplicável à demanda)</li>
          <li>Dados de localização e fotos (fornecidos voluntariamente na abertura da demanda)</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4 border-b pb-2">2. Uso dos Dados</h2>
        <p className="mb-6">
          Seus dados são utilizados estritamente para o registro, processamento, encaminhamento e 
          resposta das demandas solicitadas. O Mapa Público de Demandas não exibe dados pessoais, 
          apenas as categorias e as coordenadas aproximadas da ocorrência.
        </p>

        <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4 border-b pb-2">3. Compartilhamento e Segurança</h2>
        <p className="mb-6">
          Não compartilhamos seus dados com terceiros ou agentes privados. Suas informações trafegam 
          de forma criptografada e são acessadas apenas por servidores públicos autorizados e envolvidos 
          na resolução do seu chamado.
        </p>

        <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4 border-b pb-2">4. Seus Direitos</h2>
        <p className="mb-6">
          Você tem o direito de solicitar a exclusão da sua conta, bem como a anonimização dos seus dados 
          pessoais nas demandas já encerradas, entrando em contato diretamente com a Ouvidoria Geral.
        </p>
        
        <div className="mt-12 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  );
}
