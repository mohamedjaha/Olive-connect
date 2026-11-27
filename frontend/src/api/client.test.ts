import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ErreurApi, chaineDeRequete, clientHttp, definirJeton, surExpirationSession } from './client';

const server = setupServer(
  http.get('/api/ping', ({ request }) => HttpResponse.json({ authorization: request.headers.get('authorization') })),
  http.get('/api/prive', () => HttpResponse.json({ message: 'Non autorisé' }, { status: 401 })),
  http.delete('/api/ressource/1', () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  definirJeton(null);
});
afterAll(() => server.close());

describe('chaineDeRequete', () => {
  it('ignore les valeurs absentes ou vides', () => {
    expect(chaineDeRequete({ a: 1, b: undefined, c: null, d: '' })).toBe('?a=1');
  });

  it('conserve 0 et false', () => {
    expect(chaineDeRequete({ page: 0, actif: false })).toBe('?page=0&actif=false');
  });

  it('retourne une chaîne vide sans paramètres', () => {
    expect(chaineDeRequete()).toBe('');
  });
});

describe('intercepteur de requête', () => {
  it("n'envoie pas d'Authorization sans jeton", async () => {
    const reponse = await clientHttp.get<{ authorization: string | null }>('/ping');
    expect(reponse.authorization).toBeNull();
  });

  it('ajoute le Bearer quand un jeton est défini', async () => {
    definirJeton('jeton-de-test');
    const reponse = await clientHttp.get<{ authorization: string | null }>('/ping');
    expect(reponse.authorization).toBe('Bearer jeton-de-test');
  });
});

describe('intercepteur de réponse', () => {
  it('mappe une erreur HTTP en ErreurApi avec le message du serveur', async () => {
    expect.assertions(3);
    try {
      await clientHttp.get('/prive');
    } catch (erreur) {
      expect(erreur).toBeInstanceOf(ErreurApi);
      expect((erreur as ErreurApi).statut).toBe(401);
      expect((erreur as ErreurApi).message).toBe('Non autorisé');
    }
  });

  it('signale un 401 pour déclencher la déconnexion', async () => {
    const expiration = vi.fn();
    const desabonner = surExpirationSession(expiration);

    await expect(clientHttp.get('/prive')).rejects.toBeInstanceOf(ErreurApi);
    expect(expiration).toHaveBeenCalledTimes(1);

    desabonner();
  });

  it('retourne undefined sur une réponse 204', async () => {
    await expect(clientHttp.supprimer('/ressource/1')).resolves.toBeUndefined();
  });
});
