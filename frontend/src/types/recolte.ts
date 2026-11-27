import type { PaginatedResponse, ApiError } from './common';
import type { StatutTournee } from './tournee';

export type TypeRecolte = 'PLANIFIEE' | 'URGENTE';
export type StatutRecolte = 'EN_ATTENTE' | 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE' | 'RECUE';

export interface Recolte {
  id: string;
  vergerId: string;
  agriculteurId: string;
  type: TypeRecolte;
  dateSouhaitee: string;
  datePlanifiee?: string;
  dateDebut?: string;
  dateFin?: string;
  motif?: string;
  quantitePrevue?: number;
  quantiteReelle?: number;
  statut: StatutRecolte;
  tourneeId?: string;
  /** Champ de lecture : statut de la tournée rattachée, renseigné par l'API. */
  tourneeStatut?: StatutTournee;
  dateCreation: string;
  dateMaj: string;
}

export interface RecolteCreate {
  vergerId: string;
  type: TypeRecolte;
  dateSouhaitee: string;
  motif?: string;
  quantitePrevue?: number;
}

export interface RecolteUpdate {
  type?: TypeRecolte;
  dateSouhaitee?: string;
  motif?: string;
  quantitePrevue?: number;
}

export interface RecoltePlanification {
  recolteIds: string[];
  dateDebut: string;
  dateFin: string;
  chefEquipeId: string;
}

export type { PaginatedResponse, ApiError };
