import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tourneesApi } from '@/api/tournees';
import type { TourneeCreate, TourneeUpdate, RessourceCreate, RessourceUpdate, AffectationCreate } from '@/types/tournee';

export function useTournees(params?: { page?: number; size?: number; statut?: string; chefEquipeId?: string; pressoirId?: string; dateDebut?: string; dateFin?: string }) {
  return useQuery({
    queryKey: ['tournees', params],
    queryFn: () => tourneesApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useTournee(id: string) {
  return useQuery({
    queryKey: ['tournees', id],
    queryFn: () => tourneesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTournee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TourneeCreate) => tourneesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournees'] }),
  });
}

export function useUpdateTournee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TourneeUpdate }) => tourneesApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['tournees'] });
      qc.invalidateQueries({ queryKey: ['tournees', id] });
    },
  });
}

export function useDeleteTournee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tourneesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tournees'] }),
  });
}

export function useDemarrerTournee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tourneesApi.demarrer(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['tournees'] });
      qc.invalidateQueries({ queryKey: ['tournees', id] });
    },
  });
}

export function useTerminerTournee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantiteReelle }: { id: string; quantiteReelle?: number }) => tourneesApi.terminer(id, quantiteReelle),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['tournees'] });
      qc.invalidateQueries({ queryKey: ['tournees', id] });
    },
  });
}

export function useAnnulerTournee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif?: string }) => tourneesApi.annuler(id, motif),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['tournees'] });
      qc.invalidateQueries({ queryKey: ['tournees', id] });
    },
  });
}

// Ressources
export function useRessources(params?: { page?: number; size?: number; type?: string; statut?: string }) {
  return useQuery({
    queryKey: ['ressources', params],
    queryFn: () => tourneesApi.ressources.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useRessource(id: string) {
  return useQuery({
    queryKey: ['ressources', id],
    queryFn: () => tourneesApi.ressources.get(id),
    enabled: !!id,
  });
}

export function useCreateRessource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RessourceCreate) => tourneesApi.ressources.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ressources'] }),
  });
}

export function useUpdateRessource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RessourceUpdate }) => tourneesApi.ressources.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['ressources'] });
      qc.invalidateQueries({ queryKey: ['ressources', id] });
    },
  });
}

export function useDeleteRessource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tourneesApi.ressources.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ressources'] }),
  });
}

export function useRessourcesDisponibles(dateDebut: string, dateFin: string, type?: string) {
  return useQuery({
    queryKey: ['ressources', 'disponibilites', dateDebut, dateFin, type],
    queryFn: () => tourneesApi.ressources.disponibilites(dateDebut, dateFin, type),
    enabled: !!dateDebut && !!dateFin,
  });
}

// Affectations
export function useAffectations(params?: { tourneeId?: string; ressourceId?: string }) {
  return useQuery({
    queryKey: ['affectations', params],
    queryFn: () => tourneesApi.affectations.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AffectationCreate) => tourneesApi.affectations.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['affectations'] });
      qc.invalidateQueries({ queryKey: ['tournees'] });
    },
  });
}

export function useDeleteAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tourneesApi.affectations.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['affectations'] });
      qc.invalidateQueries({ queryKey: ['tournees'] });
    },
  });
}

// Référentiels
export function useChefsEquipe() {
  return useQuery({
    queryKey: ['chefs-equipe'],
    queryFn: () => tourneesApi.chefsEquipe(),
    staleTime: 60_000,
  });
}

export function usePressoirs() {
  return useQuery({
    queryKey: ['pressoirs'],
    queryFn: () => tourneesApi.pressoirs(),
    staleTime: 60_000,
  });
}

export function useVergersDisponibles(dateDebut: string, dateFin: string) {
  return useQuery({
    queryKey: ['vergers', 'disponibles', dateDebut, dateFin],
    queryFn: () => tourneesApi.vergersDisponibles(dateDebut, dateFin),
    enabled: !!dateDebut && !!dateFin,
  });
}