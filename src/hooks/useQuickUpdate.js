import { useState } from 'react';
import { updateSinopticoItem } from '../services/modules/sinopticoItemsService';

/**
 * Custom hook for performing a quick, single-field update on a sinoptico item.
 *
 * @returns {{updateField: Function, loading: boolean, error: Error|null}}
 */
export const useQuickUpdate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Updates a single field for a given sinoptico item.
   * @param {string} id - The ID of the document to update.
   * @param {string} field - The name of the field to update.
   * @param {any} value - The new value for the field.
   * @returns {Promise<boolean>} - True if successful, false otherwise.
   */
  const updateField = async (id, field, value) => {
    setLoading(true);
    setError(null);
    try {
      await updateSinopticoItem(id, { [field]: value });
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Error updating field:", err);
      setError(err);
      setLoading(false);
      return false;
    }
  };

  return { updateField, loading, error };
};
