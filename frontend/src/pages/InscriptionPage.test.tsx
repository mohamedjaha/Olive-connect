import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InscriptionPage } from './InscriptionPage';
import { SessionProvider } from '@/auth/SessionContext';
import { FauxAdapter, sessionAvecRole } from '@/test/adapters';
import type { Session } from '@/auth/session';
import { definirJeton } from '@/api/client';

let corpsInscription: Record<string, unknown> | null = null;

const server = setupServer(
  http.post('/api/users/register', async ({ request }) => {
    corpsInscription = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'u-1',
        nom: 'Hassine',
        prenom: 'Fedi',
        email: 'fedi@oliveconnect.tn',
        telephone: null,
        role: 'VISITEUR',
        actif: true,
      },
      { status: 201 },
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  corpsInscription = null;
  definirJeton(null);
});
afterAll(() => server.close());

const SESSION_INCOMPLETE: Session = {
  ...sessionAvecRole('VISITEUR'),
  profilComplet: false,
};

function monter(session: Session | null) {
  return render(
    <SessionProvider adapter={new FauxAdapter(session)}>
      <MemoryRouter initialEntries={['/inscription']}>
        <Routes>
          <Route path="/inscription" element={<InscriptionPage />} />
          <Route path="/en-attente" element={<p>Compte en attente</p>} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  );
}

describe('InscriptionPage', () => {
  it("invite à se connecter avec Google quand personne n'est connecté", async () => {
    monter(null);

    expect(await screen.findByText(/Connectez-vous d’abord avec Google/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Nom')).not.toBeInTheDocument();
  });

  it('affiche le compte Google et ne propose aucun rôle', async () => {
    monter(SESSION_INCOMPLETE);

    expect(await screen.findByLabelText('Nom')).toBeInTheDocument();
    expect(screen.getByText('test@oliveconnect.tn')).toBeInTheDocument();
    expect(screen.queryByLabelText(/rôle/i)).not.toBeInTheDocument();
    expect(screen.getByText(/attribué par un administrateur/i)).toBeInTheDocument();
  });

  it('valide les champs obligatoires', async () => {
    monter(SESSION_INCOMPLETE);

    fireEvent.click(await screen.findByRole('button', { name: /Envoyer la demande/i }));

    expect(await screen.findByText('Le prénom est obligatoire')).toBeInTheDocument();
    expect(screen.getByText('Le nom est obligatoire')).toBeInTheDocument();
    expect(corpsInscription).toBeNull();
  });

  it('envoie uniquement nom, prénom et téléphone puis passe en attente', async () => {
    monter(SESSION_INCOMPLETE);

    fireEvent.change(await screen.findByLabelText('Prénom'), { target: { value: 'Fedi' } });
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Hassine' } });
    fireEvent.change(screen.getByLabelText(/Téléphone/i), { target: { value: '+216 20 000 000' } });
    fireEvent.click(screen.getByRole('button', { name: /Envoyer la demande/i }));

    await waitFor(() => {
      expect(corpsInscription).toEqual({
        nom: 'Hassine',
        prenom: 'Fedi',
        telephone: '+216 20 000 000',
      });
    });
    expect(corpsInscription).not.toHaveProperty('email');
    expect(corpsInscription).not.toHaveProperty('role');
    expect(await screen.findByText('Compte en attente')).toBeInTheDocument();
  });

  it('signale une adresse déjà inscrite (409)', async () => {
    server.use(
      http.post('/api/users/register', () =>
        HttpResponse.json({ message: 'Utilisateur deja inscrit' }, { status: 409 }),
      ),
    );
    monter(SESSION_INCOMPLETE);

    fireEvent.change(await screen.findByLabelText('Prénom'), { target: { value: 'Fedi' } });
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Hassine' } });
    fireEvent.click(screen.getByRole('button', { name: /Envoyer la demande/i }));

    expect(await screen.findByText(/déjà inscrite/i)).toBeInTheDocument();
  });
});
