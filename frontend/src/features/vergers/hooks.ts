import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vergersApi } from '@/api/vergers';
import type { VergerCreate, VergerUpdate } from '@/types/verger';

export function useVergers(params?: {
  page?: number;
  size?: number;
  agriculteurId?: string;
  maturite?: string;
  statut?: string;
}) {
  return useQuery({
    queryKey: ['vergers', params],
    queryFn: () => vergersApi.list(params),
    placeholderData: (prev) => prev,
  });
}

/**
 * Référentiel des vergers : de quoi résoudre un identifiant en nom.
 * Il n'est pas paginé, donc il ne dépend d'aucune constante de taille de page.
 */
export function useReferentielVergers() {
  return useQuery({
    queryKey: ['vergers', 'referentiel'],
    queryFn: () => vergersApi.referentiel(),
    staleTime: 5 * 60_000,
  });
}

/** Résolution `id → nom` pour l'affichage, avec le libellé du glossaire si inconnu. */
export function useNomsVergers() {
  const { data, ...requete } = useReferentielVergers();
  const vergers = data ?? [];

  return {
    ...requete,
    vergers,
    parId: (id: string) => vergers.find((v) => v.id === id)?.nom ?? 'Non renseigné',
  };
}

export function useVerger(id: string) {
  return useQuery({
    queryKey: ['vergers', id],
    queryFn: () => vergersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateVerger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VergerCreate) => vergersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vergers'] }),
  });
}

export function useUpdateVerger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VergerUpdate }) => vergersApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['vergers'] });
      qc.invalidateQueries({ queryKey: ['vergers', id] });
    },
  });
}

export function useDeleteVerger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vergersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vergers'] }),
  });
}
