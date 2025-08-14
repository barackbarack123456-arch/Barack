import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProveedoresPage from './pages/ProveedoresPage';
import ClientesPage from './pages/ClientesPage';
import ProductosPage from './pages/ProductosPage';
import InsumosPage from './pages/InsumosPage';
import SinopticoPage from './pages/SinopticoPage';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading application...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
          <Route path="insumos" element={<InsumosPage />} />
          <Route path="sinoptico" element={<SinopticoPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
