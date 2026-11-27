import type { PaginatedResponse, ApiError, Coordonnees } from './common';

export type CategorieAlerte = 'MATURITE' | 'PROBLEME';
export type StatutAlerte = 'NOUVELLE' | 'EN_COURS' | 'TRAITEE';

export interface Alerte {
  id: string;
  vergerId: string;
  agriculteurId: string;
  categorie: CategorieAlerte;
  description: string;
  localisation?: Coordonnees;
  statut: StatutAlerte;
  dateCreation: string;
  dateMaj: string;
  dateTraitement?: string;
  traitePar?: string;
  commentaireTraitement?: string;
}

export interface AlerteCreate {
  vergerId: string;
  categorie: CategorieAlerte;
  description: string;
  localisation?: Coordonnees;
}

export interface AlerteTraitement {
  statut: 'EN_COURS' | 'TRAITEE';
  commentaire?: string;
}

export type { PaginatedResponse, ApiError, Coordonnees };