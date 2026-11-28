import type { PaginatedResponse, ApiError, Coordonnees } from './common';

export type StatutVerger = 'EN_ATTENTE' | 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';

export type TypeOlive = 'CHETOUI' | 'CHEMLELI' | 'PANCHU' | 'ARBEQUINE' | 'AUTRE';

export type Maturite = 'VERTE' | 'MI_MATURE' | 'MATURE' | 'SURMATURE';

/** Forme minimale d'un verger, telle que le référentiel la renvoie. */
export interface VergerReferentiel {
  id: string;
  nom: string;
}

/**
 * Verger tel que manipulé par le frontend.
 * Les champs sont alignés sur le vocabulaire métier (GLOSSARY.md).
 */
export interface Verger {
  id: string;
  agriculteurId: string;
  nom: string;
  superficie: number;
  typeOlive: TypeOlive;
  localisation: Coordonnees;
  maturite: Maturite;
  statut: StatutVerger;
  rendementDisponible?: number;
  dateCreation: string;
  dateMaj: string;
}

export interface VergerCreate {
  nom: string;
  superficie: number;
  typeOlive: TypeOlive;
  localisation: Coordonnees;
  maturite?: Maturite;
}

export interface VergerUpdate {
  nom?: string;
  superficie?: number;
  typeOlive?: TypeOlive;
  localisation?: Coordonnees;
  maturite?: Maturite;
}

// Re-export common types
export type { PaginatedResponse, ApiError, Coordonnees };
