import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Toolbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getProveedores, addProveedor, updateProveedor, deleteProveedor } from '../services/dataService';
import ProveedorModal from '../components/ProveedorModal';
import ConfirmDialog from '../components/ConfirmDialog';

function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingProveedorId, setDeletingProveedorId] = useState(null);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const data = await getProveedores();
      setProveedores(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleOpenModal = (proveedor = null) => {
    setEditingProveedor(proveedor);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProveedor(null);
  };

  const handleSaveProveedor = async (proveedorData) => {
    try {
      if (editingProveedor) {
        await updateProveedor(editingProveedor.id, proveedorData);
      } else {
        await addProveedor(proveedorData);
      }
      handleCloseModal();
      fetchProveedores();
    } catch (error) {
      console.error("Error saving supplier:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingProveedorId(id);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProveedor(deletingProveedorId);
      setConfirmOpen(false);
      setDeletingProveedorId(null);
      fetchProveedores();
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <Toolbar>
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" component="div">
          Proveedores
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Añadir Proveedor
        </Button>
      </Toolbar>
      <TableContainer>
        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center">Cargando...</TableCell>
              </TableRow>
            ) : proveedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">No hay proveedores para mostrar.</TableCell>
              </TableRow>
            ) : (
              proveedores.map((row) => (
                <TableRow key={row.id}>
                  <TableCell component="th" scope="row">{row.codigo}</TableCell>
                  <TableCell>{row.descripcion}</TableCell>
                  <TableCell align="right">
                    <IconButton aria-label="edit" onClick={() => handleOpenModal(row)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton aria-label="delete" onClick={() => handleDeleteClick(row.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <ProveedorModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProveedor}
        proveedor={editingProveedor}
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este proveedor? Esta acción no se puede deshacer."
      />
    </Paper>
  );
}

export default ProveedoresPage;
