import type { StatutRecolte } from '@/types/recolte';
import type { StatutTournee } from '@/types/tournee';
import type { StatutAlerte } from '@/types/alerte';

/**
 * Cycle de vie des objets du domaine.
 *
 * Ce module est la seule définition de « quelle action est permise depuis quel
 * statut ». L'interface, les mocks et le futur service Spring lisent la même
 * table. Aucun import de React, de MSW ni du DOM : tout est testable seul.
 */

export type ActionDemandeRecolte = 'MODIFIER' | 'ANNULER' | 'DEMARRER' | 'TERMINER';
export type ActionTournee = 'MODIFIER' | 'DEMARRER' | 'TERMINER' | 'ANNULER';
export type ActionAlerte = 'PRENDRE_EN_CHARGE' | 'TRAITER';

const ACTIONS_DEMANDE_RECOLTE: Record<StatutRecolte, readonly ActionDemandeRecolte[]> = {
  EN_ATTENTE: ['MODIFIER', 'ANNULER'],
  PLANIFIEE: ['MODIFIER', 'ANNULER', 'DEMARRER'],
  EN_COURS: ['TERMINER'],
  TERMINEE: [],
  ANNULEE: [],
  RECUE: [],
};

const ACTIONS_TOURNEE: Record<StatutTournee, readonly ActionTournee[]> = {
  PLANIFIEE: ['MODIFIER', 'DEMARRER', 'ANNULER'],
  EN_COURS: ['TERMINER'],
  TERMINEE: [],
  ANNULEE: [],
};

const ACTIONS_ALERTE: Record<StatutAlerte, readonly ActionAlerte[]> = {
  NOUVELLE: ['PRENDRE_EN_CHARGE', 'TRAITER'],
  EN_COURS: ['TRAITER'],
  TRAITEE: [],
};

export interface ContexteDemandeRecolte {
  /** Statut de la tournée rattachée, s'il est connu. */
  tourneeStatut?: StatutTournee;
}

function tourneeDemarree(contexte: ContexteDemandeRecolte): boolean {
  return contexte.tourneeStatut === 'EN_COURS' || contexte.tourneeStatut === 'TERMINEE';
}

/**
 * Actions permises sur une demande de récolte.
 *
 * Invariant du glossaire §7 : une demande ne se modifie ni ne s'annule une fois
 * la tournée démarrée. Le contexte doit donc porter le statut de la tournée ;
 * sans lui, la règle ne peut pas être appliquée.
 */
export function actionsDemandeRecolte(
  demande: { statut: StatutRecolte },
  contexte: ContexteDemandeRecolte = {},
): ActionDemandeRecolte[] {
  const actions = [...ACTIONS_DEMANDE_RECOLTE[demande.statut]];
  if (!tourneeDemarree(contexte)) return actions;
  return actions.filter((action) => action !== 'MODIFIER' && action !== 'ANNULER');
}

export function peutDemandeRecolte(
  demande: { statut: StatutRecolte },
  action: ActionDemandeRecolte,
  contexte: ContexteDemandeRecolte = {},
): boolean {
  return actionsDemandeRecolte(demande, contexte).includes(action);
}

export function actionsTournee(tournee: { statut: StatutTournee }): ActionTournee[] {
  return [...ACTIONS_TOURNEE[tournee.statut]];
}

export function peutTournee(
  tournee: { statut: StatutTournee },
  action: ActionTournee,
): boolean {
  return actionsTournee(tournee).includes(action);
}

export function actionsAlerte(alerte: { statut: StatutAlerte }): ActionAlerte[] {
  return [...ACTIONS_ALERTE[alerte.statut]];
}

export function peutAlerte(alerte: { statut: StatutAlerte }, action: ActionAlerte): boolean {
  return actionsAlerte(alerte).includes(action);
}
