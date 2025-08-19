import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ClientesPage from './ClientesPage';
import { getClientes } from '../services/modules/clientesService';
import { NotificationProvider } from '../contexts/NotificationProvider';

// Mock the services
vi.mock('../services/modules/clientesService', () => ({
  getClientes: vi.fn(),
  addCliente: vi.fn(),
  updateCliente: vi.fn(),
  deleteCliente: vi.fn(),
}));

// Mock the useNotification hook
vi.mock('../hooks/useNotification', () => ({
  useNotification: () => ({
    addNotification: vi.fn(),
  }),
}));

const renderWithProviders = (ui) => {
  return render(
    <MemoryRouter>
      <NotificationProvider>
        {ui}
      </NotificationProvider>
    </MemoryRouter>
  );
};

describe('ClientesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the getClientes service to return some data or an empty array
    getClientes.mockResolvedValue({ data: [], lastVisible: null });
  });

  it('should open the create client modal when "Añadir Cliente" button is clicked', async () => {
    renderWithProviders(<ClientesPage />);

    // Wait for the page to load and display the title
    expect(await screen.findByRole('heading', { name: /Clientes/i })).toBeInTheDocument();

    // Find the "Añadir Cliente" button and click it
    const addButton = screen.getByRole('button', { name: /Añadir Cliente/i });
    fireEvent.click(addButton);

    // Wait for the modal to appear and check for its title
    expect(await screen.findByRole('heading', { name: /Añadir Nuevo Cliente/i })).toBeInTheDocument();
  });
});
