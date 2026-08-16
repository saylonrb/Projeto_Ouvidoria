import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get('/admin/dashboard/metrics');
        setMetrics(response.data);
      } catch (err) {
        console.error('Erro ao buscar métricas', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="xl" color="var(--color-primary-500)" />
      </div>
    );
  }

  // Prepara dados para os gráficos
  const statusData = [
    { name: 'Em Aberto', value: (metrics.statusCount?.RECEIVED || 0) + (metrics.statusCount?.AI_PROCESSING || 0) + (metrics.statusCount?.TRIAGED || 0) },
    { name: 'Em Andamento', value: (metrics.statusCount?.FORWARDED || 0) + (metrics.statusCount?.IN_PROGRESS || 0) },
    { name: 'Resolvidos', value: metrics.statusCount?.COMPLETED || 0 },
    { name: 'Rejeitados', value: metrics.statusCount?.REJECTED || 0 },
  ];
  const COLORS = ['#94a3b8', '#f59e0b', '#10b981', '#ef4444'];

  const categoryEntries = Object.entries(metrics.categoryCount || {}).sort((a, b) => b[1] - a[1]);

  const categoryData = categoryEntries.map(([fullName, count]) => ({
    name: fullName.length > 20 ? fullName.substring(0, 20) + '...' : fullName,
    fullName: fullName,
    count
  })).slice(0, 7);

  const totalCategoryCount = categoryEntries.reduce((acc, [, val]) => acc + val, 0) || 1;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-800">Dashboard de Gestão</h2>
        <p className="text-gray-600 mt-1">Visão geral das demandas públicas e indicadores operacionais.</p>
      </div>

      {/* Cards de KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-2xl font-bold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 m-0">Total de Demandas</p>
            <h3 className="text-2xl font-extrabold text-gray-800 m-0">{metrics.totalSubmissions}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center text-2xl font-bold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 m-0">Demandas Agrupadas (IA)</p>
            <h3 className="text-2xl font-extrabold text-gray-800 m-0">{metrics.totalMasterTickets}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-2xl font-bold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 m-0">Usuários Ativos</p>
            <h3 className="text-2xl font-extrabold text-gray-800 m-0">{metrics.totalUsers}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 m-0">Tempo Médio</p>
            <h3 className="text-2xl font-extrabold text-gray-800 m-0">{metrics.averageResolutionTimeDays} dias</h3>
          </div>
        </div>
      </div>

      {/* Gráficos e Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Status das Demandas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribuição por Status</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 flex-wrap mt-4 pt-4 border-t border-gray-100">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[index % COLORS.length] }}></div>
                {entry.name}: <span className="font-bold text-gray-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Barras com Nomes Completos das Categorias */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Demandas por Categoria</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11, fill: '#374151' }} />
                <Tooltip
                  formatter={(value, name, item) => [`${value} solicitações`, item.payload.fullName]}
                  labelFormatter={() => 'Categoria'}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Lista Completa das Categorias com Nomes Sem Cortes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Detalhamento Completo por Categoria</h3>
        <div className="space-y-4">
          {categoryEntries.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma categoria registrada.</p>
          ) : (
            categoryEntries.map(([name, count]) => {
              const percent = Math.round((count / totalCategoryCount) * 100);
              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-gray-800">{name}</span>
                    <span className="text-brand-600 font-bold">{count} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
