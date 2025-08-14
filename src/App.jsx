import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ClientesPage from './pages/ClientesPage';
import SinopticoPage from './pages/SinopticoPage'; // Import the new page

// A wrapper for protected routes that redirects to the login page if you're not authenticated.
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        {/* All routes inside Layout will be protected */}
        <Route index element={<DashboardPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/sinoptico" element={<SinopticoPage />} /> {/* Add the new route */}
        {/* Other protected routes like /flowchart will be added here */}
      </Route>
    </Routes>
  );
}

export default App;
