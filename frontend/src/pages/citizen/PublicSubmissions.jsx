import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function PublicSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const subRes = await api.get('/submissions/public');
        const rawData = Array.isArray(subRes.data) ? subRes.data : (subRes.data?.data || subRes || []);
        setSubmissions(rawData);
        
        // Categorias Municipais Completas
        const defaultMunicipalCategories = [
          'Iluminação Pública & Postes',
          'Vias, Asfalto & Pavimentação',
          'Água, Saneamento & Bueiros',
          'Limpeza Urbana & Lixo',
          'Praças, Parques & Podas',
          'Trânsito & Transporte Público',
          'Saúde & Zoonoses',
          'Educação, Creches & Escolas',
          'Assistência Social & Habitação',
          'Meio Ambiente & Defesa Civil',
          'Segurança & Guarda Municipal',
          'Tributos, Fiscalização & Alvarás',
          'Buraco / Cratera na Via',
          'Calçada Danificada',
          'Lâmpada Apagada / Poste Danificado',
          'Bueiro Entupido / Rompido',
          'Descarte Irregular de Lixo / Entulho'
        ];

        // Adiciona categorias extras que existirem nas demandas retornadas
        const extraCats = rawData.map(s => s.category?.name).filter(Boolean);
        const allCats = Array.from(new Set([...defaultMunicipalCategories, ...extraCats]));
        
        setCategories(allCats);
      } catch (err) {
        console.error('Erro ao buscar demandas públicas', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      RECEIVED: { label: 'Recebido', color: 'neutral' },
      TRIAGED: { label: 'Triado', color: 'info' },
      FORWARDED: { label: 'Encaminhado', color: 'primary' },
      IN_PROGRESS: { label: 'Em Andamento', color: 'warning' },
      COMPLETED: { label: 'Resolvido', color: 'success' },
      REJECTED: { label: 'Rejeitado', color: 'danger' }
    };
    return map[status] || { label: status, color: 'neutral' };
  };

  const filteredSubmissions = submissions.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      !search ||
      (item.title && item.title.toLowerCase().includes(searchLower)) ||
      (item.protocol && item.protocol.toLowerCase().includes(searchLower)) ||
      (item.address && item.address.toLowerCase().includes(searchLower)) ||
      (item.neighborhood && item.neighborhood.toLowerCase().includes(searchLower));

    const itemCategoryName = item.category?.name || '';
    const matchesCategory = 
      !selectedCategory || 
      itemCategoryName === selectedCategory || 
      item.categoryId === selectedCategory ||
      (item.title && item.title.toLowerCase().includes(selectedCategory.toLowerCase()));

    const matchesStatus = !selectedStatus || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-12)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-800">Consulta Pública de Demandas</h2>
          <p className="text-gray-600 mt-1">
            Pesquise solicitações registradas no município para verificar se o seu problema já está em atendimento.
          </p>
        </div>
        <Link to="/nova-demanda">
          <Button variant="primary">+ Nova Demanda</Button>
        </Link>
      </div>

      {/* Painel de Filtros e Busca */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Input
              label="Buscar por título, protocolo ou bairro"
              placeholder="Ex: Buraco, OUV-2026, Cidade Nova..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria / Setor</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Todas as Categorias ({categories.length})</option>
              {categories.map((catName) => (
                <option key={catName} value={catName}>
                  {catName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status do Atendimento</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-800 bg-white"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Todos os Status</option>
              <option value="RECEIVED">Recebido</option>
              <option value="TRIAGED">Triado (Em Análise)</option>
              <option value="FORWARDED">Encaminhado</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="COMPLETED">Resolvido</option>
              <option value="REJECTED">Rejeitado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista / Grid de Resultados */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="xl" color="var(--color-primary-500)" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl block mb-3 font-bold text-gray-400">?</span>
          <h3 className="text-lg font-bold text-gray-800">Nenhuma demanda encontrada</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Não encontramos solicitações para os filtros aplicados. Tente alterar os termos da busca ou limpar os filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((sub) => {
            const badge = getStatusBadge(sub.status);
            const protocolStr = sub.protocol || sub.internalCode || sub.trackingProtocol || 'OUV-2026-000000';
            
            return (
              <div 
                key={sub.id} 
                className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-100">
                      {protocolStr}
                    </span>
                    <Badge variant={badge.color}>{badge.label}</Badge>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                    {sub.title}
                  </h3>

                  <p className="text-xs text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {sub.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="text-xs text-gray-500 flex justify-between items-center">
                    <span>Local: {sub.address || sub.neighborhood || 'Bairro Cidade Nova'}</span>
                    <span>Data: {new Date(sub.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <Link to={`/rastrear?protocol=${protocolStr}`} className="block">
                    <Button variant="outline" size="sm" fullWidth>
                      Ver Rastreio Completo &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
