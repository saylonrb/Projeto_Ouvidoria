import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages - Cidadão
import Home from './pages/citizen/Home';
import NewRequest from './pages/citizen/NewRequest';
import TrackRequest from './pages/citizen/TrackRequest';
import PublicSubmissions from './pages/citizen/PublicSubmissions';
import Login from './pages/citizen/Login';
import ResetPassword from './pages/citizen/ResetPassword';
import MyArea from './pages/citizen/MyArea';
import FAQ from './pages/citizen/FAQ';
import PrivacyPolicy from './pages/citizen/PrivacyPolicy';
import NotFound from './pages/NotFound';

// Pages - Admin
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import SubmissionsList from './pages/admin/SubmissionsList';
import SubmissionDetail from './pages/admin/SubmissionDetail';
import MasterTickets from './pages/admin/MasterTickets';
import MasterTicketDetail from './pages/admin/MasterTicketDetail';
import UsersList from './pages/admin/UsersList';
import DepartmentsList from './pages/admin/DepartmentsList';
import AuditLogsList from './pages/admin/AuditLogsList';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  
  return children;
}

function AppRoutes() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nova-demanda" element={<NewRequest />} />
        <Route path="/rastrear" element={<TrackRequest />} />
        <Route path="/demandas-publicas" element={<PublicSubmissions />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<ResetPassword />} />
        
        {/* Rota Protegida Cidadão */}
        <Route 
          path="/minha-area" 
          element={
            <ProtectedRoute>
              <MyArea />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch-all Not Found - Citizens */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AccessibilityProvider>
          <AuthProvider>
            <Routes>
              <Route path="/admin/*" element={
                <ProtectedRoute roles={['ATTENDANT', 'SECTOR_MANAGER', 'SUPER_ADMIN']}>
                  <Routes>
                    <Route element={<AdminLayout />}>
                      <Route path="" element={<Dashboard />} />
                      <Route path="demandas" element={<SubmissionsList />} />
                      <Route path="demandas/:id" element={<SubmissionDetail />} />
                      <Route path="tickets-ia" element={<MasterTickets />} />
                      <Route path="tickets-ia/:id" element={<MasterTicketDetail />} />
                      
                      {/* Apenas Super Admin */}
                      <Route path="usuarios" element={
                        <ProtectedRoute roles={['SUPER_ADMIN']}><UsersList /></ProtectedRoute>
                      } />
                      <Route path="setores" element={
                        <ProtectedRoute roles={['SUPER_ADMIN']}><DepartmentsList /></ProtectedRoute>
                      } />
                      <Route path="auditoria" element={
                        <ProtectedRoute roles={['SUPER_ADMIN']}><AuditLogsList /></ProtectedRoute>
                      } />
                      
                      {/* Catch-all Not Found - Admin */}
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </ProtectedRoute>
              } />
              <Route path="/*" element={<AppRoutes />} />
            </Routes>
          </AuthProvider>
        </AccessibilityProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
