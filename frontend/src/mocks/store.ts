import type { PaginatedResponse } from '@/types/common';

/** Clés de persistance des mocks. Vider le localStorage rejoue le jeu de démonstration. */
export const CLEFS = {
  vergers: 'oliveconnect_vergers',
  recoltes: 'oliveconnect_recoltes',
  alertes: 'oliveconnect_alertes',
  tournees: 'oliveconnect_tournees',
  ressources: 'oliveconnect_ressources',
  affectations: 'oliveconnect_affectations',
} as const;

export function lire<T>(cle: string, defaut: readonly T[]): T[] {
  const brut = localStorage.getItem(cle);
  if (brut) return JSON.parse(brut) as T[];

  const graine = structuredClone(defaut) as T[];
  ecrire(cle, graine);
  return graine;
}

export function ecrire<T>(cle: string, donnees: readonly T[]): void {
  localStorage.setItem(cle, JSON.stringify(donnees));
}

export function paginer<T>(
  donnees: readonly T[],
  page: number,
  taille: number,
): PaginatedResponse<T> {
  const debut = page * taille;
  return {
    content: donnees.slice(debut, debut + taille),
    totalElements: donnees.length,
    totalPages: Math.ceil(donnees.length / taille),
    number: page,
    size: taille,
  };
}

export function lirePagination(request: Request): { page: number; taille: number } {
  const url = new URL(request.url);
  return {
    page: parseInt(url.searchParams.get('page') ?? '0', 10),
    taille: parseInt(url.searchParams.get('size') ?? '10', 10),
  };
}
