import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, VARIANTE_STATUT_RECOLTE } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  useRecoltes,
  useCreateRecolte,
  useAnnulerRecolte,
  useDemarrerRecolte,
  useTerminerRecolte,
} from '@/features/recoltes/hooks';
import { DemandeRecolteForm } from '@/features/recoltes/DemandeRecolteForm';
import { useNomsVergers } from '@/features/vergers/hooks';
import { useListeFiltrable } from '@/features/listes/useListeFiltrable';
import { actionsDemandeRecolte } from '@/domain/statuts';
import { LIBELLE_STATUT_RECOLTE, LIBELLE_TYPE_RECOLTE } from '@/domain/libelles';
import type { Recolte, RecolteCreate } from '@/types/recolte';

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'PLANIFIEE', label: 'Planifiée' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TERMINEE', label: 'Terminée' },
  { value: 'ANNULEE', label: 'Annulée' },
  { value: 'RECUE', label: 'Reçue' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'PLANIFIEE', label: 'Planifiée' },
  { value: 'URGENTE', label: 'Urgente' },
];

export function RecoltesListPage() {
  const navigate = useNavigate();
  const liste = useListeFiltrable({ statut: '', type: '', vergerId: '' });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { vergers, parId } = useNomsVergers();

  const { data } = useRecoltes({
    page: liste.page,
    size: liste.taille,
    ...liste.filtres,
  });

  const createRecolteMutation = useCreateRecolte();
  const annulerRecolteMutation = useAnnulerRecolte();
  const demarrerRecolteMutation = useDemarrerRecolte();
  const terminerRecolteMutation = useTerminerRecolte();

  const recoltes = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const handleCreate = async (data: RecolteCreate) => {
    await createRecolteMutation.mutateAsync(data);
    setCreateModalOpen(false);
  };

  const handleAnnuler = async (recolteId: string) => {
    const motif = prompt("Motif de l'annulation (optionnel) :");
    if (motif !== null) {
      setActionLoading(recolteId);
      await annulerRecolteMutation.mutateAsync({ id: recolteId, motif: motif || undefined });
      setActionLoading(null);
    }
  };

  const handleDemarrer = async (recolteId: string) => {
    if (confirm('Démarrer cette récolte ?')) {
      setActionLoading(recolteId);
      await demarrerRecolteMutation.mutateAsync(recolteId);
      setActionLoading(null);
    }
  };

  const handleTerminer = async (recolteId: string) => {
    const quantite = prompt('Quantité réelle récoltée (kg) :');
    if (quantite !== null) {
      const q = parseFloat(quantite);
      if (!isNaN(q) && q >= 0) {
        setActionLoading(recolteId);
        await terminerRecolteMutation.mutateAsync({ id: recolteId, quantiteReelle: q });
        setActionLoading(null);
      } else {
        alert('Quantité invalide');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vergers')}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Vergers
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des récoltes</h1>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} disabled={createRecolteMutation.isPending}>
          <Plus className="w-4 h-4 mr-1" /> Nouvelle déclaration
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <CardTitle className="flex items-center gap-2">
            <span>Récoltes</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({totalElements})
            </span>
          </CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              options={[
                { value: '', label: 'Tous les vergers' },
                ...vergers.map((v) => ({ value: v.id, label: v.nom })),
              ]}
              value={liste.filtres.vergerId}
              onChange={(e) => liste.definirFiltre('vergerId', e.target.value)}
              className="w-48"
            />
            <Select
              options={STATUT_OPTIONS}
              value={liste.filtres.statut}
              onChange={(e) => liste.definirFiltre('statut', e.target.value)}
              className="w-40"
            />
            <Select
              options={TYPE_OPTIONS}
              value={liste.filtres.type}
              onChange={(e) => liste.definirFiltre('type', e.target.value)}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recoltes.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--color-muted)' }}>
              Aucune récolte trouvée.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-rule)' }}>
              {recoltes.map((recolte) => (
                <RecolteRow
                  key={recolte.id}
                  recolte={recolte}
                  nomVerger={parId(recolte.vergerId)}
                  onAnnuler={handleAnnuler}
                  onDemarrer={handleDemarrer}
                  onTerminer={handleTerminer}
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
        title="Nouvelle déclaration de récolte"
        size="lg"
      >
        <DemandeRecolteForm
          onSubmit={handleCreate}
          isLoading={createRecolteMutation.isPending}
        />
      </Modal>
    </div>
  );
}

interface RecolteRowProps {
  recolte: Recolte;
  nomVerger: string;
  onAnnuler: (id: string) => void;
  onDemarrer: (id: string) => void;
  onTerminer: (id: string) => void;
  actionLoading: string | null;
}

function RecolteRow({
  recolte,
  nomVerger,
  onAnnuler,
  onDemarrer,
  onTerminer,
  actionLoading,
}: RecolteRowProps) {
  const actions = actionsDemandeRecolte(recolte, { tourneeStatut: recolte.tourneeStatut });
  const isLoading = actionLoading === recolte.id;

  return (
    <div className="p-4 hover:bg-[var(--color-paper-3)] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
            <Leaf className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate" style={{ color: 'var(--color-ink)' }}>
                {nomVerger}
              </span>
              <Badge variant={VARIANTE_STATUT_RECOLTE[recolte.statut]}>
                {LIBELLE_STATUT_RECOLTE[recolte.statut]}
              </Badge>
              <Badge variant="muted">{LIBELLE_TYPE_RECOLTE[recolte.type]}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              <span>
                Souhaitée : {new Date(recolte.dateSouhaitee).toLocaleDateString('fr-FR')}
              </span>
              {recolte.datePlanifiee && (
                <span>
                  Planifiée : {new Date(recolte.datePlanifiee).toLocaleDateString('fr-FR')}
                </span>
              )}
              {recolte.quantitePrevue && <span>Prévue : {recolte.quantitePrevue} kg</span>}
              {recolte.quantiteReelle && <span>Réelle : {recolte.quantiteReelle} kg</span>}
              {recolte.motif && <span className="italic">« {recolte.motif} »</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {actions.includes('ANNULER') && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onAnnuler(recolte.id)}
              loading={isLoading}
              disabled={isLoading}
            >
              Annuler
            </Button>
          )}
          {actions.includes('DEMARRER') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDemarrer(recolte.id)}
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
              onClick={() => onTerminer(recolte.id)}
              loading={isLoading}
              disabled={isLoading}
            >
              Terminer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
