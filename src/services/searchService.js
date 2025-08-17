// Dummy search service
export const searchService = {
  search: async (query) => {
    console.log('Searching for:', query);
    // Simulate an API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Dummy data
    const results = [
      { id: 1, type: 'Proyecto', name: 'Proyecto Alpha' },
      { id: 2, type: 'Insumo', name: 'Insumo Beta' },
      { id: 3, type: 'Producto', name: 'Producto Gamma' },
    ];
    return results.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  },
};
