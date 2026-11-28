/**
 * Gestion de session : point de bascule unique entre les modes d'authentification.
 *
 * Deux implémentations du même contrat `SessionAdapter` :
 *  - `MockAdapter`  : comptes de démonstration, aucun appel réseau (dev, tests) ;
 *  - `OIDCAdapter`  : jeton d'identité Google obtenu par le bouton officiel,
 *                     puis profil et rôle lus dans la collection `users`.
 *
 * Le reste de l'application n'importe que `useSession()` et `SessionProvider` :
 * changer de mode ne touche qu'une variable d'environnement.
 */

import { definirJeton, ErreurApi } from '@/api/client';
import { utilisateursApi, type Profil } from '@/api/utilisateurs';
import { decoderJetonGoogle, deconnecterGoogle, type JetonGoogle } from './googleIdentity';
import { normaliserRole, type Role } from './roles';

export type ModeAuth = 'mock' | 'google';

export interface User {
  id: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string | null;
  roles: string[];
  /** Vergers autorisés. Absent quand le serveur fait foi (contrôle de propriété). */
  vergerIds?: string[];
}

export interface Session {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  /**
   * `false` quand l'utilisateur Google n'a pas encore de profil dans la
   * collection `users` : l'application le dirige vers la page d'inscription.
   */
  profilComplet: boolean;
}

export interface IdentifiantsConnexion {
  email: string;
  password: string;
}

export interface SessionAdapter {
  /** Mode exposé à l'interface (choix du bouton de connexion). */
  readonly mode: ModeAuth;
  /** Initialise l'adapter (reprise d'un jeton stocké, nettoyage). */
  init(): Promise<void>;
  /** Session courante, ou `null`. */
  getSession(): Session | null;
  /** Abonnement aux changements de session. */
  onChange(cb: (session: Session | null) => void): () => void;
  /** Connexion par identifiants (mode mock uniquement). */
  login(identifiants?: IdentifiantsConnexion): Promise<void>;
  /**
   * Mode Google uniquement : consomme le jeton d'identité renvoyé par le
   * bouton, puis charge le profil depuis l'API.
   */
  connecterAvecJeton?(jeton: string): Promise<void>;
  /** Déconnexion. */
  logout(): Promise<void>;
  /** Recharge la session (profil, rôle, expiration). */
  refresh(): Promise<void>;
  /** Vérifie un rôle, avec normalisation des alias. */
  hasRole(role: string): boolean;
  /** Vérifie l'accès à un verger. */
  canAccessVerger(vergerId: string): boolean;
}

/**
 * Un agriculteur ne voit que ses vergers. Quand l'API ne fournit pas la liste,
 * c'est le serveur qui tranche : on ne bloque pas côté client.
 */
function autoriseVerger(user: User | null, vergerId: string): boolean {
  const ids = user?.vergerIds;
  if (!ids) return true;
  return ids.includes(vergerId);
}

function aLeRole(user: User | null, role: string): boolean {
  const cible = normaliserRole(role);
  return user?.roles.some((candidat) => normaliserRole(candidat) === cible) ?? false;
}

/* ------------------------------------------------------------------------- */
/* Mock                                                                       */
/* ------------------------------------------------------------------------- */

/**
 * MockAdapter : comptes de démonstration, un par rôle.
 * Utilisé en développement et dans les tests, jamais en production.
 */
export class MockAdapter implements SessionAdapter {
  readonly mode = 'mock';

  private session: Session | null = null;
  private listeners: Set<(session: Session | null) => void> = new Set();
  private readonly STORAGE_KEY = 'oliveconnect_session';

  private readonly DEMO_USERS: User[] = [
    {
      id: 'agr1',
      nom: 'Mohamed Ben Salah',
      email: 'agri@test.tn',
      roles: ['AGRICULTEUR'],
      vergerIds: ['v1', 'v2'],
    },
    {
      id: 'col1',
      nom: 'Mohamed Ben Ali',
      email: 'collecte@test.tn',
      roles: ['RESPONSABLE_COLLECTE'],
    },
    {
      id: 'chef1',
      nom: 'Ahmed Trabelsi',
      email: 'chef@test.tn',
      roles: ['CHEF_EQUIPE'],
    },
    {
      id: 'log1',
      nom: 'Fatma Gharbi',
      email: 'logistique@test.tn',
      roles: ['RESPONSABLE_LOGISTIQUE'],
    },
    {
      id: 'pres1',
      nom: 'Karim Jlassi',
      email: 'pressoir@test.tn',
      roles: ['RESPONSABLE_PRESSOIR'],
    },
    {
      id: 'adm1',
      nom: 'Admin Principal',
      email: 'admin@test.tn',
      roles: ['ADMIN'],
    },
  ];

  private readonly DEMO_PASSWORDS: Record<string, string> = {
    'agri@test.tn': 'agri',
    'collecte@test.tn': 'collecte',
    'chef@test.tn': 'chef',
    'logistique@test.tn': 'log',
    'pressoir@test.tn': 'press',
    'admin@test.tn': 'admin',
  };

  private findUser(identifiants: IdentifiantsConnexion): User | null {
    const user = this.DEMO_USERS.find((u) => u.email === identifiants.email);
    if (!user) return null;
    const attendu = this.DEMO_PASSWORDS[identifiants.email];
    if (identifiants.password !== attendu) return null;
    return user;
  }

  async init(): Promise<void> {
    // Pas de reprise automatique : l'utilisateur se connecte à chaque chargement.
    this.session = null;
    localStorage.removeItem(this.STORAGE_KEY);
    this.notify();
  }

  getSession(): Session | null {
    return this.session;
  }

  onChange(cb: (session: Session | null) => void): () => void {
    this.listeners.add(cb);
    cb(this.session);
    return () => {
      this.listeners.delete(cb);
    };
  }

  async login(identifiants?: IdentifiantsConnexion): Promise<void> {
    if (!identifiants) {
      throw new Error('Identifiants requis');
    }
    const user = this.findUser(identifiants);
    if (!user) {
      throw new Error('Email ou mot de passe invalide');
    }
    this.session = {
      user,
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token',
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      profilComplet: true,
    };
    this.persist();
    this.notify();
  }

  async logout(): Promise<void> {
    this.session = null;
    localStorage.removeItem(this.STORAGE_KEY);
    this.notify();
  }

  async refresh(): Promise<void> {
    if (!this.session) return;
    this.session = {
      ...this.session,
      accessToken: 'mock-access-token-' + Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    this.persist();
    this.notify();
  }

  hasRole(role: string): boolean {
    return aLeRole(this.session?.user ?? null, role);
  }

  canAccessVerger(vergerId: string): boolean {
    return autoriseVerger(this.session?.user ?? null, vergerId);
  }

  private persist(): void {
    if (this.session) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.session));
    }
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.session));
  }
}

/* ------------------------------------------------------------------------- */
/* Google OIDC                                                                */
/* ------------------------------------------------------------------------- */

const CLE_JETON = 'oliveconnect_jeton_google';

function utilisateurDepuisProfil(profil: Profil): User {
  const nomComplet = [profil.prenom, profil.nom].filter(Boolean).join(' ').trim();
  return {
    id: profil.id,
    nom: nomComplet || profil.email,
    prenom: profil.prenom,
    email: profil.email,
    telephone: profil.telephone,
    roles: [normaliserRole(profil.role)],
  };
}

function sessionDepuisJeton(
  jeton: string,
  charge: JetonGoogle,
  role: Role,
  profilComplet: boolean,
): Session {
  return {
    user: {
      id: charge.sub,
      nom: charge.name ?? charge.email,
      prenom: charge.given_name,
      email: charge.email,
      roles: [role],
    },
    accessToken: jeton,
    refreshToken: null,
    expiresAt: charge.exp * 1000,
    profilComplet,
  };
}

/**
 * OIDCAdapter : jeton d'identité Google.
 *
 * Le jeton est conservé en `sessionStorage` (durée de vie d'un onglet) et
 * expire au bout d'une heure environ. Il n'y a pas de refresh token : à
 * l'expiration, l'utilisateur se reconnecte avec le bouton Google.
 */
export class OIDCAdapter implements SessionAdapter {
  readonly mode = 'google';

  private session: Session | null = null;
  private listeners: Set<(session: Session | null) => void> = new Set();

  async init(): Promise<void> {
    const jeton = this.lireJetonStocke();
    if (!jeton) {
      this.session = null;
      this.notify();
      return;
    }

    const charge = decoderJetonGoogle(jeton);
    if (!charge || charge.exp * 1000 <= Date.now()) {
      this.effacerJeton();
      this.session = null;
      this.notify();
      return;
    }

    this.session = sessionDepuisJeton(jeton, charge, 'VISITEUR', false);
    definirJeton(jeton);

    // Le rôle fait foi côté base : on recharge le profil sans bloquer l'affichage.
    try {
      await this.chargerProfil();
    } catch {
      // 403 (compte désactivé) ou réseau : la session reste utilisable en lecture,
      // le prochain appel API tranchera.
    }
    this.notify();
  }

  getSession(): Session | null {
    return this.session;
  }

  onChange(cb: (session: Session | null) => void): () => void {
    this.listeners.add(cb);
    cb(this.session);
    return () => {
      this.listeners.delete(cb);
    };
  }

  async login(): Promise<void> {
    throw new Error("Utilisez le bouton « Se connecter avec Google »");
  }

  async connecterAvecJeton(jeton: string): Promise<void> {
    const charge = decoderJetonGoogle(jeton);
    if (!charge) {
      throw new Error('Jeton Google illisible');
    }
    if (charge.email_verified === false) {
      throw new Error('Adresse Google non vérifiée');
    }
    if (charge.exp * 1000 <= Date.now()) {
      throw new Error('Jeton Google expiré, reconnectez-vous');
    }

    // Le jeton alimente l'intercepteur Axios avant l'appel de profil.
    definirJeton(jeton);
    sessionStorage.setItem(CLE_JETON, jeton);
    this.session = sessionDepuisJeton(jeton, charge, 'VISITEUR', false);

    try {
      await this.chargerProfil();
    } catch (erreur) {
      // Compte désactivé ou erreur réseau : aucune session partielle ne subsiste.
      definirJeton(null);
      this.effacerJeton();
      this.session = null;
      this.notify();
      throw erreur;
    }

    this.notify();
  }

  async logout(): Promise<void> {
    this.effacerJeton();
    definirJeton(null);
    this.session = null;
    await deconnecterGoogle().catch(() => undefined);
    this.notify();
  }

  async refresh(): Promise<void> {
    if (!this.session?.accessToken) return;

    const charge = decoderJetonGoogle(this.session.accessToken);
    if (!charge || charge.exp * 1000 <= Date.now()) {
      await this.logout();
      return;
    }

    await this.chargerProfil();
    this.notify();
  }

  hasRole(role: string): boolean {
    return aLeRole(this.session?.user ?? null, role);
  }

  canAccessVerger(vergerId: string): boolean {
    return autoriseVerger(this.session?.user ?? null, vergerId);
  }

  /** Charge (ou recharge) le profil applicatif et son rôle. */
  private async chargerProfil(): Promise<void> {
    if (!this.session) return;

    try {
      const profil = await utilisateursApi.moi();
      this.session = {
        ...this.session,
        user: utilisateurDepuisProfil(profil),
        profilComplet: true,
      };
    } catch (erreur) {
      if (erreur instanceof ErreurApi && erreur.statut === 404) {
        // Jeton Google valide, mais aucune inscription : on garde la session
        // pour permettre l'accès à la page d'inscription.
        this.session = { ...this.session, profilComplet: false };
        return;
      }
      throw erreur;
    }
  }

  private lireJetonStocke(): string | null {
    try {
      return sessionStorage.getItem(CLE_JETON);
    } catch {
      return null;
    }
  }

  private effacerJeton(): void {
    try {
      sessionStorage.removeItem(CLE_JETON);
    } catch {
      // Stockage indisponible (navigation privée stricte) : rien à nettoyer.
    }
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.session));
  }
}

/* ------------------------------------------------------------------------- */
/* Fabrique                                                                   */
/* ------------------------------------------------------------------------- */

/** Identifiant OAuth 2.0 Google (public), fourni par la configuration Vite. */
export function clientIdGoogle(): string | undefined {
  const identifiant = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return identifiant && identifiant.trim() ? identifiant.trim() : undefined;
}

/**
 * Mode d'authentification effectif.
 *
 * `VITE_AUTH_MODE` tranche explicitement. Sans valeur, un client Google
 * configuré suffit à activer le mode réel ; sinon on reste en démonstration.
 */
export function modeAuthentification(): ModeAuth {
  const configure = import.meta.env.VITE_AUTH_MODE;
  if (configure === 'google') return 'google';
  if (configure === 'mock') return 'mock';
  return clientIdGoogle() ? 'google' : 'mock';
}

export function createSessionAdapter(): SessionAdapter {
  return modeAuthentification() === 'google' ? new OIDCAdapter() : new MockAdapter();
}
