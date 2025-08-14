import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Button, TextField, Box
} from '@mui/material';

function ProveedorModal({ open, onClose, onSave, proveedor }) {
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // Effect to populate form when a supplier is passed for editing
  useEffect(() => {
    if (proveedor) {
      setCodigo(proveedor.codigo || '');
      setDescripcion(proveedor.descripcion || '');
    } else {
      // Reset form for adding a new supplier
      setCodigo('');
      setDescripcion('');
    }
  }, [proveedor, open]);

  const handleSave = () => {
    // Basic validation
    if (!codigo || !descripcion) {
      alert('Código y Descripción son obligatorios.');
      return;
    }
    onSave({ codigo, descripcion });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{proveedor ? 'Editar Proveedor' : 'Añadir Nuevo Proveedor'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Por favor, complete los detalles del proveedor.
        </DialogContentText>
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            id="codigo"
            label="Código"
            type="text"
            fullWidth
            variant="outlined"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            // If editing, make the code read-only as it's often an immutable ID
            InputProps={{ readOnly: !!proveedor }}
          />
          <TextField
            margin="dense"
            id="descripcion"
            label="Descripción"
            type="text"
            fullWidth
            variant="outlined"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProveedorModal;
