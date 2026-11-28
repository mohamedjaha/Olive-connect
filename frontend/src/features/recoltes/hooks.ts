import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recoltesApi } from '@/api/recoltes';
import type { RecolteCreate, RecolteUpdate, RecoltePlanification } from '@/types/recolte';

export function useRecoltes(params?: { page?: number; size?: number; vergerId?: string; agriculteurId?: string; statut?: string; type?: string }) {
  return useQuery({
    queryKey: ['recoltes', params],
    queryFn: () => recoltesApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useRecolte(id: string) {
  return useQuery({
    queryKey: ['recoltes', id],
    queryFn: () => recoltesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateRecolte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RecolteCreate) => recoltesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recoltes'] }),
  });
}

export function useUpdateRecolte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecolteUpdate }) => recoltesApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['recoltes'] });
      qc.invalidateQueries({ queryKey: ['recoltes', id] });
    },
  });
}

export function usePlanifierRecoltes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RecoltePlanification) => recoltesApi.planifier(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recoltes'] }),
  });
}

export function useAnnulerRecolte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif?: string }) => recoltesApi.annuler(id, motif),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['recoltes'] });
      qc.invalidateQueries({ queryKey: ['recoltes', id] });
    },
  });
}

export function useDemarrerRecolte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recoltesApi.demarrer(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['recoltes'] });
      qc.invalidateQueries({ queryKey: ['recoltes', id] });
    },
  });
}

export function useTerminerRecolte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantiteReelle }: { id: string; quantiteReelle: number }) => recoltesApi.terminer(id, quantiteReelle),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['recoltes'] });
      qc.invalidateQueries({ queryKey: ['recoltes', id] });
    },
  });
}