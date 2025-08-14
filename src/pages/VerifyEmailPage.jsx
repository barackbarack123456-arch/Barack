import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Container, Box, Typography, Button, Alert } from '@mui/material';

function VerifyEmailPage() {
  const { sendVerificationEmail, logout } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResendEmail = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendVerificationEmail();
      setMessage('Se ha enviado un nuevo enlace de verificación a tu correo.');
    } catch (err) {
      setError('Error al enviar el correo de verificación. Por favor, inténtalo de nuevo.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          Verifica tu Correo Electrónico
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Gracias por registrarte. Por favor, haz clic en el enlace que hemos enviado a tu correo para verificar tu cuenta.
        </Typography>
        {message && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
        <Button
          variant="contained"
          onClick={handleResendEmail}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          {loading ? 'Enviando...' : 'Reenviar Correo de Verificación'}
        </Button>
        <Button color="secondary" onClick={logout}>
          Cerrar Sesión
        </Button>
      </Box>
    </Container>
  );
}

export default VerifyEmailPage;
