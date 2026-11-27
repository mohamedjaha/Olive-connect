import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createSessionAdapter, type SessionAdapter, type Session, type User } from './session';

interface SessionContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials?: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
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
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const adapter = getAdapter();

  useEffect(() => {
    let mounted = true;

    adapter.init().then(() => {
      if (!mounted) return;
      setSession(adapter.getSession());
      setIsLoading(false);
    });

    const unsubscribe = adapter.onChange((newSession) => {
      if (mounted) {
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [adapter]);

  const login = async (credentials?: { email: string; password: string }) => {
    await adapter.login(credentials);
  };

  const logout = async () => {
    await adapter.logout();
  };

  const hasRole = (role: string): boolean => {
    return adapter.hasRole(role);
  };

  const canAccessVerger = (vergerId: string): boolean => {
    return adapter.canAccessVerger(vergerId);
  };

  const value: SessionContextValue = {
    session,
    user: session?.user ?? null,
    isLoading,
    isAuthenticated: !!session?.user,
    login,
    logout,
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
  return allowedRoles.some((role) => user.roles.includes(role));
}

/**
 * Hook pour l'accès à un verger spécifique.
 */
export function useVergerAccess(vergerId: string): boolean {
  const { canAccessVerger, isLoading } = useSession();
  if (isLoading) return false;
  return canAccessVerger(vergerId);
}