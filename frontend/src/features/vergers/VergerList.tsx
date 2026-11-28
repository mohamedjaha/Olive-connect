import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { VergerCard } from './VergerCard';
import { useVergers } from './hooks';
import { useListeFiltrable } from '@/features/listes/useListeFiltrable';
import type { Verger } from '@/types/verger';

// Filtres simplifiés : "Statut" et "Maturité" comme placeholder
const STATUT_FILTER_OPTIONS = [
  { value: '', label: 'Statut' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'PLANIFIE', label: 'Planifié' },
  { value: 'TERMINE', label: 'Terminé' },
  { value: 'ANNULE', label: 'Annulé' },
];

const MATURITE_FILTER_OPTIONS = [
  { value: '', label: 'Maturité' },
  { value: 'VERTE', label: 'Verte' },
  { value: 'MATURE', label: 'Mature' },
  { value: 'SURMATURE', label: 'Surmature' },
];

export function VergerList({
  onCreate,
  onEdit,
  onDelete,
  onView,
}: {
  onCreate: () => void;
  onEdit: (v: Verger) => void;
  onDelete: (v: Verger) => void;
  onView: (v: Verger) => void;
}) {
  const liste = useListeFiltrable({ statut: '', maturite: '' });

  const { data, isLoading, error, refetch } = useVergers({
    page: liste.page,
    size: liste.taille,
    ...liste.filtres,
  });

  const vergers = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  if (isLoading && vergers.length === 0) {
    return (
      <Card variant="sheet">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="entry" className="border-2" style={{ borderColor: 'var(--color-error)' }}>
        <CardContent className="p-6 text-center" style={{ color: 'var(--color-error)' }}>
          Erreur de chargement : {error.message}
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="sheet">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <CardTitle className="flex items-center gap-2">
            <span>Vergers</span>
            <span className="text-sm font-normal" style={{ color: 'var(--color-muted)' }}>
              ({totalElements})
            </span>
          </CardTitle>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Select
              options={STATUT_FILTER_OPTIONS}
              value={liste.filtres.statut}
              onChange={(e) => liste.definirFiltre('statut', e.target.value)}
              className="w-52 h-10"
              placeholder="Statut"
            />
            <Select
              options={MATURITE_FILTER_OPTIONS}
              value={liste.filtres.maturite}
              onChange={(e) => liste.definirFiltre('maturite', e.target.value)}
              className="w-52 h-10"
              placeholder=""
            />
            <Button onClick={onCreate} className="whitespace-nowrap flex-shrink-0 h-10 px-4 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" aria-hidden="true" /> Nouveau
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {vergers.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--color-muted)' }}>
              Aucun verger trouvé.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {vergers.map((v) => (
                <VergerCard key={v.id} verger={v} onEdit={onEdit} onDelete={onDelete} onView={onView} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-solid" style={{ borderColor: 'var(--color-rule)' }}>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Page {liste.page + 1} / {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={liste.page === 0}
                  onClick={() => liste.definirPage(liste.page - 1)}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={liste.page >= totalPages - 1}
                  onClick={() => liste.definirPage(liste.page + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}