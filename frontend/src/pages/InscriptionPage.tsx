import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BoutonGoogle } from '@/components/auth/BoutonGoogle';
import { useSession } from '@/auth/SessionContext';
import { accueilPourRole, ROLE_LABEL } from '@/auth/roles';
import { utilisateursApi } from '@/api/utilisateurs';
import { ErreurApi } from '@/api/client';

const schema = z.object({
  nom: z.string().trim().min(1, 'Le nom est obligatoire').max(80, '80 caractères maximum'),
  prenom: z.string().trim().min(1, 'Le prénom est obligatoire').max(80, '80 caractères maximum'),
  telephone: z
    .string()
    .trim()
    .max(20, '20 caractères maximum')
    .refine(
      (valeur) => valeur === '' || /^[+0-9 ().-]{6,20}$/.test(valeur),
      'Numéro de téléphone invalide',
    ),
});

type FormulaireInscription = z.infer<typeof schema>;

/**
 * Inscription : complète le profil du compte Google courant.
 *
 * Le backend ne reçoit que `nom`, `prenom` et `telephone` : l'email vient du
 * jeton Google et le rôle est attribué par un administrateur (`VISITEUR` par
 * défaut). Aucun rôle n'est donc proposé dans ce formulaire.
 */
export function InscriptionPage() {
  const navigate = useNavigate();
  const { user, role, profilComplet, isAuthenticated, isLoading, connecterAvecJeton, rafraichirProfil } =
    useSession();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormulaireInscription>({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', prenom: '', telephone: '' },
  });

  const gererJeton = async (jeton: string) => {
    setErreur(null);
    try {
      await connecterAvecJeton(jeton);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : 'Connexion Google impossible');
    }
  };

  const onSubmit = async (valeurs: FormulaireInscription) => {
    setErreur(null);
    setEnvoi(true);
    try {
      const telephone = valeurs.telephone.trim();
      await utilisateursApi.inscrire({
        nom: valeurs.nom.trim(),
        prenom: valeurs.prenom.trim(),
        ...(telephone ? { telephone } : {}),
      });
      await rafraichirProfil();
      navigate('/en-attente', { replace: true });
    } catch (cause) {
      if (cause instanceof ErreurApi && cause.statut === 409) {
        setErreur('Cette adresse est déjà inscrite. Reconnectez-vous.');
      } else if (cause instanceof ErreurApi && cause.statut === 400) {
        setErreur(cause.message);
      } else {
        setErreur("L’inscription a échoué. Réessayez dans un instant.");
      }
    } finally {
      setEnvoi(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  // Profil déjà complet : rien à faire ici.
  if (isAuthenticated && profilComplet) {
    return <Navigate to={accueilPourRole(role)} replace />;
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <header className="mb-6">
        <h1
          className="text-2xl font-semibold mb-2"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-ink)',
            letterSpacing: 'var(--tracking-display)',
          }}
        >
          Créer un compte
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          OliveConnect utilise votre compte Google. Aucun mot de passe supplémentaire n’est demandé.
        </p>
      </header>

      {!isAuthenticated ? (
        <section className="entry p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-ink)' }}>
            Connectez-vous d’abord avec Google : nous vérifions ensuite si un profil existe déjà
            pour cette adresse.
          </p>
          <BoutonGoogle onJeton={gererJeton} texte="continue_with" largeur={320} />
          {erreur && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }} role="alert">
              {erreur}
            </p>
          )}
        </section>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="entry p-6 space-y-4" noValidate>
          <div
            className="flex items-start gap-3 p-3 text-sm"
            style={{
              background: 'var(--color-paper-3)',
              border: '1px solid',
              borderColor: 'var(--color-rule)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-muted)',
            }}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
            <p>
              Compte Google : <strong style={{ color: 'var(--color-ink)' }}>{user?.email}</strong>
              <br />
              Votre rôle est attribué par un administrateur. Vous démarrez avec le rôle
              « {ROLE_LABEL.VISITEUR} ».
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Prénom" error={errors.prenom?.message} {...register('prenom')} autoComplete="given-name" />
            <Input label="Nom" error={errors.nom?.message} {...register('nom')} autoComplete="family-name" />
          </div>

          <Input
            label="Téléphone (facultatif)"
            type="tel"
            placeholder="+216 20 000 000"
            error={errors.telephone?.message}
            helperText="Utile pour joindre l’exploitation pendant une tournée."
            {...register('telephone')}
            autoComplete="tel"
          />

          {erreur && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }} role="alert">
              {erreur}
            </p>
          )}

          <Button type="submit" className="w-full btn--primary" loading={envoi} style={{ minHeight: '48px' }}>
            {envoi ? 'Envoi de la demande…' : 'Envoyer la demande de compte'}
          </Button>

          <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
            Votre adresse email n’est pas modifiable : elle provient de votre compte Google.
          </p>
        </form>
      )}
    </div>
  );
}
