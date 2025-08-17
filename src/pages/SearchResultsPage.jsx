import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { searchService } from '../services/searchService';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function SearchResultsPage() {
  const query = useQuery();
  const searchTerm = query.get('q');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      setLoading(true);
      searchService.search(searchTerm)
        .then(data => {
          setResults(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Search failed:', error);
          setLoading(false);
        });
    }
  }, [searchTerm]);

  if (loading) {
    return <div className="text-center mt-8">Buscando...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Resultados de búsqueda para "{searchTerm}"</h1>
      {results.length > 0 ? (
        <ul>
          {results.map(result => (
            <li key={result.id} className="mb-2 p-2 border rounded">
              <p className="font-semibold">{result.name}</p>
              <p className="text-sm text-gray-600">{result.type}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No se encontraron resultados.</p>
      )}
    </div>
  );
}

export default SearchResultsPage;
