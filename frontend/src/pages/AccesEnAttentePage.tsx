import { useNavigate } from 'react-router-dom';
import { Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/auth/SessionContext';
import { libelleRole } from '@/auth/roles';

/**
 * Écran d'attente pour un compte inscrit mais dont le rôle n'a pas encore été
 * attribué. Un `VISITEUR` n'a accès à aucune donnée privée : cette page évite
 * de le renvoyer vers une route protégée qu'il ne peut pas ouvrir.
 */
export function AccesEnAttentePage() {
  const { user, role, logout } = useSession();
  const navigate = useNavigate();

  const seDeconnecter = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-xl mx-auto py-12 text-center">
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
        style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
      >
        <Hourglass className="w-6 h-6" aria-hidden="true" />
      </div>

      <Badge variant="muted" className="mb-3">
        Rôle : {libelleRole(role)}
      </Badge>

      <h1
        className="text-2xl font-semibold mb-2"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-ink)',
          letterSpacing: 'var(--tracking-display)',
        }}
      >
        Compte en attente de validation
      </h1>

      <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
        Votre demande pour <strong style={{ color: 'var(--color-ink)' }}>{user?.email}</strong> est
        enregistrée. Un administrateur doit maintenant vous attribuer un rôle pour ouvrir les
        vergers, les tournées ou les pressoirs.
      </p>

      <div className="entry p-5 text-left space-y-2 mb-6">
        <p className="text-sm" style={{ color: 'var(--color-ink)' }}>
          En attendant, vous pouvez :
        </p>
        <ul className="text-sm list-disc pl-5 space-y-1" style={{ color: 'var(--color-muted)' }}>
          <li>consulter la carte publique, sans donnée privée ;</li>
          <li>prévenir votre responsable de collecte ;</li>
          <li>vous reconnecter plus tard avec le même compte Google.</li>
        </ul>
      </div>

      <Button variant="outline" onClick={seDeconnecter}>
        Se déconnecter
      </Button>
    </div>
  );
}
