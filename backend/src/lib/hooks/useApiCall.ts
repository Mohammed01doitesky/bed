import { useAuth } from '@/lib/context/AuthContext';

export function useApiCall() {
  const { apiCall } = useAuth();
  return apiCall;
}