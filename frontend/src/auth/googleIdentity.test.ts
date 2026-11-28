import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  afficherBoutonGoogle,
  chargerGoogleIdentity,
  deconnecterGoogle,
  decoderJetonGoogle,
  reinitialiserGoogleIdentity,
} from './googleIdentity';
import { fabriquerJeton, jetonValide } from '@/test/jetons';

const SELECTEUR = 'script[src="https://accounts.google.com/gsi/client"]';

function installerGoogle(id: Record<string, unknown>): void {
  window.google = { accounts: { id: id as never } };
}

beforeEach(() => {
  reinitialiserGoogleIdentity();
  document.querySelectorAll(SELECTEUR).forEach((script) => script.remove());
  delete window.google;
});

afterEach(() => {
  delete window.google;
});

describe('decoderJetonGoogle', () => {
  it('lit les champs utiles du jeton', () => {
    const charge = decoderJetonGoogle(jetonValide());

    expect(charge?.email).toBe('fedi@oliveconnect.tn');
    expect(charge?.name).toBe('Fedi Hassine');
    expect(charge?.email_verified).toBe(true);
    expect(charge?.sub).toBe('google-123');
    expect(typeof charge?.exp).toBe('number');
  });

  it('gère les caractères accentués (UTF-8)', () => {
    const jeton = fabriquerJeton({
      email: 'rené@oliveconnect.tn',
      name: 'René Béné',
      exp: Math.floor(Date.now() / 1000) + 600,
    });

    expect(decoderJetonGoogle(jeton)?.name).toBe('René Béné');
  });

  it('rejette un jeton mal formé', () => {
    expect(decoderJetonGoogle('pas-un-jwt')).toBeNull();
    expect(decoderJetonGoogle('a.b.c')).toBeNull();
    expect(decoderJetonGoogle('')).toBeNull();
  });

  it('rejette un jeton sans email ou sans expiration', () => {
    expect(decoderJetonGoogle(fabriquerJeton({ exp: 123 }))).toBeNull();
    expect(decoderJetonGoogle(fabriquerJeton({ email: 'a@b.tn' }))).toBeNull();
  });
});

describe('chargerGoogleIdentity', () => {
  it('injecte le script une seule fois puis résout accounts.id', async () => {
    const promesse = chargerGoogleIdentity();

    const scripts = document.querySelectorAll<HTMLScriptElement>(SELECTEUR);
    expect(scripts).toHaveLength(1);

    const id = {
      initialize: vi.fn(),
      renderButton: vi.fn(),
      disableAutoSelect: vi.fn(),
      cancel: vi.fn(),
    };
    installerGoogle(id);
    scripts[0].dispatchEvent(new Event('load'));

    await expect(promesse).resolves.toBe(id);

    const seconde = chargerGoogleIdentity();
    expect(document.querySelectorAll(SELECTEUR)).toHaveLength(1);
    await expect(seconde).resolves.toBe(id);
  });

  it('réutilise un accounts.id déjà présent', async () => {
    const id = { initialize: vi.fn(), renderButton: vi.fn(), disableAutoSelect: vi.fn(), cancel: vi.fn() };
    installerGoogle(id);

    await expect(chargerGoogleIdentity()).resolves.toBe(id);
    expect(document.querySelectorAll(SELECTEUR)).toHaveLength(0);
  });

  it("échoue proprement si le script ne s'exécute pas", async () => {
    const promesse = chargerGoogleIdentity();
    document.querySelector<HTMLScriptElement>(SELECTEUR)!.dispatchEvent(new Event('error'));

    await expect(promesse).rejects.toThrow('Impossible de charger Google Identity Services');
  });
});

describe('afficherBoutonGoogle', () => {
  it('initialise le client et rend le bouton officiel', async () => {
    const initialize = vi.fn();
    const renderButton = vi.fn();
    installerGoogle({ initialize, renderButton, disableAutoSelect: vi.fn(), cancel: vi.fn() });

    const conteneur = document.createElement('div');
    const onJeton = vi.fn();

    await afficherBoutonGoogle(conteneur, { clientId: 'client-de-test', onJeton });

    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'client-de-test', auto_select: false }),
    );
    expect(renderButton).toHaveBeenCalledWith(
      conteneur,
      expect.objectContaining({ text: 'signin_with', locale: 'fr' }),
    );

    // Le callback Google transmet bien le jeton au composant.
    const configuration = initialize.mock.calls[0][0] as {
      callback: (reponse: { credential: string }) => void;
    };
    configuration.callback({ credential: 'jeton-google' });
    expect(onJeton).toHaveBeenCalledWith({ credential: 'jeton-google' });
  });

  it('vide le conteneur avant de rendre (StrictMode)', async () => {
    const renderButton = vi.fn();
    installerGoogle({ initialize: vi.fn(), renderButton, disableAutoSelect: vi.fn(), cancel: vi.fn() });

    const conteneur = document.createElement('div');
    conteneur.appendChild(document.createElement('span'));

    await afficherBoutonGoogle(conteneur, { clientId: 'client-de-test', onJeton: vi.fn() });

    expect(conteneur.children).toHaveLength(0);
  });
});

describe('deconnecterGoogle', () => {
  it('coupe la reconnexion automatique', async () => {
    const disableAutoSelect = vi.fn();
    installerGoogle({ initialize: vi.fn(), renderButton: vi.fn(), disableAutoSelect, cancel: vi.fn() });

    await deconnecterGoogle();

    expect(disableAutoSelect).toHaveBeenCalledTimes(1);
  });

  it("ne casse rien quand Google n'est pas chargé", async () => {
    await expect(deconnecterGoogle()).resolves.toBeUndefined();
  });
});
