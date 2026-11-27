/**
 * Session management — seam for authentication.
 *
 * Current: MockAdapter (localStorage, demo users per role)
 * Future:  OIDCAdapter (Auth0, Keycloak, etc.)
 *
 * The rest of the app only imports `useSession()` and `SessionProvider`.
 * Swapping the adapter is a one-line change in main.tsx.
 */

export interface User {
  id: string;
  nom: string;
  email: string;
  roles: string[];
  vergerIds?: string[];
}

export interface Session {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface SessionAdapter {
  /** Initialise l'adapter (ex: charge le token depuis le storage, démarre le refresh loop). */
  init(): Promise<void>;
  /** Retourne la session courante (peut être null). */
  getSession(): Session | null;
  /** S'abonne aux changements de session. */
  onChange(cb: (session: Session | null) => void): () => void;
  /** Connexion (mock: email/password, OIDC: redirect). */
  login(credentials?: { email: string; password: string }): Promise<void>;
  /** Déconnexion. */
  logout(): Promise<void>;
  /** Rafraîchit le access token si nécessaire. */
  refresh(): Promise<void>;
  /** Vérifie si l'utilisateur a un rôle. */
  hasRole(role: string): boolean;
  /** Vérifie si l'utilisateur a un accès à un verger. */
  canAccessVerger(vergerId: string): boolean;
}

/**
 * MockAdapter — pour le développement et les tests.
 * Supporte plusieurs utilisateurs démo avec rôles différents.
 */
export class MockAdapter implements SessionAdapter {
  private session: Session | null = null;
  private listeners: Set<(session: Session | null) => void> = new Set();
  private readonly STORAGE_KEY = 'oliveconnect_session';

  // Utilisateurs démo par rôle
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
      roles: ['ADMINISTRATEUR'],
    },
  ];

  // Mots de passe démo (même que l'email sans @test.tn)
  private readonly DEMO_PASSWORDS: Record<string, string> = {
    'agri@test.tn': 'agri',
    'collecte@test.tn': 'collecte',
    'chef@test.tn': 'chef',
    'logistique@test.tn': 'log',
    'pressoir@test.tn': 'press',
    'admin@test.tn': 'admin',
  };

  private findUser(credentials: { email: string; password: string }): User | null {
    const user = this.DEMO_USERS.find((u) => u.email === credentials.email);
    if (!user) return null;
    const expectedPwd = this.DEMO_PASSWORDS[credentials.email];
    if (credentials.password !== expectedPwd) return null;
    return user;
  }

  async init(): Promise<void> {
    // Pas d'auto-login : l'utilisateur doit se connecter à chaque chargement
    // (on garde le localStorage seulement pour la persistance pendant la session)
    this.session = null;
    this.notify();
  }

  getSession(): Session | null {
    return this.session;
  }

  onChange(cb: (session: Session | null) => void): () => void {
    this.listeners.add(cb);
    // Appeler immédiatement avec la session courante
    cb(this.session);
    return () => this.listeners.delete(cb);
  }

  async login(credentials?: { email: string; password: string }): Promise<void> {
    if (!credentials) {
      throw new Error('Identifiants requis');
    }
    const user = this.findUser(credentials);
    if (!user) {
      throw new Error('Email ou mot de passe invalide');
    }
    this.session = {
      user,
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token',
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
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
    // En mock, on renouvelle juste le token
    this.session = {
      ...this.session,
      accessToken: 'mock-access-token-' + Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    this.persist();
    this.notify();
  }

  hasRole(role: string): boolean {
    return this.session?.user?.roles.includes(role) ?? false;
  }

  canAccessVerger(vergerId: string): boolean {
    const vergerIds = this.session?.user?.vergerIds ?? [];
    return vergerIds.includes(vergerId);
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

/**
 * Factory pour créer l'adapter selon l'environnement.
 * En production, on utilisera OIDCAdapter.
 */
export function createSessionAdapter(): SessionAdapter {
  // TODO: basculer sur OIDCAdapter quand le backend sera prêt
  // if (import.meta.env.VITE_AUTH_PROVIDER === 'oidc') {
  //   return new OIDCAdapter();
  // }
  return new MockAdapter();
}