import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextDef';

export function useAuth() {
  return useContext(AuthContext);
}
