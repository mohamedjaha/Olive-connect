import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, Calendar, Truck, User, Factory } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, VARIANTE_STATUT_TOURNEE } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  useTournees,
  useCreateTournee,
  useDemarrerTournee,
  useTerminerTournee,
  useAnnulerTournee,
  useChefsEquipe,
  usePressoirs,
} from '@/features/tournees/hooks';
import { TourneeForm } from '@/features/tournees/TourneeForm';
import { useListeFiltrable } from '@/features/listes/useListeFiltrable';
import { actionsTournee } from '@/domain/statuts';
import { LIBELLE_STATUT_TOURNEE } from '@/domain/libelles';
import type { Tournee, TourneeCreate } from '@/types/tournee';

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  ...Object.entries(LIBELLE_STATUT_TOURNEE).map(([value, label]) => ({ value, label })),
];

export function TourneesListPage() {
  const navigate = useNavigate();
  const liste = useListeFiltrable({ statut: '', chefEquipeId: '', pressoirId: '' });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data } = useTournees({
    page: liste.page,
    size: liste.taille,
    ...liste.filtres,
  });

  const createTourneeMutation = useCreateTournee();
  const demarrerTourneeMutation = useDemarrerTournee();
  const terminerTourneeMutation = useTerminerTournee();
  const annulerTourneeMutation = useAnnulerTournee();

  const { data: chefsData } = useChefsEquipe();
  const chefs = chefsData ?? [];

  const { data: pressoirsData } = usePressoirs();
  const pressoirs = pressoirsData ?? [];

  const tournees = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const handleCreate = async (donnees: TourneeCreate) => {
    await createTourneeMutation.mutateAsync(donnees);
    setCreateModalOpen(false);
  };

  const handleDemarrer = async (tourneeId: string) => {
    if (confirm('Démarrer cette tournée ?')) {
      setActionLoading(tourneeId);
      await demarrerTourneeMutation.mutateAsync(tourneeId);
      setActionLoading(null);
    }
  };

  const handleTerminer = async (tourneeId: string) => {
    const quantite = prompt('Quantité totale réelle récoltée (kg) - optionnel :');
    if (quantite !== null) {
      const q = quantite ? parseFloat(quantite) : undefined;
      if (quantite === '' || (q !== undefined && !isNaN(q) && q >= 0)) {
        setActionLoading(tourneeId);
        await terminerTourneeMutation.mutateAsync({ id: tourneeId, quantiteReelle: q });
        setActionLoading(null);
      } else {
        alert('Quantité invalide');
      }
    }
  };

  const handleAnnuler = async (tourneeId: string) => {
    const motif = prompt("Motif de l'annulation (optionnel) :");
    if (motif !== null) {
      setActionLoading(tourneeId);
      await annulerTourneeMutation.mutateAsync({ id: tourneeId, motif: motif || undefined });
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vergers')}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Vergers
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des tournées</h1>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} disabled={createTourneeMutation.isPending}>
          <Plus className="w-4 h-4 mr-1" /> Nouvelle tournée
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <CardTitle className="flex items-center gap-2">
            <span>Tournées</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({totalElements})
            </span>
          </CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              options={STATUT_OPTIONS}
              value={liste.filtres.statut}
              onChange={(e) => liste.definirFiltre('statut', e.target.value)}
              className="w-40"
            />
            <Select
              options={[
                { value: '', label: 'Tous les chefs' },
                ...chefs.map((c) => ({ value: c.id, label: c.nom })),
              ]}
              value={liste.filtres.chefEquipeId}
              onChange={(e) => liste.definirFiltre('chefEquipeId', e.target.value)}
              className="w-48"
            />
            <Select
              options={[
                { value: '', label: 'Tous les pressoirs' },
                ...pressoirs.map((p) => ({ value: p.id, label: p.nom })),
              ]}
              value={liste.filtres.pressoirId}
              onChange={(e) => liste.definirFiltre('pressoirId', e.target.value)}
              className="w-48"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {tournees.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--color-muted)' }}>
              Aucune tournée trouvée.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-rule)' }}>
              {tournees.map((tournee) => (
                <TourneeRow
                  key={tournee.id}
                  tournee={tournee}
                  onDemarrer={handleDemarrer}
                  onTerminer={handleTerminer}
                  onAnnuler={handleAnnuler}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--color-rule)' }}>
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

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Nouvelle tournée"
        size="xl"
      >
        <TourneeForm onSubmit={handleCreate} isLoading={createTourneeMutation.isPending} />
      </Modal>
    </div>
  );
}

interface TourneeRowProps {
  tournee: Tournee;
  onDemarrer: (id: string) => void;
  onTerminer: (id: string) => void;
  onAnnuler: (id: string) => void;
  actionLoading: string | null;
}

function TourneeRow({
  tournee,
  onDemarrer,
  onTerminer,
  onAnnuler,
  actionLoading,
}: TourneeRowProps) {
  const actions = actionsTournee(tournee);
  const isLoading = actionLoading === tournee.id;

  return (
    <div className="p-4 hover:bg-[var(--color-paper-3)] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
            <Truck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate" style={{ color: 'var(--color-ink)' }}>
                Tournée {tournee.id.slice(0, 8)}
              </span>
              <Badge variant={VARIANTE_STATUT_TOURNEE[tournee.statut]}>
                {LIBELLE_STATUT_TOURNEE[tournee.statut]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm mt-1 flex-wrap" style={{ color: 'var(--color-muted)' }}>
              <span>
                <Calendar className="w-4 h-4 inline mr-1" />{' '}
                {new Date(tournee.dateDebut).toLocaleDateString('fr-FR')}{' '}
                {new Date(tournee.dateDebut).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                →{' '}
                {new Date(tournee.dateFin).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>
                <User className="w-4 h-4 inline mr-1" /> {tournee.chefEquipeNom ?? 'Non renseigné'}
              </span>
              <span>
                <Factory className="w-4 h-4 inline mr-1" /> {tournee.pressoirNom ?? 'Non renseigné'}
              </span>
              {tournee.quantiteTotalePrevue !== undefined && (
                <span>Prévue : {tournee.quantiteTotalePrevue} kg</span>
              )}
              {tournee.quantiteTotaleReelle !== undefined && (
                <span>Réelle : {tournee.quantiteTotaleReelle} kg</span>
              )}
            </div>
            {tournee.vergers && tournee.vergers.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm flex-wrap" style={{ color: 'var(--color-muted)' }}>
                <span>Vergers :</span>
                {tournee.vergers.map((v, i) => (
                  <span
                    key={v.id}
                    className="px-2 py-0.5 rounded"
                    style={{ background: 'var(--color-paper-3)', color: 'var(--color-ink)' }}
                  >
                    {v.nom}
                    {i < tournee.vergers!.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {actions.includes('DEMARRER') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDemarrer(tournee.id)}
              loading={isLoading}
              disabled={isLoading}
            >
              Démarrer
            </Button>
          )}
          {actions.includes('TERMINER') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onTerminer(tournee.id)}
              loading={isLoading}
              disabled={isLoading}
            >
              Terminer
            </Button>
          )}
          {actions.includes('ANNULER') && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onAnnuler(tournee.id)}
              loading={isLoading}
              disabled={isLoading}
            >
              Annuler
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
