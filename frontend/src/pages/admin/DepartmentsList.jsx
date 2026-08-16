import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function DepartmentsList() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Detalhes view
  const [viewDept, setViewDept] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: ''
  });

  const fetchDepts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/departments');
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Erro ao buscar secretarias', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.post('/admin/departments', formData);
      setIsModalOpen(false);
      setFormData({ name: '', description: '', email: '', phone: '' });
      fetchDepts();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Erro ao criar secretaria.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && departments.length === 0) return <div className="flex justify-center mt-12"><Spinner /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Secretarias e Setores</h2>
          <p className="text-gray-600">Departamentos responsáveis pelo atendimento.</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Adicionar Setor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.length === 0 && !loading ? (
          <div className="col-span-full text-center text-gray-500 py-8 bg-white rounded-xl border border-gray-200">
            Nenhuma secretaria cadastrada.
          </div>
        ) : (
          departments.map(dept => (
            <div key={dept.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-800">{dept.name}</h3>
                  {dept.isActive ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">Ativo</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">Inativo</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">{dept.description}</p>
                
                <div className="text-sm text-gray-500 flex flex-col gap-1 mb-4">
                  <div><strong>Email:</strong> {dept.email || 'Não informado'}</div>
                  <div><strong>Gerente:</strong> {dept.manager?.name || 'Não atribuído'}</div>
                  <div><strong>Categorias vinculadas:</strong> {dept.categories?.length || 0}</div>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button variant="secondary" size="sm" onClick={() => setViewDept(dept)}>Ver Detalhes</Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Adicionar Nova Secretaria"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
              {errorMsg}
            </div>
          )}
          
          <Input 
            label="Nome da Secretaria" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="Ex: Secretaria de Obras"
            required
          />
          
          <div className="input-group">
            <label className="input-label">Descrição</label>
            <textarea 
              className="input-field" 
              name="description" 
              rows="3" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Descreva as responsabilidades deste setor..."
            />
          </div>

          <Input 
            label="E-mail Institucional" 
            type="email"
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            placeholder="obras@municipio.gov.br"
          />

          <Input 
            label="Telefone" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            placeholder="(00) 0000-0000"
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Salvar Secretaria
            </Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!viewDept} 
        onClose={() => setViewDept(null)} 
        title="Detalhes da Secretaria"
      >
        {viewDept && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nome</p>
              <p className="font-bold text-gray-800">{viewDept.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Descrição</p>
              <p className="text-gray-700">{viewDept.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">E-mail</p>
                <p className="text-gray-700">{viewDept.email || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Telefone</p>
                <p className="text-gray-700">{viewDept.phone || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Gerente Atual</p>
                <p className="text-gray-700">{viewDept.manager?.name || 'Sem gerente atribuído'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="text-gray-700">{viewDept.isActive ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-sm font-bold text-gray-800 mb-2">Categorias Atendidas ({viewDept.categories?.length || 0})</p>
              <div className="flex flex-wrap gap-2">
                {viewDept.categories?.map(cat => (
                  <span key={cat.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md border border-gray-200">
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="secondary" onClick={() => setViewDept(null)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
