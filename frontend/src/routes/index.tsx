import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute, PublicRoute } from '@/auth/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy-loaded pages (code-split)
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const VergersListPage = lazy(() => import('@/pages/VergersListPage').then((m) => ({ default: m.VergersListPage })));
const VergerDetailPage = lazy(() => import('@/pages/VergerDetailPage').then((m) => ({ default: m.VergerDetailPage })));
const RecoltesListPage = lazy(() => import('@/pages/RecoltesListPage').then((m) => ({ default: m.RecoltesListPage })));
const AlertesListPage = lazy(() => import('@/pages/AlertesListPage').then((m) => ({ default: m.AlertesListPage })));
const TourneesListPage = lazy(() => import('@/pages/TourneesListPage').then((m) => ({ default: m.TourneesListPage })));
const ComingSoonPage = lazy(() => import('@/pages/ComingSoonPage').then((m) => ({ default: m.ComingSoonPage })));
const CartePage = lazy(() => import('@/pages/CartePage').then((m) => ({ default: m.CartePage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
    </div>
  );
}

// Wrapper that adds Suspense boundary around lazy pages
function LazyPageWrapper({ Component }: { Component: React.ComponentType<any> }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
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
            <LazyPageWrapper Component={VergersListPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'vergers/new',
        element: (
          <ProtectedRoute allowedRoles={['AGRICULTEUR', 'RESPONSABLE_COLLECTE']}>
            <LazyPageWrapper Component={VergersListPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'vergers/:id',
        element: (
          <ProtectedRoute allowedRoles={['AGRICULTEUR', 'RESPONSABLE_COLLECTE']}>
            <LazyPageWrapper Component={VergerDetailPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'recoltes',
        element: (
          <ProtectedRoute allowedRoles={['AGRICULTEUR', 'RESPONSABLE_COLLECTE']}>
            <LazyPageWrapper Component={RecoltesListPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'alertes',
        element: (
          <ProtectedRoute allowedRoles={['AGRICULTEUR', 'RESPONSABLE_COLLECTE']}>
            <LazyPageWrapper Component={AlertesListPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tournees',
        element: (
          <ProtectedRoute allowedRoles={['RESPONSABLE_COLLECTE', 'CHEF_EQUIPE']}>
            <LazyPageWrapper Component={TourneesListPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'carte',
        element: (
          <ProtectedRoute>
            <LazyPageWrapper Component={CartePage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ressources',
        element: (
          <ProtectedRoute allowedRoles={['RESPONSABLE_LOGISTIQUE']}>
            <div className="text-center py-12">Ressources - À venir</div>
          </ProtectedRoute>
        ),
      },
      {
        path: 'pressoirs',
        element: (
          <ProtectedRoute allowedRoles={['RESPONSABLE_PRESSOIR']}>
            <div className="text-center py-12">Pressoirs - À venir</div>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['ADMINISTRATEUR']}>
            <div className="text-center py-12">Administration - À venir</div>
          </ProtectedRoute>
        ),
      },
      {
        path: 'profil',
        element: (
          <ProtectedRoute>
            <LazyPageWrapper Component={ComingSoonPage} />
          </ProtectedRoute>
        ),
      },
      {
        path: 'aide',
        element: (
          <ProtectedRoute>
            <LazyPageWrapper Component={ComingSoonPage} />
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