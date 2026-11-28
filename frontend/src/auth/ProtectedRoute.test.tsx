import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import { SessionProvider } from './SessionContext';
import { FauxAdapter, sessionAvecRole } from '@/test/adapters';
import type { Session } from './session';

function monter(adapter: FauxAdapter, chemin: string) {
  return render(
    <SessionProvider adapter={adapter}>
      <MemoryRouter initialEntries={[chemin]}>
        <Routes>
          <Route
            path="/ressources"
            element={
              <ProtectedRoute allowedRoles={['RESPONSABLE_LOGISTIQUE']}>
                <p>Espace ressources</p>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <p>Espace administration</p>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inscription"
            element={<p>Page inscription</p>}
          />
          <Route path="/login" element={<p>Page connexion</p>} />
          <Route path="/acces-refuse" element={<p>Acces refuse</p>} />
          <Route path="/en-attente" element={<p>Compte en attente</p>} />
          <Route path="/vergers" element={<p>Espace vergers</p>} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
}

describe('ProtectedRoute', () => {
  it('renvoie un visiteur non connecté vers la connexion', async () => {
    monter(new FauxAdapter(null), '/ressources');
    expect(await screen.findByText('Page connexion')).toBeInTheDocument();
  });

  it('ouvre la page quand le rôle correspond', async () => {
    monter(new FauxAdapter(sessionAvecRole('RESPONSABLE_LOGISTIQUE')), '/ressources');
    expect(await screen.findByText('Espace ressources')).toBeInTheDocument();
  });

  it("n'enferme pas l'utilisateur dans une boucle de redirection", async () => {
    // Un agriculteur n'a pas accès aux ressources : il doit voir un refus,
    // jamais revenir sur /vergers (qui le refuserait à nouveau).
    monter(new FauxAdapter(sessionAvecRole('AGRICULTEUR')), '/ressources');

    expect(await screen.findByText('Acces refuse')).toBeInTheDocument();
    expect(screen.queryByText('Espace vergers')).not.toBeInTheDocument();
  });

  it('accepte le rôle ADMIN du backend pour la section administration', async () => {
    monter(new FauxAdapter(sessionAvecRole('ADMIN')), '/admin');
    expect(await screen.findByText('Espace administration')).toBeInTheDocument();
  });

  it('accepte aussi l\'alias ADMINISTRATEUR', async () => {
    monter(new FauxAdapter(sessionAvecRole('ADMINISTRATEUR')), '/admin');
    expect(await screen.findByText('Espace administration')).toBeInTheDocument();
  });

  it("envoie un profil incomplet vers l'inscription", async () => {
    const session: Session = {
      ...sessionAvecRole('VISITEUR'),
      profilComplet: false,
    };
    monter(new FauxAdapter(session), '/ressources');

    expect(await screen.findByText('Page inscription')).toBeInTheDocument();
  });
});

describe('PublicRoute', () => {
  function monterPublic(session: Session | null) {
    return render(
      <SessionProvider adapter={new FauxAdapter(session)}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <p>Formulaire de connexion</p>
                </PublicRoute>
              }
            />
            <Route path="/vergers" element={<p>Espace vergers</p>} />
            <Route path="/inscription" element={<p>Page inscription</p>} />
            <Route path="/en-attente" element={<p>Compte en attente</p>} />
          </Routes>
        </MemoryRouter>
      </SessionProvider>,
    );
  }

  it('affiche le formulaire quand personne n\'est connecté', async () => {
    monterPublic(null);
    expect(await screen.findByText('Formulaire de connexion')).toBeInTheDocument();
  });

  it("redirige un utilisateur connecté vers l'accueil de son rôle", async () => {
    monterPublic(sessionAvecRole('AGRICULTEUR'));
    expect(await screen.findByText('Espace vergers')).toBeInTheDocument();
  });

  it('redirige un visiteur vers l\'écran d\'attente, pas vers une page protégée', async () => {
    monterPublic(sessionAvecRole('VISITEUR'));
    expect(await screen.findByText('Compte en attente')).toBeInTheDocument();
  });

  it("redirige un profil incomplet vers l'inscription", async () => {
    monterPublic({ ...sessionAvecRole('VISITEUR'), profilComplet: false });
    expect(await screen.findByText('Page inscription')).toBeInTheDocument();
  });
});
