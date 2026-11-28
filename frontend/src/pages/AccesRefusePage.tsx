import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useSession } from '@/auth/SessionContext';
import { accueilPourRole, libelleRole } from '@/auth/roles';

/**
 * Refus d'accès (403 côté interface).
 *
 * Remplace la redirection en boucle vers `/vergers` : un utilisateur connecté
 * mais sans le rôle requis atterrit ici, avec un chemin de retour valable pour
 * son propre rôle.
 */
export function AccesRefusePage() {
  const { role } = useSession();

  return (
    <div className="max-w-xl mx-auto py-12 text-center">
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
        style={{ background: 'var(--color-error-soft)', color: 'var(--color-error)' }}
      >
        <ShieldAlert className="w-6 h-6" aria-hidden="true" />
      </div>

      <h1
        className="text-2xl font-semibold mb-2"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-ink)',
          letterSpacing: 'var(--tracking-display)',
        }}
      >
        Accès non autorisé
      </h1>

      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
        Votre rôle ({libelleRole(role)}) ne permet pas d'ouvrir cette section. L'API applique le même
        contrôle : une requête directe renverrait aussi un refus.
      </p>

      <Link to={accueilPourRole(role)} className="btn btn--primary inline-flex">
        Revenir à mon espace
      </Link>
    </div>
  );
}
