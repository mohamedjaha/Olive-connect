import { useEffect, useRef, useState } from 'react';
import { afficherBoutonGoogle } from '@/auth/googleIdentity';
import { clientIdGoogle } from '@/auth/session';

interface BoutonGoogleProps {
  /** Reçoit le jeton d'identité Google (JWT) renvoyé par le bouton officiel. */
  onJeton: (jeton: string) => void;
  /** Libellé du bouton Google : connexion ou création de compte. */
  texte?: 'signin_with' | 'continue_with' | 'signup_with';
  /** Largeur demandée, en pixels. */
  largeur?: number;
  className?: string;
}

/**
 * Bouton officiel « Se connecter avec Google ».
 *
 * Le bouton est rendu par Google dans une iframe : c'est le seul moyen conforme
 * d'obtenir un jeton d'identité. Sans `VITE_GOOGLE_CLIENT_ID`, le composant
 * affiche la configuration manquante au lieu d'un bouton inerte.
 */
export function BoutonGoogle({ onJeton, texte = 'signin_with', largeur = 320, className = '' }: BoutonGoogleProps) {
  const conteneur = useRef<HTMLDivElement>(null);
  const rappel = useRef(onJeton);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    rappel.current = onJeton;
  }, [onJeton]);

  const identifiant = clientIdGoogle();

  useEffect(() => {
    if (!identifiant || !conteneur.current) return;

    let annule = false;
    afficherBoutonGoogle(conteneur.current, {
      clientId: identifiant,
      largeur,
      texte,
      onJeton: (reponse) => rappel.current(reponse.credential),
    }).catch((cause: unknown) => {
      if (annule) return;
      setErreur(
        cause instanceof Error ? cause.message : 'Connexion Google indisponible pour le moment',
      );
    });

    return () => {
      annule = true;
    };
  }, [identifiant, largeur, texte]);

  if (!identifiant) {
    return (
      <div
        className={`text-sm ${className}`}
        style={{
          color: 'var(--color-muted)',
          background: 'var(--color-paper-3)',
          border: '1px solid',
          borderColor: 'var(--color-rule)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
        }}
        role="status"
      >
        Configuration manquante : renseignez <code>VITE_GOOGLE_CLIENT_ID</code> dans
        <code> frontend/.env.local</code> pour activer la connexion Google.
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={conteneur} className="flex justify-center" style={{ minHeight: '44px' }} />
      {erreur && (
        <p className="mt-2 text-sm" style={{ color: 'var(--color-error)' }} role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}
