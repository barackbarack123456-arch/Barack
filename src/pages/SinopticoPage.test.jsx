import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SinopticoPage from './SinopticoPage';
import * as sinopticoService from '../services/sinopticoService';
import * as sinopticoItemsService from '../services/modules/sinopticoItemsService';

// Mock services and utils
vi.mock('../services/sinopticoService');
vi.mock('../services/modules/sinopticoItemsService');
vi.mock('../utils/fileExporters');

// Mock child components
vi.mock('../components/SinopticoItemModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSave, item, parentId }) => isOpen ? (
    <div data-testid="sinoptico-item-modal">
      <h2>Mock Modal</h2>
      <p>{item ? `Editing item: ${item.id}` : `Creating new item for parent: ${parentId}`}</p>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onSave({ MOCK_DATA: 'data' }, item?.id)}>Save</button>
    </div>
  ) : null,
}));

vi.mock('../components/AuditLogModal', () => ({
  __esModule: true,
  default: ({ isOpen }) => isOpen ? <div data-testid="audit-log-modal">Audit Log Modal</div> : null,
}));

// Mock DndContext to prevent warnings and allow testing logic
vi.mock('@dnd-kit/core', async () => {
    const actual = await vi.importActual('@dnd-kit/core');
    // We pass onDragEnd to a data attribute to inspect it in tests if needed, but don't render it as a prop on a real DOM element
    return {
        ...actual,
        DndContext: ({ children, onDragEnd }) => <div data-testid="dnd-context" data-on-drag-end={onDragEnd}>{children}</div>,
        useSensor: vi.fn(),
        useSensors: vi.fn(),
        DragOverlay: ({ children }) => <div>{children}</div>,
    };
});

vi.mock('@dnd-kit/sortable', async () => {
    const actual = await vi.importActual('@dnd-kit/sortable');
    return {
        ...actual,
        SortableContext: ({ children }) => <div data-testid="sortable-context">{children}</div>,
        useSortable: () => ({
            attributes: {},
            listeners: {},
            setNodeRef: vi.fn(),
            transform: null,
            transition: null,
            isDragging: false,
        }),
    };
});


const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ productId: 'root1' }),
  };
});

// Test data
const mockAllItems = [
  { id: 'root1', nombre: 'Root Product', codigo: 'P-001' },
  { id: 'child1', nombre: 'Child 1', codigo: 'S-001' },
  { id: 'child2', nombre: 'Child 2', codigo: 'S-002' },
];

const mockHierarchy = [
  { id: 'root1', nombre: 'Root Product', codigo: 'P-001', level: 0, children: [
    { id: 'child1', nombre: 'Child 1', codigo: 'S-001', level: 1, isLastChild: false, children: [] },
    { id: 'child2', nombre: 'Child 2', codigo: 'S-002', level: 1, isLastChild: true, children: [] },
  ]}
];

import { NotificationProvider } from '../contexts/NotificationProvider';

const TestWrapper = ({ children }) => (
  <MemoryRouter initialEntries={['/sinoptico/root1']}>
    <NotificationProvider>
      <Routes>
        <Route path="/sinoptico/:productId" element={children} />
      </Routes>
    </NotificationProvider>
  </MemoryRouter>
);

const renderComponent = () => {
  return render(
    <TestWrapper>
      <SinopticoPage />
    </TestWrapper>
  );
};

describe('SinopticoPage', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    sinopticoService.getHierarchyForProduct.mockResolvedValue(JSON.parse(JSON.stringify(mockHierarchy)));
    sinopticoItemsService.getSinopticoItems.mockResolvedValue(mockAllItems);
    sinopticoItemsService.updateSinopticoItem.mockResolvedValue(true);
    sinopticoService.moveSinopticoItem.mockResolvedValue(true);
  });

  it('renders loading skeleton and then the hierarchy', async () => {
    renderComponent();
    // Check for the skeleton loader using its test ID
    expect(screen.getByTestId('grid-skeleton-loader')).toBeInTheDocument();

    // Wait for the hierarchy to be displayed
    await waitFor(() => {
      // Use a more specific query for the main heading
      expect(screen.getByRole('heading', { name: 'Root Product' })).toBeInTheDocument();
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    // Ensure skeleton loader is gone
    expect(screen.queryByTestId('grid-skeleton-loader')).not.toBeInTheDocument();
  });

  it('shows an empty state if no hierarchy is returned', async () => {
    sinopticoService.getHierarchyForProduct.mockResolvedValue(null);
    renderComponent();
    await waitFor(() => {
        expect(screen.getByText('Sin Jerarquía')).toBeInTheDocument();
        expect(screen.getByText('Este sinóptico aún no tiene una familia o jerarquía creada.')).toBeInTheDocument();
    });
  });

  it('toggles edit mode and shows action buttons', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Root Product' })).toBeInTheDocument());

    // Action buttons should not be visible initially
    expect(screen.queryByTitle('Editar Item Completo')).not.toBeInTheDocument();

    // Enter edit mode
    const editModeButton = screen.getByText('Editar Jerarquía');
    fireEvent.click(editModeButton);
    await waitFor(() => {
        expect(screen.getAllByTitle('Editar Item Completo').length).toBeGreaterThan(0);
        expect(screen.getAllByTitle('Añadir Item Hijo').length).toBeGreaterThan(0);
    });

    // Exit edit mode
    fireEvent.click(screen.getByText('Salir del Modo Edición'));
    await waitFor(() => {
        expect(screen.queryByTitle('Editar Item Completo')).not.toBeInTheDocument();
    });
  });

  it('allows inline editing on double click in edit mode', async () => {
    renderComponent();
    // Find the hierarchy container to scope the search
    const hierarchyContainer = await screen.findByRole('heading', { name: 'Root Product' });
    const hierarchyList = hierarchyContainer.closest('div.shadow-md').querySelector('div.divide-y');

    // Wait for the specific item to be there
    const nodeText = await within(hierarchyList).findByText('Child 1');

    // Enter edit mode
    fireEvent.click(screen.getByText('Editar Jerarquía'));

    // Double click the node name
    fireEvent.doubleClick(nodeText);

    const input = await screen.findByDisplayValue('Child 1');
    expect(input).toBeInTheDocument();

    // Change value and press enter
    fireEvent.change(input, { target: { value: 'Updated Child 1' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // The input should disappear and the service should be called
    await waitFor(() => {
      expect(sinopticoItemsService.updateSinopticoItem).toHaveBeenCalledWith('child1', { nombre: 'Updated Child 1' });
    });

    // UI should update optimistically
    expect(within(hierarchyList).getByText('Updated Child 1')).toBeInTheDocument();
  });

  it('opens the edit modal when the edit button is clicked', async () => {
    renderComponent();
    const hierarchyContainer = await screen.findByRole('heading', { name: 'Root Product' });
    const hierarchyList = hierarchyContainer.closest('div.shadow-md').querySelector('div.divide-y');

    fireEvent.click(screen.getByText('Editar Jerarquía'));

    // Find the row for Child 1 and click its edit button
    const child1Row = (await within(hierarchyList).findByText('Child 1')).closest('.grid');
    const editButton = within(child1Row).getByTitle('Editar Item Completo');
    fireEvent.click(editButton);

    await waitFor(() => {
        const modal = screen.getByTestId('sinoptico-item-modal');
        expect(modal).toBeInTheDocument();
        expect(within(modal).getByText('Editing item: child1')).toBeInTheDocument();
    });
  });

   it('opens the new item modal when the add child button is clicked', async () => {
    renderComponent();
    const hierarchyContainer = await screen.findByRole('heading', { name: 'Root Product' });
    const hierarchyList = hierarchyContainer.closest('div.shadow-md').querySelector('div.divide-y');

    fireEvent.click(screen.getByText('Editar Jerarquía'));

    const child1Row = (await within(hierarchyList).findByText('Child 1')).closest('.grid');
    const addButton = within(child1Row).getByTitle('Añadir Item Hijo');
    fireEvent.click(addButton);

    await waitFor(() => {
        const modal = screen.getByTestId('sinoptico-item-modal');
        expect(modal).toBeInTheDocument();
        expect(within(modal).getByText('Creating new item for parent: child1')).toBeInTheDocument();
    });
  });

  it('allows inline editing of the code field on double click', async () => {
    renderComponent();
    const hierarchyContainer = await screen.findByRole('heading', { name: 'Root Product' });
    const hierarchyList = hierarchyContainer.closest('div.shadow-md').querySelector('div.divide-y');

    // Wait for the specific item to be there, finding it by its code
    const nodeCode = await within(hierarchyList).findByText('S-002');

    // Enter edit mode
    fireEvent.click(screen.getByText('Editar Jerarquía'));

    // Double click the node code
    fireEvent.doubleClick(nodeCode);

    const input = await screen.findByDisplayValue('S-002');
    expect(input).toBeInTheDocument();

    // Change value and press enter
    fireEvent.change(input, { target: { value: 'S-002-UPDATED' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // The input should disappear and the service should be called
    await waitFor(() => {
      expect(sinopticoItemsService.updateSinopticoItem).toHaveBeenCalledWith('child2', { codigo: 'S-002-UPDATED' });
    });

    // UI should update optimistically
    expect(within(hierarchyList).getByText('S-002-UPDATED')).toBeInTheDocument();
  });

  it('collapses and expands nodes on click', async () => {
    const complexHierarchy = [
      { id: 'root1', nombre: 'Root Product', codigo: 'P-001', children: [
        { id: 'child1', nombre: 'Child 1', codigo: 'S-001', children: [
          { id: 'grandchild1', nombre: 'Grandchild 1', codigo: 'GC-001', children: [] }
        ]},
        { id: 'child2', nombre: 'Child 2', codigo: 'S-002', children: [] },
      ]}
    ];
    sinopticoService.getHierarchyForProduct.mockResolvedValue(JSON.parse(JSON.stringify(complexHierarchy)));

    renderComponent();

    // Wait for the hierarchy to be fully rendered
    await screen.findByText('Grandchild 1');

    // Now that we know everything is loaded, let's get the container for our nodes
    const listContainer = screen.getByTestId('sortable-context').querySelector('.divide-y');

    // All nodes should be visible initially
    expect(within(listContainer).getByText('Root Product')).toBeInTheDocument();
    expect(within(listContainer).getByText('Child 1')).toBeInTheDocument();
    expect(within(listContainer).getByText('Grandchild 1')).toBeInTheDocument();
    expect(within(listContainer).getByText('Child 2')).toBeInTheDocument();

    // Find the row for 'Child 1'
    const child1Row = within(listContainer).getByText('Child 1').closest('.grid');
    const toggleButton = within(child1Row).getAllByRole('button')[0];

    // Collapse 'Child 1'
    fireEvent.click(toggleButton);

    // 'Grandchild 1' should disappear
    await waitFor(() => {
      expect(within(listContainer).queryByText('Grandchild 1')).not.toBeInTheDocument();
    });

    // Other nodes should still be visible
    expect(within(listContainer).getByText('Root Product')).toBeInTheDocument();
    expect(within(listContainer).getByText('Child 1')).toBeInTheDocument();
    expect(within(listContainer).getByText('Child 2')).toBeInTheDocument();

    // Expand 'Child 1' again
    fireEvent.click(toggleButton);

    // 'Grandchild 1' should reappear
    await waitFor(() => {
      expect(within(listContainer).getByText('Grandchild 1')).toBeInTheDocument();
    });
  });
});
