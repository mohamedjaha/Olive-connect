import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertesApi } from '@/api/alertes';
import type { AlerteCreate, AlerteTraitement } from '@/types/alerte';

export function useAlertes(params?: { page?: number; size?: number; vergerId?: string; agriculteurId?: string; categorie?: string; statut?: string }) {
  return useQuery({
    queryKey: ['alertes', params],
    queryFn: () => alertesApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useAlerte(id: string) {
  return useQuery({
    queryKey: ['alertes', id],
    queryFn: () => alertesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateAlerte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AlerteCreate) => alertesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alertes'] }),
  });
}

export function useTraiterAlerte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AlerteTraitement }) => alertesApi.traiter(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['alertes'] });
      qc.invalidateQueries({ queryKey: ['alertes', id] });
    },
  });
}