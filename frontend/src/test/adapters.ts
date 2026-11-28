import type { Session, SessionAdapter, ModeAuth } from '@/auth/session';
import { normaliserRole } from '@/auth/roles';

/**
 * Adapter de test : session figée, aucun réseau.
 * Permet de couvrir les états qu'aucun adapter réel ne produit facilement
 * (profil incomplet, rôle inconnu, session absente).
 */
export class FauxAdapter implements SessionAdapter {
  readonly mode: ModeAuth;
  private session: Session | null;
  private listeners = new Set<(session: Session | null) => void>();

  constructor(session: Session | null, mode: ModeAuth = 'google') {
    this.session = session;
    this.mode = mode;
  }

  async init(): Promise<void> {
    // Session déjà fournie.
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
    throw new Error('Connexion par identifiants non disponible dans cet adapter de test');
  }

  async logout(): Promise<void> {
    this.session = null;
    this.notify();
  }

  async refresh(): Promise<void> {
    this.notify();
  }

  hasRole(role: string): boolean {
    const cible = normaliserRole(role);
    return this.session?.user?.roles.some((candidat) => normaliserRole(candidat) === cible) ?? false;
  }

  canAccessVerger(): boolean {
    return true;
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.session));
  }
}

/** Session complète pour un rôle donné. */
export function sessionAvecRole(role: string): Session {
  return {
    user: {
      id: 'u-test',
      nom: 'Utilisateur Test',
      email: 'test@oliveconnect.tn',
      roles: [role],
    },
    accessToken: 'jeton-test',
    refreshToken: null,
    expiresAt: Date.now() + 60_000,
    profilComplet: true,
  };
}
