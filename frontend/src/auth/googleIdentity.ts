/**
 * Google Identity Services (GIS).
 *
 * Le backend OliveConnect est un *resource server* : il valide un jeton
 * d'identité Google reçu en `Authorization: Bearer`, mais il n'expose aucun
 * point d'entrée `/oauth2/authorization/google`. C'est donc le navigateur qui
 * obtient le jeton, via le bouton officiel Google, puis l'envoie à l'API.
 *
 * Ce module isole le seul code dépendant du SDK Google : chargement du script,
 * affichage du bouton, décodage du jeton, déconnexion. Le reste de
 * l'application ne connaît que `SessionAdapter`.
 */

/** Charge utile d'un jeton d'identité Google (non vérifiée côté client). */
export interface JetonGoogle {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  /** Expiration, en secondes depuis l'époque Unix. */
  exp: number;
  iat?: number;
  aud?: string;
  iss?: string;
}

/** Réponse renvoyée par le bouton Google. */
export interface ReponseIdentifiantGoogle {
  credential: string;
  select_by?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (reponse: ReponseIdentifiantGoogle) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    ux_mode?: 'popup' | 'redirect';
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  disableAutoSelect(): void;
  cancel(): void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

const URL_SCRIPT = 'https://accounts.google.com/gsi/client';

let chargement: Promise<GoogleAccountsId> | null = null;

/** Réinitialise l'état interne du module (réservé aux tests). */
export function reinitialiserGoogleIdentity(): void {
  chargement = null;
}

/**
 * Décode la charge utile d'un JWT, sans vérifier la signature.
 *
 * La vérification est faite par le backend (signature Google, émetteur,
 * expiration). Côté client, ce décodage sert uniquement à connaître l'email,
 * le nom et la date d'expiration pour l'affichage et le routage.
 */
export function decoderJetonGoogle(jeton: string): JetonGoogle | null {
  const parties = jeton.split('.');
  if (parties.length !== 3) return null;

  try {
    const charge = parties[1].replace(/-/g, '+').replace(/_/g, '/');
    const complete = charge.padEnd(Math.ceil(charge.length / 4) * 4, '=');
    const binaire = atob(complete);
    const octets = Uint8Array.from(binaire, (caractere) => caractere.charCodeAt(0));
    const json = new TextDecoder().decode(octets);
    const contenu = JSON.parse(json) as Partial<JetonGoogle>;

    if (!contenu.email || typeof contenu.exp !== 'number') return null;
    return contenu as JetonGoogle;
  } catch {
    return null;
  }
}

/** Charge le script GIS une seule fois et retourne `google.accounts.id`. */
export function chargerGoogleIdentity(): Promise<GoogleAccountsId> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Google Identity Services requiert un navigateur'));
  }

  const dejaCharge = window.google?.accounts?.id;
  if (dejaCharge) return Promise.resolve(dejaCharge);
  if (chargement) return chargement;

  chargement = new Promise<GoogleAccountsId>((resoudre, rejeter) => {
    const existant = document.querySelector<HTMLScriptElement>(`script[src="${URL_SCRIPT}"]`);
    const script = existant ?? document.createElement('script');

    const surCharge = () => {
      const identite = window.google?.accounts?.id;
      if (identite) resoudre(identite);
      else rejeter(new Error("Google Identity Services n'a pas exposé accounts.id"));
    };
    const surErreur = () => rejeter(new Error('Impossible de charger Google Identity Services'));

    script.addEventListener('load', surCharge);
    script.addEventListener('error', surErreur);

    if (!existant) {
      script.src = URL_SCRIPT;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  // Un échec ne doit pas condamner les tentatives suivantes.
  chargement.catch(() => {
    chargement = null;
  });

  return chargement;
}

export interface OptionsBoutonGoogle {
  clientId: string;
  onJeton: (reponse: ReponseIdentifiantGoogle) => void;
  largeur?: number;
  texte?: 'signin_with' | 'continue_with' | 'signup_with';
}

/**
 * Affiche le bouton officiel Google dans `element`.
 * Le bouton est rendu par Google (iframe) : il reste le seul moyen conforme
 * d'obtenir un jeton d'identité.
 */
export async function afficherBoutonGoogle(
  element: HTMLElement,
  options: OptionsBoutonGoogle,
): Promise<void> {
  const identite = await chargerGoogleIdentity();

  identite.initialize({
    client_id: options.clientId,
    callback: options.onJeton,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  // StrictMode monte deux fois en développement : on évite deux boutons.
  element.replaceChildren();

  identite.renderButton(element, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: options.texte ?? 'signin_with',
    logo_alignment: 'left',
    locale: 'fr',
    width: options.largeur ?? 320,
  });
}

/** Coupe la reconnexion automatique Google (appelé à la déconnexion). */
export async function deconnecterGoogle(): Promise<void> {
  const identite = window.google?.accounts?.id;
  identite?.disableAutoSelect();
}
