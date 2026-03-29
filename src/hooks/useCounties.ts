import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface CountyResponse {
  _id: string;
  name: string;
}

export function useCounties() {
  return useQuery({
    queryKey: ['counties'],
    queryFn: async () => {
      const { data } = await api.get('/counties');
      return data.data as CountyResponse[];
    },
    staleTime: 1000 * 60 * 60 * 24 * 30 * 12,
    gcTime: 1000 * 60 * 60 * 24 * 30 * 12,
  });
}
