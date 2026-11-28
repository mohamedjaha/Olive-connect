import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSession } from './SessionContext';
import { accueilPourRole } from './roles';

interface ProtectedRouteProps {
  /** Rôles autorisés à accéder à cette route. Si vide, tout utilisateur connecté peut accéder. */
  allowedRoles?: string[];
  /** Verger ID requis (pour les routes spécifiques à un verger). */
  vergerId?: string;
  children?: ReactNode;
}

function Chargement() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
    </div>
  );
}

/**
 * Route protégée par authentification, profil complet et rôle.
 *
 * Un utilisateur connecté mais sans profil est envoyé vers l'inscription.
 * Un rôle insuffisant mène à `/acces-refuse`, jamais vers une page protégée
 * (sinon la redirection boucle).
 */
export function ProtectedRoute({ allowedRoles = [], vergerId, children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, profilComplet, hasRole, canAccessVerger } = useSession();
  const location = useLocation();

  if (isLoading) {
    return <Chargement />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profilComplet) {
    return <Navigate to="/inscription" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.some((role) => hasRole(role))) {
    return <Navigate to="/acces-refuse" replace />;
  }

  if (vergerId && !canAccessVerger(vergerId)) {
    return <Navigate to="/acces-refuse" replace />;
  }

  return <>{children}</>;
}

/**
 * Route publique (accessible sans authentification).
 * Un utilisateur déjà connecté repart vers l'accueil de son rôle.
 */
export function PublicRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, profilComplet, role } = useSession();

  if (isLoading) {
    return <Chargement />;
  }

  if (isAuthenticated) {
    return <Navigate to={profilComplet ? accueilPourRole(role) : '/inscription'} replace />;
  }

  return <>{children}</>;
}

/**
 * Wrapper pour les pages qui nécessitent un verger spécifique.
 */
export function VergerProtectedRoute({ children }: { children: ReactNode }) {
  // Le vergerId sera récupéré depuis les params de la route par le composant enfant
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
