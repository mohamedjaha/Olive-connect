import { clientHttp } from './client';
import type {
  Affectation,
  AffectationCreate,
  ChefEquipe,
  PaginatedResponse,
  Pressoir,
  Ressource,
  RessourceCreate,
  RessourceUpdate,
  Tournee,
  TourneeCreate,
  TourneeUpdate,
} from '@/types/tournee';
import type { VergerReferentiel } from '@/types/verger';

export const tourneesApi = {
  list: (params?: {
    page?: number;
    size?: number;
    statut?: string;
    chefEquipeId?: string;
    pressoirId?: string;
    dateDebut?: string;
    dateFin?: string;
  }) => clientHttp.get<PaginatedResponse<Tournee>>('/tournees', params),

  get: (id: string) => clientHttp.get<Tournee>(`/tournees/${id}`),

  create: (data: TourneeCreate) => clientHttp.post<Tournee>('/tournees', data),

  update: (id: string, data: TourneeUpdate) =>
    clientHttp.put<Tournee>(`/tournees/${id}`, data),

  delete: (id: string) => clientHttp.supprimer(`/tournees/${id}`),

  demarrer: (id: string) => clientHttp.post<Tournee>(`/tournees/${id}/demarrer`),

  terminer: (id: string, quantiteReelle?: number) =>
    clientHttp.post<Tournee>(`/tournees/${id}/terminer`, { quantiteReelle }),

  annuler: (id: string, motif?: string) =>
    clientHttp.post<Tournee>(`/tournees/${id}/annuler`, { motif }),

  ressources: {
    list: (params?: { page?: number; size?: number; type?: string; statut?: string }) =>
      clientHttp.get<PaginatedResponse<Ressource>>('/ressources', params),

    get: (id: string) => clientHttp.get<Ressource>(`/ressources/${id}`),

    create: (data: RessourceCreate) => clientHttp.post<Ressource>('/ressources', data),

    update: (id: string, data: RessourceUpdate) =>
      clientHttp.put<Ressource>(`/ressources/${id}`, data),

    delete: (id: string) => clientHttp.supprimer(`/ressources/${id}`),

    disponibilites: (dateDebut: string, dateFin: string, type?: string) =>
      clientHttp.get<Ressource[]>('/ressources/disponibilites', { dateDebut, dateFin, type }),
  },

  affectations: {
    list: (params?: { tourneeId?: string; ressourceId?: string }) =>
      clientHttp.get<Affectation[]>('/affectations', params),

    create: (data: AffectationCreate) =>
      clientHttp.post<Affectation>('/affectations', data),

    delete: (id: string) => clientHttp.supprimer(`/affectations/${id}`),
  },

  chefsEquipe: () => clientHttp.get<ChefEquipe[]>('/chefs-equipe'),

  pressoirs: () => clientHttp.get<Pressoir[]>('/pressoirs'),

  vergersDisponibles: (dateDebut: string, dateFin: string) =>
    clientHttp.get<VergerReferentiel[]>('/vergers/disponibles', { dateDebut, dateFin }),
};
