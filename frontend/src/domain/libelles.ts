import type { Maturite, StatutVerger, TypeOlive } from '@/types/verger';
import type { StatutRecolte, TypeRecolte } from '@/types/recolte';
import type { CategorieAlerte, StatutAlerte } from '@/types/alerte';
import type {
  StatutAffectation,
  StatutRessource,
  StatutTournee,
  TypeRessource,
} from '@/types/tournee';

/**
 * Libellés affichés pour chaque vocabulaire contrôlé.
 * Les tables sont exhaustives : ajouter une valeur au type casse la compilation ici.
 */

export const LIBELLE_STATUT_VERGER: Record<StatutVerger, string> = {
  EN_ATTENTE: 'En attente',
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

export const LIBELLE_TYPE_OLIVE: Record<TypeOlive, string> = {
  CHETOUI: 'Chétoui',
  CHEMLELI: 'Chemléli',
  PANCHU: 'Picholine',
  ARBEQUINE: 'Arbequine',
  AUTRE: 'Autre',
};

export const LIBELLE_MATURITE: Record<Maturite, string> = {
  VERTE: 'Verte',
  MI_MATURE: 'Mi-mature',
  MATURE: 'Mature',
  SURMATURE: 'Surmature',
};

export const LIBELLE_STATUT_RECOLTE: Record<StatutRecolte, string> = {
  EN_ATTENTE: 'En attente',
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
  RECUE: 'Reçue',
};

export const LIBELLE_TYPE_RECOLTE: Record<TypeRecolte, string> = {
  PLANIFIEE: 'Planifiée',
  URGENTE: 'Urgente',
};

export const LIBELLE_STATUT_ALERTE: Record<StatutAlerte, string> = {
  NOUVELLE: 'Nouvelle',
  EN_COURS: 'En cours',
  TRAITEE: 'Traitée',
};

export const LIBELLE_CATEGORIE_ALERTE: Record<CategorieAlerte, string> = {
  MATURITE: 'Maturité',
  PROBLEME: 'Problème',
};

export const LIBELLE_STATUT_TOURNEE: Record<StatutTournee, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

export const LIBELLE_STATUT_AFFECTATION: Record<StatutAffectation, string> = {
  PLANIFIEE: 'Planifiée',
  CONFIRMEE: 'Confirmée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

export const LIBELLE_TYPE_RESSOURCE: Record<TypeRessource, string> = {
  OUVRIER: 'Ouvrier',
  TRACTEUR: 'Tracteur',
  BENNE: 'Benne',
  MATERIEL: 'Matériel',
};

export const LIBELLE_STATUT_RESSOURCE: Record<StatutRessource, string> = {
  DISPONIBLE: 'Disponible',
  OCCUPEE: 'Occupée',
  MAINTENANCE: 'Maintenance',
  INDISPONIBLE: 'Indisponible',
};
