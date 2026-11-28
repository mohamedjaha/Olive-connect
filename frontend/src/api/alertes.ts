import { clientHttp } from './client';
import type {
  Alerte,
  AlerteCreate,
  AlerteTraitement,
  PaginatedResponse,
} from '@/types/alerte';

export const alertesApi = {
  list: (params?: {
    page?: number;
    size?: number;
    vergerId?: string;
    agriculteurId?: string;
    categorie?: string;
    statut?: string;
  }) => clientHttp.get<PaginatedResponse<Alerte>>('/alertes', params),

  get: (id: string) => clientHttp.get<Alerte>(`/alertes/${id}`),

  create: (data: AlerteCreate) => clientHttp.post<Alerte>('/alertes', data),

  traiter: (id: string, data: AlerteTraitement) =>
    clientHttp.post<Alerte>(`/alertes/${id}/traiter`, data),
};
