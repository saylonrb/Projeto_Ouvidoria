import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Spinner from '../../components/ui/Spinner';

export default function AuditLogsList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/admin/audit-logs');
        setLogs(response.data || []);
      } catch (err) {
        console.error('Erro ao buscar auditoria', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="flex justify-center mt-12"><Spinner /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Trilha de Auditoria</h2>
          <p className="text-gray-600">Registro de ações críticas no sistema.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
              <th className="p-4">Data / Hora</th>
              <th className="p-4">Usuário</th>
              <th className="p-4">Ação</th>
              <th className="p-4">Entidade</th>
              <th className="p-4">Detalhes</th>
              <th className="p-4">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">Nenhum registro de auditoria encontrado.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm">
                  <td className="p-4 text-gray-600 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-4 font-medium text-gray-800">
                    {log.user?.name || 'Sistema'} <br/>
                    <span className="text-xs text-gray-500 font-normal">{log.user?.email}</span>
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono text-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {log.entityType} {log.targetResource ? `(${log.targetResource})` : ''} <br/>
                    <span className="text-xs text-gray-400">{log.entityId}</span>
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-500 max-w-xs truncate" title={`Antes: ${log.oldValue || '-'}\nDepois: ${log.newValue || '-'}`}>
                    <div><strong>Antes:</strong> {log.oldValue || '-'}</div>
                    <div><strong>Depois:</strong> {log.newValue || '-'}</div>
                  </td>
                  <td className="p-4 text-gray-500 text-xs font-mono">
                    {log.ipAddress || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
