import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { SessionProvider } from '@/auth/SessionContext';
import { MockAdapter } from '@/auth/session';
import { FauxAdapter, sessionAvecRole } from '@/test/adapters';

function monter(adapter: MockAdapter | FauxAdapter) {
  return render(
    <SessionProvider adapter={adapter}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </SessionProvider>,
  );
}

describe('LoginPage en mode démonstration', () => {
  it('affiche le formulaire email / mot de passe et les comptes démo', async () => {
    monter(new MockAdapter());

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByText('Comptes de démonstration')).toBeInTheDocument();
    expect(screen.queryByText(/compte Google/i)).not.toBeInTheDocument();
  });

  it('signale des identifiants invalides', async () => {
    monter(new MockAdapter());

    fireEvent.change(await screen.findByLabelText('Email'), {
      target: { value: 'agri@test.tn' },
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'faux' } });
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));

    expect(await screen.findByText('Email ou mot de passe invalide')).toBeInTheDocument();
  });

  it('valide le format de l\'email avant envoi', async () => {
    monter(new MockAdapter());

    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'pas-un-email' } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'agri' } });
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));

    expect(await screen.findByText('Email invalide')).toBeInTheDocument();
  });
});

describe('LoginPage en mode Google', () => {
  it('remplace le formulaire par la connexion Google', async () => {
    monter(new FauxAdapter(sessionAvecRole('AGRICULTEUR')));

    expect(await screen.findByText(/utilise votre compte Google/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Mot de passe')).not.toBeInTheDocument();
    expect(screen.queryByText('Comptes de démonstration')).not.toBeInTheDocument();
  });

  it('propose la création de compte', async () => {
    monter(new FauxAdapter(null));

    const lien = await screen.findByRole('link', { name: 'Créer un compte' });
    expect(lien).toHaveAttribute('href', '/inscription');
  });

  it('explique la configuration manquante sans client Google', async () => {
    monter(new FauxAdapter(null));

    expect(await screen.findByText(/VITE_GOOGLE_CLIENT_ID/)).toBeInTheDocument();
  });
});
