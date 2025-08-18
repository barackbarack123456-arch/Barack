import { describe, it, expect, vi } from 'vitest';
import { seedDatabase } from './seed';

// Mock the service modules
vi.mock('./modules/clientesService', () => ({
  addCliente: vi.fn(),
}));
vi.mock('./modules/insumosService', () => ({
  addInsumo: vi.fn(),
}));
vi.mock('./modules/proveedoresService', () => ({
  addProveedor: vi.fn(),
}));
vi.mock('./modules/proyectosService', () => ({
  addProyecto: vi.fn(),
}));
vi.mock('./modules/subproductosService', () => ({
  addSubproducto: vi.fn(),
}));
// Mock window.alert
global.alert = vi.fn();

describe('seedDatabase', () => {
  it('should run without throwing errors', async () => {
    // We are asserting that the function does not throw an error.
    // If seedDatabase throws, the test will fail.
    await expect(seedDatabase()).resolves.toBeUndefined();
  });
});
