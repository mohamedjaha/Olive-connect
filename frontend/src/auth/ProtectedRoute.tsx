import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from './SessionContext';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  /** Rôles autorisés à accéder à cette route. Si vide, tout utilisateur connecté peut accéder. */
  allowedRoles?: string[];
  /** Verger ID requis (pour les routes spécifiques à un verger). */
  vergerId?: string;
  children?: ReactNode;
}

/**
 * Route protégée par authentification et/ou rôles.
 * Redirige vers /login si non authentifié, ou vers /vergers si pas les droits.
 */
export function ProtectedRoute({ allowedRoles = [], vergerId, children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, hasRole, canAccessVerger } = useSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.some((role) => hasRole(role))) {
    return <Navigate to="/vergers" replace />;
  }

  if (vergerId && !canAccessVerger(vergerId)) {
    return <Navigate to="/vergers" replace />;
  }

  return <>{children}</>;
}

/**
 * Route publique (accessible sans auth) — redirige si déjà connecté.
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/vergers" replace />;
  }

  return <>{children}</>;
}

/**
 * Wrapper pour les pages qui nécessitent un verger spécifique.
 */
export function VergerProtectedRoute({ children }: { children: React.ReactNode }) {
  // Le vergerId sera récupéré depuis les params de la route par le composant enfant
  return <ProtectedRoute>{children}</ProtectedRoute>;
}