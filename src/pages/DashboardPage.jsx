import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Box } from '@mui/material';

function DashboardPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard Principal
      </Typography>
      <Typography variant="body1">
        ¡Bienvenido, {currentUser?.email}! Has iniciado sesión correctamente.
      </Typography>
      <Button
        variant="contained"
        onClick={handleLogout}
        sx={{ mt: 2 }}
      >
        Cerrar Sesión
      </Button>
    </Box>
  );
}

export default DashboardPage;
