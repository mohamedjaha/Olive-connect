/**
 * Client HTTP unique (Axios).
 *
 * Les fichiers de domaine (`api/vergers.ts`, etc.) ne décrivent plus que des
 * points d'entrée. Tout ce qui est transverse vit ici : URL de base, jeton,
 * sérialisation JSON, réponse 204, et lecture typée des erreurs.
 *
 * Deux intercepteurs :
 *  - requête  : ajoute `Authorization: Bearer <jeton>` quand une session existe
 *  - réponse  : mappe toute erreur en `ErreurApi` et signale les 401 pour que
 *               le provider de session déclenche la déconnexion
 */

import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const BASE = '/api';

export class ErreurApi extends Error {
  readonly statut: number;
  readonly chemin: string;
  readonly corps: unknown;

  constructor(statut: number, message: string, chemin: string, corps?: unknown) {
    super(message);
    this.name = 'ErreurApi';
    this.statut = statut;
    this.chemin = chemin;
    this.corps = corps;
  }
}

let jeton: string | null = null;

/** Point d'injection du jeton OIDC. Sans jeton, aucun en-tête Authorization. */
export function definirJeton(valeur: string | null): void {
  jeton = valeur;
}

/** Jeton courant (utile aux tests). */
export function lireJeton(): string | null {
  return jeton;
}

/**
 * Construit une query string en ignorant les valeurs absentes ou vides.
 * `0` et `false` sont conservés : ce sont des valeurs légitimes.
 */
export function chaineDeRequete<T extends object>(parametres?: T): string {
  if (!parametres) return '';

  const recherche = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(parametres)) {
    if (valeur === undefined || valeur === null || valeur === '') continue;
    recherche.set(cle, String(valeur));
  }

  const requete = recherche.toString();
  return requete ? `?${requete}` : '';
}

type GestionnaireExpiration = () => void;

let surExpiration: GestionnaireExpiration | null = null;

/**
 * Branche la réaction à un 401 (déconnexion côté `SessionProvider`).
 * Retourne la fonction de désabonnement.
 */
export function surExpirationSession(gestionnaire: GestionnaireExpiration): () => void {
  surExpiration = gestionnaire;
  return () => {
    if (surExpiration === gestionnaire) surExpiration = null;
  };
}

const instance = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.request.use((config) => {
  if (jeton) {
    config.headers.set('Authorization', `Bearer ${jeton}`);
  }
  return config;
});

instance.interceptors.response.use(
  (reponse) => reponse,
  (erreur: AxiosError) => {
    const statut = erreur.response?.status ?? 0;
    const corps = erreur.response?.data ?? null;
    const message = messageDe(corps) ?? erreur.message ?? `HTTP ${statut}`;

    if (statut === 401) {
      surExpiration?.();
    }

    return Promise.reject(new ErreurApi(statut, message, erreur.config?.url ?? '', corps));
  },
);

function messageDe(corps: unknown): string | null {
  if (corps && typeof corps === 'object' && 'message' in corps) {
    const message = (corps as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return null;
}

async function envoyer<T>(config: AxiosRequestConfig): Promise<T> {
  const reponse = await instance.request<T>(config);
  if (reponse.status === 204) return undefined as T;
  return reponse.data;
}

export const clientHttp = {
  get: <T>(chemin: string, parametres?: object, signal?: AbortSignal) =>
    envoyer<T>({ method: 'GET', url: `${chemin}${chaineDeRequete(parametres)}`, signal }),

  post: <T>(chemin: string, corps?: unknown) =>
    envoyer<T>({ method: 'POST', url: chemin, data: corps ?? {} }),

  put: <T>(chemin: string, corps: unknown) => envoyer<T>({ method: 'PUT', url: chemin, data: corps }),

  patch: <T>(chemin: string, corps: unknown) =>
    envoyer<T>({ method: 'PATCH', url: chemin, data: corps }),

  supprimer: <T = void>(chemin: string) => envoyer<T>({ method: 'DELETE', url: chemin }),
};
