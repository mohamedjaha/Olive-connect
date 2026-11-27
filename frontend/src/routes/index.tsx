import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute, PublicRoute } from '@/auth/ProtectedRoute';
import { Badge } from '@/components/ui/Badge';
import { Loader2 } from 'lucide-react';

// Pages livrées au fil des jalons. Seule la page de connexion existe en M0 :
// les autres modules (M3 → M8) affichent `PageEnPreparation` en attendant.
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
    </div>
  );
}

function LazyPageWrapper({ Component }: { Component: React.ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

/**
 * Page d'attente d'un module non encore livré.
 * Elle conserve la matrice de routes et de rôles définie en M0 sans dépendre
 * de pages qui n'existent pas encore dans le dépôt.
 */
function PageEnPreparation({ titre }: { titre: string }) {
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <Badge variant="muted" className="mb-4">Module en préparation</Badge>
      <h1
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
      >
        {titre}
      </h1>
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        Cette section sera disponible dans un prochain jalon.
      </p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <div className="p-8 text-center">Erreur de chargement</div>,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: 'vergers',
        element: (
          <ProtectedRoute allowedRoles={['AGRICULTEUR', 'RESPONSABLE_COLLECTE']}>
            <PageEnPreparation titre="Mes vergers" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'vergers/new',
        element: (
          <ProtectedRoute allowedRoles={['AGRICULTEUR', 'RESPONSABLE_COLLECTE']}>
            <PageEnPreparation titre="Nouveau verger" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'vergers/:id',
        element: (
          <ProtectedRoute allowedRoles={['AGRICULTEUR', 'RESPONSABLE_COLLECTE']}>
            <PageEnPreparation titre="Détail du verger" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'recoltes',
        element: (
          <ProtectedRoute allowedRoles={['AGRICULTEUR', 'RESPONSABLE_COLLECTE']}>
            <PageEnPreparation titre="Récoltes" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'alertes',
        element: (
          <ProtectedRoute allowedRoles={['AGRICULTEUR', 'RESPONSABLE_COLLECTE']}>
            <PageEnPreparation titre="Alertes" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tournees',
        element: (
          <ProtectedRoute allowedRoles={['RESPONSABLE_COLLECTE', 'CHEF_EQUIPE']}>
            <PageEnPreparation titre="Tournées" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'carte',
        element: (
          <ProtectedRoute>
            <PageEnPreparation titre="Carte interactive" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ressources',
        element: (
          <ProtectedRoute allowedRoles={['RESPONSABLE_LOGISTIQUE']}>
            <PageEnPreparation titre="Ressources" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pressoirs',
        element: (
          <ProtectedRoute allowedRoles={['RESPONSABLE_PRESSOIR']}>
            <PageEnPreparation titre="Pressoirs" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['ADMINISTRATEUR']}>
            <PageEnPreparation titre="Administration" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profil',
        element: (
          <ProtectedRoute>
            <PageEnPreparation titre="Mon profil" />
          </ProtectedRoute>
        ),
      },
      {
        path: 'aide',
        element: (
          <ProtectedRoute>
            <PageEnPreparation titre="Aide" />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Route de login (publique) — redirige vers page d'accueil selon le rôle
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LazyPageWrapper Component={LoginPage} />
      </PublicRoute>
    ),
  },
  // Callback OIDC (pour plus tard)
  {
    path: '/callback',
    element: <div className="min-h-screen flex items-center justify-center">Authentification en cours…</div>,
  },
]);
