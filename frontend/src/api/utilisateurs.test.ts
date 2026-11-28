import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { utilisateursApi } from './utilisateurs';
import { ErreurApi, definirJeton } from './client';

const PROFIL = {
  id: 'u-1',
  nom: 'Hassine',
  prenom: 'Fedi',
  email: 'fedi@oliveconnect.tn',
  telephone: '+216 20 000 000',
  role: 'AGRICULTEUR',
  actif: true,
};

let corpsInscription: Record<string, unknown> | null = null;

const server = setupServer(
  http.get('/api/users/me', () => HttpResponse.json(PROFIL)),

  http.post('/api/users/register', async ({ request }) => {
    corpsInscription = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...PROFIL, role: 'VISITEUR' }, { status: 201 });
  }),

  http.patch('/api/users/:id/role', async ({ params, request }) => {
    const corps = (await request.json()) as { role: string };
    return HttpResponse.json({ ...PROFIL, id: params.id, role: corps.role });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  corpsInscription = null;
  definirJeton(null);
});
afterAll(() => server.close());

describe('utilisateursApi.moi', () => {
  it('retourne le profil du jeton', async () => {
    const profil = await utilisateursApi.moi();
    expect(profil.email).toBe('fedi@oliveconnect.tn');
    expect(profil.role).toBe('AGRICULTEUR');
  });

  it('remonte un 404 quand le compte n\'est pas inscrit', async () => {
    server.use(
      http.get('/api/users/me', () =>
        HttpResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 }),
      ),
    );

    await expect(utilisateursApi.moi()).rejects.toMatchObject({
      name: 'ErreurApi',
      statut: 404,
      message: 'Utilisateur introuvable',
    });
  });
});

describe('utilisateursApi.inscrire', () => {
  it("n'envoie ni email ni rôle : ils viennent du jeton et de l'administrateur", async () => {
    await utilisateursApi.inscrire({ nom: 'Hassine', prenom: 'Fedi', telephone: '+216 20 000 000' });

    expect(corpsInscription).toEqual({
      nom: 'Hassine',
      prenom: 'Fedi',
      telephone: '+216 20 000 000',
    });
    expect(corpsInscription).not.toHaveProperty('email');
    expect(corpsInscription).not.toHaveProperty('role');
  });

  it('omet le téléphone quand il est vide', async () => {
    await utilisateursApi.inscrire({ nom: 'Hassine', prenom: 'Fedi' });

    expect(Object.keys(corpsInscription ?? {})).toEqual(['nom', 'prenom']);
  });

  it('signale une inscription déjà faite (409)', async () => {
    server.use(
      http.post('/api/users/register', () =>
        HttpResponse.json({ message: 'Utilisateur deja inscrit' }, { status: 409 }),
      ),
    );

    await expect(
      utilisateursApi.inscrire({ nom: 'Hassine', prenom: 'Fedi' }),
    ).rejects.toBeInstanceOf(ErreurApi);
  });
});

describe('utilisateursApi.attribuerRole', () => {
  it('transmet le rôle à attribuer', async () => {
    const profil = await utilisateursApi.attribuerRole('u-1', 'RESPONSABLE_COLLECTE');
    expect(profil.role).toBe('RESPONSABLE_COLLECTE');
  });
});
