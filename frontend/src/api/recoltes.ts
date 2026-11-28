import { clientHttp } from './client';
import type {
  Recolte,
  RecolteCreate,
  RecolteUpdate,
  RecoltePlanification,
  PaginatedResponse,
} from '@/types/recolte';

/** DTO brut renvoyé par le backend pour une demande de récolte (`DemandeRecolteResponse`). */
interface DemandeRecolteResponseBrut {
  id: string;
  type: string;
  dateSouhaitee: string;
  dateCreation: string;
  statut: string;
  motif?: string | null;
  vergerId: string;
  agriculteurId: string;
}

/** Conversion du DTO backend vers le type frontend `Recolte`. */
function demandeResponseToRecolte(brut: DemandeRecolteResponseBrut): Recolte {
  return {
    id: brut.id,
    vergerId: brut.vergerId,
    agriculteurId: brut.agriculteurId,
    type: brut.type as Recolte['type'],
    dateSouhaitee: brut.dateSouhaitee,
    statut: brut.statut as Recolte['statut'],
    motif: brut.motif ?? undefined,
    dateCreation: brut.dateCreation,
    dateMaj: '',
  };
}

/** Conversion du type frontend `RecolteCreate` vers le DTO backend `DemandeRecolteRequest`. */
function recolteCreateToRequest(data: RecolteCreate): {
  vergerId: string;
  type: string;
  dateSouhaitee: string;
  motif?: string | null;
} {
  return {
    vergerId: data.vergerId,
    type: data.type,
    dateSouhaitee: data.dateSouhaitee,
    motif: data.motif ?? null,
  };
}

export const recoltesApi = {
  list: (params?: {
    page?: number;
    size?: number;
    vergerId?: string;
    agriculteurId?: string;
    statut?: string;
    type?: string;
  }) => clientHttp.get<PaginatedResponse<DemandeRecolteResponseBrut>>('/demandes', params).then((page) => ({
    content: page.content.map(demandeResponseToRecolte),
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    number: page.number,
    size: page.size,
  })),

  get: (id: string) =>
    clientHttp.get<DemandeRecolteResponseBrut>(`/demandes/${id}`).then(demandeResponseToRecolte),

  create: (data: RecolteCreate) =>
    clientHttp.post<DemandeRecolteResponseBrut>('/demandes', recolteCreateToRequest(data)).then(demandeResponseToRecolte),

  update: (id: string, data: RecolteUpdate) =>
    clientHttp.put<DemandeRecolteResponseBrut>(`/demandes/${id}`, recolteCreateToRequest(data as RecolteCreate)).then(demandeResponseToRecolte),

  annuler: (id: string, motif?: string) =>
    clientHttp.post<Recolte>(`/demandes/${id}/annuler`, { motif }).then(demandeResponseToRecolte),

  planifier: (data: RecoltePlanification) =>
    clientHttp.post<{ tourneeId: string }>('/demandes/planifier', data),

  demarrer: (id: string) =>
    clientHttp.post<Recolte>(`/demandes/${id}/demarrer`).then(demandeResponseToRecolte),

  terminer: (id: string, quantiteReelle: number) =>
    clientHttp.post<Recolte>(`/demandes/${id}/terminer`, { quantiteReelle }).then(demandeResponseToRecolte),
};
