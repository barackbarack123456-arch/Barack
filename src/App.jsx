import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Lazy load the page components
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProveedoresPage = lazy(() => import('./pages/ProveedoresPage'));
const ClientesPage = lazy(() => import('./pages/ClientesPage'));
const ProductosPage = lazy(() => import('./pages/ProductosPage'));
const SubproductosPage = lazy(() => import('./pages/SubproductosPage'));
const InsumosPage = lazy(() => import('./pages/InsumosPage'));
const ProyectosPage = lazy(() => import('./pages/ProyectosPage'));
const SinopticoPage = lazy(() => import('./pages/SinopticoPage'));
const SinopticoSelectorPage = lazy(() => import('./pages/SinopticoSelectorPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const UsuariosPage = lazy(() => import('./pages/UsuariosPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading application...</div>;
  }

  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading page...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Routes that use the Layout go here */}
          <Route index element={<DashboardPage />} />
          <Route path="proveedores" element={<ProveedoresPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="subproductos" element={<SubproductosPage />} />
          <Route path="insumos" element={<InsumosPage />} />
          <Route path="proyectos" element={<ProyectosPage />} />
          <Route path="sinoptico" element={<SinopticoSelectorPage />} />
          <Route path="sinoptico/:productId" element={<SinopticoPage />} />
          <Route path="search" element={<SearchResultsPage />} />
          <Route
            path="usuarios"
            element={
              <ProtectedRoute adminOnly={true}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
