import type { Affectation, Ressource, Tournee } from '@/types/tournee';
import type { Verger } from '@/types/verger';

/**
 * Planification : validité d'un créneau et disponibilité d'une ressource.
 *
 * L'invariant `débutA < finB && débutB < finA` vit ici et nulle part ailleurs.
 * Le mock l'appelle, le formulaire l'appelle, le futur service Spring le
 * recopiera. Toutes les fonctions sont pures.
 */

export interface Creneau {
  dateDebut: string;
  dateFin: string;
}

export interface OptionsDisponibilite {
  /** Tournée à exclure du calcul, utile lors d'une modification. */
  ignorerTourneeId?: string;
}

/** Un créneau est valide si les deux bornes sont lisibles et si `fin > début`. */
export function creneauValide(creneau: Creneau): boolean {
  const debut = Date.parse(creneau.dateDebut);
  const fin = Date.parse(creneau.dateFin);
  return Number.isFinite(debut) && Number.isFinite(fin) && fin > debut;
}

/**
 * Deux créneaux se chevauchent si `débutA < finB && débutB < finA`.
 * Des créneaux qui se touchent (finA === débutB) ne se chevauchent pas.
 * Les dates illisibles ne chevauchent rien : appeler `creneauValide` d'abord.
 */
export function chevauche(a: Creneau, b: Creneau): boolean {
  return (
    Date.parse(a.dateDebut) < Date.parse(b.dateFin) &&
    Date.parse(b.dateDebut) < Date.parse(a.dateFin)
  );
}

function affectationActive(affectation: Affectation): boolean {
  // Une affectation TERMINEE ou ANNULEE libère la ressource
  return affectation.statut !== 'ANNULEE' && affectation.statut !== 'TERMINEE';
}

/**
 * Une ressource est affectable si son statut déclaré le permet et si aucune
 * affectation active ne couvre le créneau. Le statut seul ne suffit pas.
 */
export function ressourceDisponible(
  ressource: Ressource,
  affectations: readonly Affectation[],
  creneau: Creneau,
  options: OptionsDisponibilite = {},
): boolean {
  if (ressource.statut === 'MAINTENANCE' || ressource.statut === 'INDISPONIBLE') return false;

  return !affectations.some(
    (affectation) =>
      affectation.ressourceId === ressource.id &&
      affectation.tourneeId !== options.ignorerTourneeId &&
      affectationActive(affectation) &&
      chevauche(affectation, creneau),
  );
}

export function ressourcesAffectables(
  ressources: readonly Ressource[],
  affectations: readonly Affectation[],
  creneau: Creneau,
  options: OptionsDisponibilite = {},
): Ressource[] {
  if (!creneauValide(creneau)) return [];
  return ressources.filter((ressource) =>
    ressourceDisponible(ressource, affectations, creneau, options),
  );
}

/**
 * Un verger est disponible si aucune tournée active ne le couvre sur le créneau.
 */
export function vergersDisponibles(
  vergers: readonly Verger[],
  tournees: readonly Tournee[],
  creneau: Creneau,
  options: OptionsDisponibilite = {},
): Verger[] {
  if (!creneauValide(creneau)) return [];
  return vergers.filter(
    (verger) =>
      !tournees.some(
        (tournee) =>
          tournee.id !== options.ignorerTourneeId &&
          tournee.statut !== 'ANNULEE' &&
          tournee.vergerIds.includes(verger.id) &&
          chevauche(tournee, creneau),
      ),
  );
}
