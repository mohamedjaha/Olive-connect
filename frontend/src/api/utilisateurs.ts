/**
 * Points d'entrée du domaine « utilisateur ».
 *
 * Contrat du backend (M2 Jahha / Sof) :
 *  - `GET  /api/users/me`          : profil de l'utilisateur du jeton (404 s'il
 *    n'est pas encore inscrit, 403 si le compte est désactivé) ;
 *  - `POST /api/users/register`    : inscription, corps `{ nom, prenom, telephone }`.
 *    L'email vient du jeton Google, jamais du formulaire ;
 *  - `PATCH /api/users/{id}/role`  : attribution d'un rôle, réservée à `ADMIN`.
 *
 * Aucun rôle n'est accepté à l'inscription : le backend crée un `VISITEUR`.
 */

import { clientHttp } from './client';
import type { Role } from '@/auth/roles';

export interface Profil {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: Role;
  actif?: boolean;
}

export interface DemandeInscription {
  nom: string;
  prenom: string;
  telephone?: string;
}

export const utilisateursApi = {
  /** Profil de l'utilisateur authentifié. */
  moi: () => clientHttp.get<Profil>('/users/me'),

  /** Inscription du compte Google courant. */
  inscrire: (demande: DemandeInscription) =>
    clientHttp.post<Profil>('/users/register', demande),

  /** Attribution d'un rôle (administrateur uniquement). */
  attribuerRole: (id: string, role: Role) =>
    clientHttp.patch<Profil>(`/users/${id}/role`, { role }),
};
