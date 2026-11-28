import { clientHttp } from './client';
import type {
  Verger,
  VergerCreate,
  VergerReferentiel,
  VergerUpdate,
  PaginatedResponse,
} from '@/types/verger';

/** DTO brut renvoyé par le backend pour un verger (`VergerResponse`). */
interface VergerResponseBrut {
  id: string;
  nom: string;
  superficieHa: number;
  variete: string;
  localisation: { longitude: number; latitude: number };
  maturite?: number | null;
  statut: string;
  proprietaireId: string;
}

/** Conversion du DTO backend `VergerResponse` vers le type frontend `Verger`. */
function vergerResponseToVerger(brut: VergerResponseBrut): Verger {
  return {
    id: brut.id,
    agriculteurId: brut.proprietaireId,
    nom: brut.nom,
    superficie: brut.superficieHa,
    typeOlive: brut.variete as Verger['typeOlive'],
    localisation: {
      latitude: brut.localisation.latitude,
      longitude: brut.localisation.longitude,
    },
    maturite: maturitePourcentageVersEnum(brut.maturite),
    statut: brut.statut as Verger['statut'],
    dateCreation: '',
    dateMaj: '',
  };
}

/** Convertit un pourcentage de maturité (0-100) en enum frontend. */
function maturitePourcentageVersEnum(valeur?: number | null): Verger['maturite'] {
  if (valeur === undefined || valeur === null) return 'VERTE';
  if (valeur < 25) return 'VERTE';
  if (valeur < 50) return 'MI_MATURE';
  if (valeur < 75) return 'MATURE';
  return 'SURMATURE';
}

/** Conversion du type frontend `VergerCreate` vers le DTO backend `VergerRequest`. */
function vergerCreateToRequest(data: VergerCreate): {
  nom: string;
  superficieHa: number;
  variete: string;
  localisation: { longitude: number; latitude: number };
  maturite?: number | null;
} {
  return {
    nom: data.nom,
    superficieHa: data.superficie,
    variete: data.typeOlive,
    localisation: {
      longitude: data.localisation.longitude,
      latitude: data.localisation.latitude,
    },
    maturite: maturiteEnumVersPourcentage(data.maturite),
  };
}

function maturiteEnumVersPourcentage(valeur?: Verger['maturite']): number | null {
  if (!valeur) return null;
  switch (valeur) {
    case 'VERTE': return 10;
    case 'MI_MATURE': return 40;
    case 'MATURE': return 70;
    case 'SURMATURE': return 90;
  }
  return null;
}

export const vergersApi = {
  list: (params?: {
    page?: number;
    size?: number;
    proprietaireId?: string;
    statut?: string;
  }) => clientHttp.get<PaginatedResponse<VergerResponseBrut>>('/vergers', params).then((page) => ({
    content: page.content.map(vergerResponseToVerger),
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    number: page.number,
    size: page.size,
  })),

  /** Référentiel léger : de quoi résoudre un identifiant en nom. */
  referentiel: () => clientHttp.get<VergerReferentiel[]>('/vergers/referentiel'),

  get: (id: string) =>
    clientHttp.get<VergerResponseBrut>(`/vergers/${id}`).then(vergerResponseToVerger),

  create: (data: VergerCreate) =>
    clientHttp.post<VergerResponseBrut>('/vergers', vergerCreateToRequest(data)).then(vergerResponseToVerger),

  update: (id: string, data: VergerUpdate) =>
    clientHttp.put<VergerResponseBrut>(`/vergers/${id}`, vergerCreateToRequest(data as VergerCreate)).then(vergerResponseToVerger),

  delete: (id: string) => clientHttp.supprimer(`/vergers/${id}`),
};
