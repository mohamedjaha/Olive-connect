import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MockAdapter, OIDCAdapter } from './session';
import { decoderJetonGoogle } from './googleIdentity';
import { definirJeton, lireJeton } from '@/api/client';
import { jetonExpire, jetonValide } from '@/test/jetons';

const PROFIL = {
  id: 'u-1',
  nom: 'Hassine',
  prenom: 'Fedi',
  email: 'fedi@oliveconnect.tn',
  telephone: null,
  role: 'AGRICULTEUR',
  actif: true,
};

const server = setupServer(http.get('/api/users/me', () => HttpResponse.json(PROFIL)));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  sessionStorage.clear();
  localStorage.clear();
  definirJeton(null);
});
afterAll(() => server.close());

beforeEach(() => {
  sessionStorage.clear();
});

describe('OIDCAdapter : connexion avec un jeton Google', () => {
  it('hydrate la session avec le rôle lu dans la collection users', async () => {
    const adapter = new OIDCAdapter();
    const jeton = jetonValide();

    await adapter.connecterAvecJeton(jeton);

    const session = adapter.getSession();
    expect(session?.profilComplet).toBe(true);
    expect(session?.user?.email).toBe('fedi@oliveconnect.tn');
    expect(session?.user?.roles).toEqual(['AGRICULTEUR']);
    expect(session?.accessToken).toBe(jeton);
    expect(session?.refreshToken).toBeNull();
    // Le jeton alimente l'intercepteur Axios dès la connexion.
    expect(lireJeton()).toBe(jeton);
  });

  it('conserve le jeton mais signale un profil incomplet sur un 404', async () => {
    server.use(
      http.get('/api/users/me', () =>
        HttpResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 }),
      ),
    );

    const adapter = new OIDCAdapter();
    await adapter.connecterAvecJeton(jetonValide());

    const session = adapter.getSession();
    expect(session?.profilComplet).toBe(false);
    expect(session?.user?.roles).toEqual(['VISITEUR']);
    expect(sessionStorage.getItem('oliveconnect_jeton_google')).toBeTruthy();
  });

  it('refuse un compte désactivé et ne laisse aucune session', async () => {
    server.use(
      http.get('/api/users/me', () =>
        HttpResponse.json({ message: 'Compte desactive' }, { status: 403 }),
      ),
    );

    const adapter = new OIDCAdapter();
    await expect(adapter.connecterAvecJeton(jetonValide())).rejects.toThrow('Compte desactive');

    expect(adapter.getSession()).toBeNull();
    expect(lireJeton()).toBeNull();
    expect(sessionStorage.getItem('oliveconnect_jeton_google')).toBeNull();
  });

  it('refuse un jeton expiré', async () => {
    const adapter = new OIDCAdapter();
    await expect(adapter.connecterAvecJeton(jetonExpire())).rejects.toThrow('Jeton Google expiré');
    expect(adapter.getSession()).toBeNull();
  });

  it('refuse une adresse Google non vérifiée', async () => {
    const adapter = new OIDCAdapter();
    await expect(
      adapter.connecterAvecJeton(jetonValide({ email_verified: false })),
    ).rejects.toThrow('Adresse Google non vérifiée');
  });

  it('refuse un jeton illisible', async () => {
    const adapter = new OIDCAdapter();
    await expect(adapter.connecterAvecJeton('nimporte-quoi')).rejects.toThrow(
      'Jeton Google illisible',
    );
  });
});

describe('OIDCAdapter : reprise et déconnexion', () => {
  it('restaure une session valide depuis le stockage', async () => {
    const jeton = jetonValide();
    sessionStorage.setItem('oliveconnect_jeton_google', jeton);

    const adapter = new OIDCAdapter();
    await adapter.init();

    expect(adapter.getSession()?.user?.roles).toEqual(['AGRICULTEUR']);
    expect(adapter.getSession()?.profilComplet).toBe(true);
    expect(lireJeton()).toBe(jeton);
  });

  it('ignore un jeton expiré au démarrage', async () => {
    sessionStorage.setItem('oliveconnect_jeton_google', jetonExpire());

    const adapter = new OIDCAdapter();
    await adapter.init();

    expect(adapter.getSession()).toBeNull();
    expect(sessionStorage.getItem('oliveconnect_jeton_google')).toBeNull();
  });

  it('ne démarre aucune session sans jeton stocké', async () => {
    const adapter = new OIDCAdapter();
    await adapter.init();
    expect(adapter.getSession()).toBeNull();
  });

  it('vide le stockage et le jeton HTTP à la déconnexion', async () => {
    const adapter = new OIDCAdapter();
    await adapter.connecterAvecJeton(jetonValide());

    await adapter.logout();

    expect(adapter.getSession()).toBeNull();
    expect(sessionStorage.getItem('oliveconnect_jeton_google')).toBeNull();
    expect(lireJeton()).toBeNull();
  });

  it("n'accepte pas la connexion par identifiants en mode Google", async () => {
    const adapter = new OIDCAdapter();
    await expect(adapter.login()).rejects.toThrow('Se connecter avec Google');
  });

  it('déconnecte quand le jeton a expiré au rafraîchissement', async () => {
    sessionStorage.setItem('oliveconnect_jeton_google', jetonExpire());
    const adapter = new OIDCAdapter();
    await adapter.init();

    await adapter.refresh();

    expect(adapter.getSession()).toBeNull();
  });
});

describe('OIDCAdapter : rôles', () => {
  it('normalise les alias de rôle', async () => {
    server.use(
      http.get('/api/users/me', () => HttpResponse.json({ ...PROFIL, role: 'ADMIN' })),
    );

    const adapter = new OIDCAdapter();
    await adapter.connecterAvecJeton(jetonValide());

    expect(adapter.hasRole('ADMIN')).toBe(true);
    expect(adapter.hasRole('ADMINISTRATEUR')).toBe(true);
    expect(adapter.hasRole('AGRICULTEUR')).toBe(false);
  });

  it('laisse le serveur trancher quand la liste des vergers est absente', async () => {
    const adapter = new OIDCAdapter();
    await adapter.connecterAvecJeton(jetonValide());
    expect(adapter.canAccessVerger('nimporte-quel-verger')).toBe(true);
  });
});

describe('MockAdapter : régression', () => {
  it('connecte un compte de démonstration et expose ADMIN', async () => {
    const adapter = new MockAdapter();
    await adapter.init();
    await adapter.login({ email: 'admin@test.tn', password: 'admin' });

    expect(adapter.getSession()?.user?.roles).toEqual(['ADMIN']);
    expect(adapter.hasRole('ADMINISTRATEUR')).toBe(true);
    expect(adapter.getSession()?.profilComplet).toBe(true);
  });

  it('refuse un mot de passe incorrect', async () => {
    const adapter = new MockAdapter();
    await adapter.init();
    await expect(adapter.login({ email: 'agri@test.tn', password: 'faux' })).rejects.toThrow(
      'Email ou mot de passe invalide',
    );
  });

  it('ne reprend pas de session au rechargement', async () => {
    const premier = new MockAdapter();
    await premier.login({ email: 'agri@test.tn', password: 'agri' });
    expect(premier.getSession()).not.toBeNull();

    const second = new MockAdapter();
    await second.init();
    expect(second.getSession()).toBeNull();
  });
});

describe('jetons de test', () => {
  it('produit un jeton décodable', () => {
    expect(decoderJetonGoogle(jetonValide())?.email).toBe('fedi@oliveconnect.tn');
  });
});
