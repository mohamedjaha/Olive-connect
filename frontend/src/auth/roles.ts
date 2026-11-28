/**
 * Rôles applicatifs : vocabulaire unique partagé par le frontend.
 *
 * La référence est l'énumération du backend (`com.oliveconnect.model.enums.Role`)
 * et `GLOSSARY.md`. Le front M0 utilisait `ADMINISTRATEUR` ; l'API expose `ADMIN`.
 * `normaliserRole` absorbe cet alias et tout rôle inconnu retombe sur `VISITEUR`
 * (moindre privilège, comme `JwtAuthConverter` côté serveur).
 */

export type Role =
  | 'VISITEUR'
  | 'AGRICULTEUR'
  | 'RESPONSABLE_COLLECTE'
  | 'CHEF_EQUIPE'
  | 'RESPONSABLE_LOGISTIQUE'
  | 'RESPONSABLE_PRESSOIR'
  | 'ADMIN';

/** Rôles connus, dans l'ordre de l'énumération backend. */
export const ROLES: readonly Role[] = [
  'VISITEUR',
  'AGRICULTEUR',
  'RESPONSABLE_COLLECTE',
  'CHEF_EQUIPE',
  'RESPONSABLE_LOGISTIQUE',
  'RESPONSABLE_PRESSOIR',
  'ADMIN',
];

/** Libellés lisibles, en français. */
export const ROLE_LABEL: Record<Role, string> = {
  VISITEUR: 'Visiteur',
  AGRICULTEUR: 'Agriculteur',
  RESPONSABLE_COLLECTE: 'Responsable collecte',
  CHEF_EQUIPE: "Chef d'équipe",
  RESPONSABLE_LOGISTIQUE: 'Responsable logistique',
  RESPONSABLE_PRESSOIR: 'Responsable pressoir',
  ADMIN: 'Administrateur',
};

/**
 * Page d'accueil par rôle.
 * `VISITEUR` n'a accès à aucune donnée privée : il atterrit sur l'écran
 * d'attente d'attribution de rôle, jamais sur une page protégée.
 */
export const ROLE_HOME: Record<Role, string> = {
  VISITEUR: '/en-attente',
  AGRICULTEUR: '/vergers',
  RESPONSABLE_COLLECTE: '/tournees',
  CHEF_EQUIPE: '/tournees',
  RESPONSABLE_LOGISTIQUE: '/ressources',
  RESPONSABLE_PRESSOIR: '/pressoirs',
  ADMIN: '/admin',
};

/** Anciens libellés du front, conservés pour lire les sessions déjà stockées. */
const ALIAS: Record<string, Role> = {
  ADMINISTRATEUR: 'ADMIN',
};

/** Normalise un rôle reçu de l'API, du stockage local ou d'un mock. */
export function normaliserRole(valeur?: string | null): Role {
  if (!valeur) return 'VISITEUR';
  const brut = valeur.trim().toUpperCase();
  const candidate = ALIAS[brut] ?? brut;
  return (ROLES as readonly string[]).includes(candidate) ? (candidate as Role) : 'VISITEUR';
}

/** Page d'accueil correspondant à un rôle quelconque. */
export function accueilPourRole(valeur?: string | null): string {
  return ROLE_HOME[normaliserRole(valeur)];
}

/** Libellé lisible d'un rôle quelconque. */
export function libelleRole(valeur?: string | null): string {
  return ROLE_LABEL[normaliserRole(valeur)];
}
