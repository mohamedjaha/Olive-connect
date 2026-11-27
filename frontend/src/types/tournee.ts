import type { PaginatedResponse, ApiError } from './common';
import type { VergerReferentiel } from './verger';

export type TypeRessource = 'OUVRIER' | 'TRACTEUR' | 'BENNE' | 'MATERIEL';
export type StatutRessource = 'DISPONIBLE' | 'OCCUPEE' | 'MAINTENANCE' | 'INDISPONIBLE';
export type StatutTournee = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
export type StatutAffectation = 'PLANIFIEE' | 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface Tournee {
  id: string;
  dateDebut: string;
  dateFin: string;
  chefEquipeId: string;
  chefEquipeNom?: string;
  vergerIds: string[];
  /** Champ de lecture : renseigné par l'API à partir du référentiel. */
  vergers?: VergerReferentiel[];
  ressourceIds: string[];
  ressources?: Ressource[];
  pressoirId: string;
  pressoirNom?: string;
  statut: StatutTournee;
  avancement: number; // 0-100
  quantiteTotalePrevue?: number;
  quantiteTotaleReelle?: number;
  dateCreation: string;
  dateMaj: string;
}

export interface TourneeCreate {
  dateDebut: string;
  dateFin: string;
  chefEquipeId: string;
  vergerIds: string[];
  ressourceIds: string[];
  pressoirId: string;
}

export interface TourneeUpdate {
  dateDebut?: string;
  dateFin?: string;
  chefEquipeId?: string;
  vergerIds?: string[];
  ressourceIds?: string[];
  pressoirId?: string;
  statut?: StatutTournee;
  avancement?: number;
}

export interface Ressource {
  id: string;
  type: TypeRessource;
  nom: string;
  reference?: string;
  /** kg pour une benne, personnes pour une équipe, unités pour du matériel. */
  capacite?: number;
  statut: StatutRessource;
  dateCreation: string;
  dateMaj: string;
}

export interface RessourceCreate {
  type: TypeRessource;
  nom: string;
  reference?: string;
  capacite?: number;
}

export interface RessourceUpdate {
  nom?: string;
  reference?: string;
  capacite?: number;
  statut?: StatutRessource;
}

export interface Affectation {
  id: string;
  tourneeId: string;
  ressourceId: string;
  ressource?: Ressource;
  dateDebut: string;
  dateFin: string;
  statut: StatutAffectation;
}

export interface AffectationCreate {
  tourneeId: string;
  ressourceId: string;
  dateDebut: string;
  dateFin: string;
}

export interface ChefEquipe {
  id: string;
  nom: string;
  telephone?: string;
}

export interface Pressoir {
  id: string;
  nom: string;
  capaciteDisponible: number; // kg/jour
  localisation?: { latitude: number; longitude: number };
}

export type { PaginatedResponse, ApiError };
