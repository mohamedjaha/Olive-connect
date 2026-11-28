import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createSessionAdapter,
  type IdentifiantsConnexion,
  type ModeAuth,
  type Session,
  type SessionAdapter,
  type User,
} from './session';
import { normaliserRole, type Role } from './roles';
import { definirJeton, surExpirationSession } from '@/api/client';

interface SessionContextValue {
  session: Session | null;
  user: User | null;
  /** Rôle normalisé de l'utilisateur (`VISITEUR` par défaut). */
  role: Role;
  /** `false` tant que le profil n'existe pas dans la collection `users`. */
  profilComplet: boolean;
  /** Mode d'authentification actif, pour choisir le formulaire affiché. */
  mode: ModeAuth;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifiants?: IdentifiantsConnexion) => Promise<void>;
  /** Mode Google : consomme le jeton d'identité renvoyé par le bouton. */
  connecterAvecJeton: (jeton: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Recharge le profil et le rôle depuis l'API. */
  rafraichirProfil: () => Promise<void>;
  hasRole: (role: string) => boolean;
  canAccessVerger: (vergerId: string) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

let adapterInstance: SessionAdapter | null = null;

function getAdapter(): SessionAdapter {
  if (!adapterInstance) {
    adapterInstance = createSessionAdapter();
  }
  return adapterInstance;
}

interface SessionProviderProps {
  children: ReactNode;
  /** Adapter imposé (tests) : évite de dépendre de la configuration Vite. */
  adapter?: SessionAdapter;
}

export function SessionProvider({ children, adapter: adapterImpose }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const adapter = adapterImpose ?? getAdapter();

  useEffect(() => {
    let mounted = true;

    adapter.init().then(() => {
      if (!mounted) return;
      setSession(adapter.getSession());
      setIsLoading(false);
    });

    const unsubscribe = adapter.onChange((nouvelleSession) => {
      if (mounted) {
        setSession(nouvelleSession);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [adapter]);

  // Le jeton de session alimente l'intercepteur Axios (Authorization: Bearer).
  useEffect(() => {
    definirJeton(session?.accessToken ?? null);
  }, [session?.accessToken]);

  // Un 401 côté API déconnecte la session au lieu de laisser un état incohérent.
  useEffect(
    () =>
      surExpirationSession(() => {
        void adapter.logout();
      }),
    [adapter],
  );

  const login = async (identifiants?: IdentifiantsConnexion) => {
    await adapter.login(identifiants);
  };

  const connecterAvecJeton = async (jeton: string) => {
    if (!adapter.connecterAvecJeton) {
      throw new Error("La connexion Google n'est pas disponible dans ce mode");
    }
    await adapter.connecterAvecJeton(jeton);
  };

  const logout = async () => {
    await adapter.logout();
  };

  const rafraichirProfil = async () => {
    await adapter.refresh();
  };

  const hasRole = (role: string): boolean => {
    return adapter.hasRole(role);
  };

  const canAccessVerger = (vergerId: string): boolean => {
    return adapter.canAccessVerger(vergerId);
  };

  const role = normaliserRole(session?.user?.roles[0]);

  const value: SessionContextValue = {
    session,
    user: session?.user ?? null,
    role,
    profilComplet: session?.profilComplet ?? false,
    mode: adapter.mode,
    isLoading,
    isAuthenticated: !!session?.user,
    login,
    connecterAvecJeton,
    logout,
    rafraichirProfil,
    hasRole,
    canAccessVerger,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

/**
 * Hook pour vérifier l'accès à une route selon les rôles.
 * Retourne true si l'utilisateur a au moins un des rôles requis.
 */
export function useRoleAccess(allowedRoles: string[]): boolean {
  const { user, isLoading } = useSession();
  if (isLoading) return false;
  if (!user) return false;
  const roles = user.roles.map((role) => normaliserRole(role));
  return allowedRoles.some((role) => roles.includes(normaliserRole(role)));
}

/**
 * Hook pour l'accès à un verger spécifique.
 */
export function useVergerAccess(vergerId: string): boolean {
  const { canAccessVerger, isLoading } = useSession();
  if (isLoading) return false;
  return canAccessVerger(vergerId);
}
