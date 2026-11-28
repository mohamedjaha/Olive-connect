import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Leaf,
  Scale,
  Calendar,
  Clock,
  AlertTriangle,
  Truck,
  ChevronLeft,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Badge,
  VARIANTE_CATEGORIE_ALERTE,
  VARIANTE_MATURITE,
  VARIANTE_STATUT_ALERTE,
  VARIANTE_STATUT_RECOLTE,
  VARIANTE_STATUT_VERGER,
} from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useVerger, useUpdateVerger, useDeleteVerger } from '@/features/vergers/hooks';
import type { Verger } from '@/types/verger';
import {
  useRecoltes,
  useCreateRecolte,
  useAnnulerRecolte,
  useDemarrerRecolte,
  useTerminerRecolte,
} from '@/features/recoltes/hooks';
import { useAlertes, useCreateAlerte, useTraiterAlerte } from '@/features/alertes/hooks';
import { DemandeRecolteForm } from '@/features/recoltes/DemandeRecolteForm';
import { AlerteForm } from '@/features/alertes/AlerteForm';
import { vergerUpdateSchema, type VergerUpdateForm } from '@/features/vergers/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { actionsAlerte, actionsDemandeRecolte } from '@/domain/statuts';
import {
  LIBELLE_CATEGORIE_ALERTE,
  LIBELLE_MATURITE,
  LIBELLE_STATUT_ALERTE,
  LIBELLE_STATUT_RECOLTE,
  LIBELLE_STATUT_VERGER,
  LIBELLE_TYPE_OLIVE,
  LIBELLE_TYPE_RECOLTE,
} from '@/domain/libelles';
import type { Recolte, RecolteCreate } from '@/types/recolte';
import type { Alerte, AlerteCreate } from '@/types/alerte';

const TYPE_OLIVE_OPTIONS = Object.entries(LIBELLE_TYPE_OLIVE).map(([value, label]) => ({
  value,
  label,
}));

const MATURITE_OPTIONS = Object.entries(LIBELLE_MATURITE).map(([value, label]) => ({
  value,
  label,
}));

export function VergerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'detail' | 'recoltes' | 'alertes'>('detail');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [createRecolteOpen, setCreateRecolteOpen] = useState(false);
  const [createAlerteOpen, setCreateAlerteOpen] = useState(false);
  const [traiterAlerteId, setTraiterAlerteId] = useState<string | null>(null);
  const [traiterAlerteCommentaire, setTraiterAlerteCommentaire] = useState('');

  const { data: verger, isLoading, error } = useVerger(id!);
  const updateMutation = useUpdateVerger();
  const deleteMutation = useDeleteVerger();

  const { data: recoltesData, isLoading: recoltesLoading } = useRecoltes({ vergerId: id, size: 20 });
  const createRecolteMutation = useCreateRecolte();
  const annulerRecolteMutation = useAnnulerRecolte();
  const demarrerRecolteMutation = useDemarrerRecolte();
  const terminerRecolteMutation = useTerminerRecolte();

  const { data: alertesData, isLoading: alertesLoading } = useAlertes({ vergerId: id, size: 20 });
  const createAlerteMutation = useCreateAlerte();
  const traiterAlerteMutation = useTraiterAlerte();

  const recoltes = recoltesData?.content ?? [];
  const alertes = alertesData?.content ?? [];

  const form = useForm<VergerUpdateForm>({
    resolver: zodResolver(vergerUpdateSchema),
    defaultValues: verger
      ? {
          nom: verger.nom,
          superficie: verger.superficie,
          typeOlive: verger.typeOlive,
          localisation: verger.localisation,
          maturite: verger.maturite,
        }
      : undefined,
  });

  const handleEditSubmit = async (donnees: VergerUpdateForm) => {
    if (!verger) return;
    await updateMutation.mutateAsync({ id: verger.id, data: donnees });
    setEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (!verger) return;
    await deleteMutation.mutateAsync(verger.id);
    navigate('/vergers');
  };

  const handleCreateRecolte = async (donnees: RecolteCreate) => {
    await createRecolteMutation.mutateAsync({ ...donnees, vergerId: id! });
    setCreateRecolteOpen(false);
  };

  const handleCreateAlerte = async (donnees: AlerteCreate) => {
    await createAlerteMutation.mutateAsync({ ...donnees, vergerId: id! });
    setCreateAlerteOpen(false);
  };

  const handleAnnulerRecolte = async (recolteId: string) => {
    const motif = prompt("Motif de l'annulation (optionnel) :");
    if (motif !== null) {
      await annulerRecolteMutation.mutateAsync({ id: recolteId, motif: motif || undefined });
    }
  };

  const handleDemarrerRecolte = async (recolteId: string) => {
    if (confirm('Démarrer cette récolte ?')) {
      await demarrerRecolteMutation.mutateAsync(recolteId);
    }
  };

  const handleTerminerRecolte = async (recolteId: string) => {
    const quantite = prompt('Quantité réelle récoltée (kg) :');
    if (quantite !== null) {
      const q = parseFloat(quantite);
      if (!isNaN(q) && q >= 0) {
        await terminerRecolteMutation.mutateAsync({ id: recolteId, quantiteReelle: q });
      } else {
        alert('Quantité invalide');
      }
    }
  };

  const handleTraiterAlerte = async (alerteId: string) => {
    if (traiterAlerteCommentaire.trim()) {
      await traiterAlerteMutation.mutateAsync({
        id: alerteId,
        data: { statut: 'TRAITEE', commentaire: traiterAlerteCommentaire },
      });
      setTraiterAlerteId(null);
      setTraiterAlerteCommentaire('');
    }
  };

  const handleMettreEnCours = async (alerteId: string) => {
    await traiterAlerteMutation.mutateAsync({
      id: alerteId,
      data: { statut: 'EN_COURS', commentaire: 'Prise en charge' },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (error || !verger) {
    return (
      <div className="text-center py-12 text-red-600">
        Verger introuvable
        <Button variant="outline" className="mt-4" onClick={() => navigate('/vergers')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'detail' as const, label: 'Détails', icon: Leaf, count: null },
    {
      id: 'recoltes' as const,
      label: 'Récoltes',
      icon: Truck,
      count: recoltesData?.totalElements ?? 0,
    },
    {
      id: 'alertes' as const,
      label: 'Alertes',
      icon: AlertTriangle,
      count: alertesData?.totalElements ?? 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vergers')}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-display)' }}>
              {verger.nom}
              <Badge variant={VARIANTE_STATUT_VERGER[verger.statut]}>
                {LIBELLE_STATUT_VERGER[verger.statut]}
              </Badge>
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              ID : {verger.id.slice(0, 8)}…
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setEditModalOpen(true)}
            disabled={updateMutation.isPending}
          >
            <Edit className="w-4 h-4 mr-1" /> Modifier
          </Button>
          <Button
            variant="danger"
            onClick={() => setDeleteConfirm(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <InfoCard icon={Leaf} label="Variété" value={LIBELLE_TYPE_OLIVE[verger.typeOlive]} />
        <InfoCard icon={Scale} label="Superficie" value={`${verger.superficie} ha`} />
        <InfoCard
          icon={MapPin}
          label="Coordonnées"
          value={`${verger.localisation.latitude.toFixed(4)}, ${verger.localisation.longitude.toFixed(4)}`}
        />
        <InfoCard
          icon={Calendar}
          label="Maturité"
          value={
            <Badge variant={VARIANTE_MATURITE[verger.maturite]}>
              {LIBELLE_MATURITE[verger.maturite]}
            </Badge>
          }
        />
        {verger.rendementDisponible !== undefined && (
          <InfoCard
            icon={Leaf}
            label="Rendement disponible"
            value={`${verger.rendementDisponible} kg/ha`}
            className="text-[var(--color-green)]"
          />
        )}
        <InfoCard
          icon={Clock}
          label="Créé le"
          value={new Date(verger.dateCreation).toLocaleDateString('fr-FR')}
        />
      </div>

      <div className="border-b" style={{ borderColor: 'var(--color-rule)' }}>
        <nav className="flex gap-1" aria-label="Onglets verger">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                    : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-rule)]'
                }
              `}
            >
              <span className="flex items-center gap-1.5">
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full" style={{ background: 'var(--color-paper-3)', color: 'var(--color-muted)' }}>
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'detail' && (
        <VergerDetailContent
          verger={verger}
          onDeclarerRecolte={() => setCreateRecolteOpen(true)}
          onSignalerAlerte={() => setCreateAlerteOpen(true)}
        />
      )}
      {activeTab === 'recoltes' && (
        <RecoltesTab
          recoltes={recoltes}
          isLoading={recoltesLoading}
          onCreate={() => setCreateRecolteOpen(true)}
          onAnnuler={handleAnnulerRecolte}
          onDemarrer={handleDemarrerRecolte}
          onTerminer={handleTerminerRecolte}
          annulerLoading={annulerRecolteMutation.isPending}
          demarrerLoading={demarrerRecolteMutation.isPending}
          terminerLoading={terminerRecolteMutation.isPending}
        />
      )}
      {activeTab === 'alertes' && (
        <AlertesTab
          alertes={alertes}
          isLoading={alertesLoading}
          onCreate={() => setCreateAlerteOpen(true)}
          onMettreEnCours={handleMettreEnCours}
          setTraiterAlerteId={setTraiterAlerteId}
          traiterLoading={traiterAlerteMutation.isPending}
        />
      )}

      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          form.reset();
        }}
        title="Modifier le verger"
        size="lg"
      >
        <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
          <Input label="Nom" error={form.formState.errors.nom?.message} {...form.register('nom')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="1000"
              label="Superficie (ha)"
              error={form.formState.errors.superficie?.message}
              {...form.register('superficie', { valueAsNumber: true })}
            />
            <Select
              label="Variété"
              options={TYPE_OLIVE_OPTIONS}
              error={form.formState.errors.typeOlive?.message}
              {...form.register('typeOlive')}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              label="Latitude"
              error={form.formState.errors.localisation?.latitude?.message}
              value={form.watch('localisation.latitude')?.toString() ?? ''}
              onChange={(e) =>
                form.setValue('localisation.latitude', parseFloat(e.target.value) || undefined, {
                  shouldValidate: true,
                })
              }
            />
            <Input
              type="number"
              step="0.000001"
              min="-180"
              max="180"
              label="Longitude"
              error={form.formState.errors.localisation?.longitude?.message}
              value={form.watch('localisation.longitude')?.toString() ?? ''}
              onChange={(e) =>
                form.setValue('localisation.longitude', parseFloat(e.target.value) || undefined, {
                  shouldValidate: true,
                })
              }
            />
          </div>
          <Select
            label="Maturité"
            options={MATURITE_OPTIONS}
            placeholder="Sélectionner"
            {...form.register('maturite')}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditModalOpen(false);
                form.reset();
              }}
            >
              Annuler
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        title="Confirmer la suppression"
        description={`Supprimer le verger « ${verger.nom} » ? Cette action est irréversible.`}
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
            Supprimer
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={createRecolteOpen}
        onClose={() => setCreateRecolteOpen(false)}
        title="Nouvelle déclaration de récolte"
        size="lg"
      >
        <DemandeRecolteForm
          vergerId={verger.id}
          onSubmit={handleCreateRecolte}
          isLoading={createRecolteMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={createAlerteOpen}
        onClose={() => setCreateAlerteOpen(false)}
        title="Nouvelle alerte"
        size="lg"
      >
        <AlerteForm
          vergerId={verger.id}
          onSubmit={handleCreateAlerte}
          isLoading={createAlerteMutation.isPending}
        />
      </Modal>

      {traiterAlerteId && (
        <Modal
          isOpen
          onClose={() => {
            setTraiterAlerteId(null);
            setTraiterAlerteCommentaire('');
          }}
          title="Traiter l'alerte"
          size="md"
        >
          <div className="space-y-4">
            <textarea
              value={traiterAlerteCommentaire}
              onChange={(e) => setTraiterAlerteCommentaire(e.target.value)}
              placeholder="Commentaire sur le traitement..."
              className="w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 min-h-[100px] resize-y"
              style={{
                borderColor: 'var(--color-muted)',
                color: 'var(--color-ink)',
              }}
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setTraiterAlerteId(null);
                  setTraiterAlerteCommentaire('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={() => handleTraiterAlerte(traiterAlerteId)}
                loading={traiterAlerteMutation.isPending}
                disabled={!traiterAlerteCommentaire.trim()}
              >
                Marquer traitée
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  className = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <Card variant="sheet" padding="md">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-green-soft)', color: 'var(--color-green)' }}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</p>
          <p
            className={`text-base font-medium truncate ${className}`}
            style={{ color: 'var(--color-ink)' }}
          >
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function VergerDetailContent({
  verger,
  onDeclarerRecolte,
  onSignalerAlerte,
}: {
  verger: Verger;
  onDeclarerRecolte: () => void;
  onSignalerAlerte: () => void;
}): React.ReactElement {
  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Informations complètes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailRow label="Nom" value={verger.nom} />
          <DetailRow label="Variété d'olive" value={LIBELLE_TYPE_OLIVE[verger.typeOlive]} />
          <DetailRow label="Superficie" value={`${verger.superficie} hectares`} />
          <DetailRow
            label="Maturité"
            value={
              <Badge variant={VARIANTE_MATURITE[verger.maturite]}>
                {LIBELLE_MATURITE[verger.maturite]}
              </Badge>
            }
          />
          <DetailRow
            label="Statut"
            value={
              <Badge variant={VARIANTE_STATUT_VERGER[verger.statut]}>
                {LIBELLE_STATUT_VERGER[verger.statut]}
              </Badge>
            }
          />
          <DetailRow
            label="Localisation"
            value={`${verger.localisation.latitude.toFixed(6)}, ${verger.localisation.longitude.toFixed(6)}`}
          />
          {verger.rendementDisponible !== undefined && (
            <DetailRow
              label="Rendement disponible"
              value={`${verger.rendementDisponible} kg/ha`}
              className="text-[var(--color-green)]"
            />
          )}
          <DetailRow
            label="Date de création"
            value={new Date(verger.dateCreation).toLocaleString('fr-FR')}
          />
          <DetailRow
            label="Dernière mise à jour"
            value={new Date(verger.dateMaj).toLocaleString('fr-FR')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={onDeclarerRecolte} className="flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" aria-hidden="true" /> Déclarer une récolte
          </Button>
          <Button variant="outline" onClick={onSignalerAlerte} className="flex items-center gap-2 whitespace-nowrap">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Signaler une alerte
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  value,
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 py-2 border-b last:border-0" style={{ borderColor: 'var(--color-rule)' }}>
      <span className="text-sm font-medium w-full md:w-48" style={{ color: 'var(--color-muted)' }}>
        {label}
      </span>
      <span className={`text-sm ${className}`} style={{ color: 'var(--color-ink)' }}>{value}</span>
    </div>
  );
}

interface RecoltesTabProps {
  recoltes: Recolte[];
  isLoading: boolean;
  onCreate: () => void;
  onAnnuler: (id: string) => void;
  onDemarrer: (id: string) => void;
  onTerminer: (id: string) => void;
  annulerLoading: boolean;
  demarrerLoading: boolean;
  terminerLoading: boolean;
}

function RecoltesTab({
  recoltes,
  isLoading,
  onCreate,
  onAnnuler,
  onDemarrer,
  onTerminer,
  annulerLoading,
  demarrerLoading,
  terminerLoading,
}: RecoltesTabProps) {
  if (isLoading && recoltes.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--color-accent)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Récoltes déclarées</h2>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-1" /> Déclarer
        </Button>
      </div>

      {recoltes.length === 0 ? (
        <Card variant="sheet">
          <CardContent className="py-12 text-center" style={{ color: 'var(--color-muted)' }}>
            Aucune récolte déclarée pour ce verger.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recoltes.map((recolte) => (
            <RecolteRow
              key={recolte.id}
              recolte={recolte}
              onAnnuler={onAnnuler}
              onDemarrer={onDemarrer}
              onTerminer={onTerminer}
              annulerLoading={annulerLoading}
              demarrerLoading={demarrerLoading}
              terminerLoading={terminerLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecolteRow({
  recolte,
  onAnnuler,
  onDemarrer,
  onTerminer,
  annulerLoading,
  demarrerLoading,
  terminerLoading,
}: {
  recolte: Recolte;
  onAnnuler: (id: string) => void;
  onDemarrer: (id: string) => void;
  onTerminer: (id: string) => void;
  annulerLoading: boolean;
  demarrerLoading: boolean;
  terminerLoading: boolean;
}) {
  const actions = actionsDemandeRecolte(recolte, { tourneeStatut: recolte.tourneeStatut });

  return (
    <Card variant="entry" padding="none" className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
              <Truck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate" style={{ color: 'var(--color-ink)' }}>
                  Récolte {LIBELLE_TYPE_RECOLTE[recolte.type].toLowerCase()}
                </span>
                <Badge variant={VARIANTE_STATUT_RECOLTE[recolte.statut]}>
                  {LIBELLE_STATUT_RECOLTE[recolte.statut]}
                </Badge>
                <Badge variant="muted">{LIBELLE_TYPE_RECOLTE[recolte.type]}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm mt-1 flex-wrap" style={{ color: 'var(--color-muted)' }}>
                <span>
                  <Calendar className="w-4 h-4 inline mr-1" /> Souhaitée :{' '}
                  {new Date(recolte.dateSouhaitee).toLocaleDateString('fr-FR')}
                </span>
                {recolte.datePlanifiee && (
                  <span>
                    <Clock className="w-4 h-4 inline mr-1" /> Planifiée :{' '}
                    {new Date(recolte.datePlanifiee).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {recolte.quantitePrevue !== undefined && (
                  <span>
                    <Scale className="w-4 h-4 inline mr-1" /> Prévue : {recolte.quantitePrevue} kg
                  </span>
                )}
                {recolte.quantiteReelle !== undefined && (
                  <span>
                    <Scale className="w-4 h-4 inline mr-1" /> Réelle : {recolte.quantiteReelle} kg
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {actions.includes('ANNULER') && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onAnnuler(recolte.id)}
                loading={annulerLoading}
              >
                Annuler
              </Button>
            )}
            {actions.includes('DEMARRER') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onDemarrer(recolte.id)}
                loading={demarrerLoading}
              >
                Démarrer
              </Button>
            )}
            {actions.includes('TERMINER') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onTerminer(recolte.id)}
                loading={terminerLoading}
              >
                Terminer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AlertesTabProps {
  alertes: Alerte[];
  isLoading: boolean;
  onCreate: () => void;
  onMettreEnCours: (id: string) => void;
  setTraiterAlerteId: (id: string) => void;
  traiterLoading: boolean;
}

function AlertesTab({
  alertes,
  isLoading,
  onCreate,
  onMettreEnCours,
  setTraiterAlerteId,
  traiterLoading,
}: AlertesTabProps) {
  if (isLoading && alertes.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Alertes terrain</h2>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-1" /> Signaler
        </Button>
      </div>

      {alertes.length === 0 ? (
        <Card variant="sheet">
          <CardContent className="py-12 text-center" style={{ color: 'var(--color-muted)' }}>
            Aucune alerte pour ce verger.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alertes.map((alerte) => (
            <AlerteRow
              key={alerte.id}
              alerte={alerte}
              onMettreEnCours={onMettreEnCours}
              setTraiterAlerteId={setTraiterAlerteId}
              traiterLoading={traiterLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AlerteRow({
  alerte,
  onMettreEnCours,
  setTraiterAlerteId,
  traiterLoading,
}: {
  alerte: Alerte;
  onMettreEnCours: (id: string) => void;
  setTraiterAlerteId: (id: string) => void;
  traiterLoading: boolean;
}) {
  const actions = actionsAlerte(alerte);
  const categorieVariant = VARIANTE_CATEGORIE_ALERTE[alerte.categorie];

  return (
    <Card
      variant="entry"
      padding="none"
      className={`overflow-hidden ${alerte.statut === 'NOUVELLE' ? 'border-l-4' : ''}`}
      style={{
        borderLeftColor: alerte.statut === 'NOUVELLE' ? 'var(--color-error)' : 'transparent',
      }}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                categorieVariant === 'error'
                  ? 'bg-[var(--color-error-soft)]'
                  : 'bg-[var(--color-accent-soft)]'
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 ${
                  categorieVariant === 'error'
                    ? 'text-[var(--color-error)]'
                    : 'text-[var(--color-accent)]'
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate" style={{ color: 'var(--color-ink)' }}>
                  {LIBELLE_CATEGORIE_ALERTE[alerte.categorie]}
                </span>
                <Badge variant={VARIANTE_STATUT_ALERTE[alerte.statut]}>
                  {LIBELLE_STATUT_ALERTE[alerte.statut]}
                </Badge>
                <Badge variant={categorieVariant}>
                  {LIBELLE_CATEGORIE_ALERTE[alerte.categorie]}
                </Badge>
              </div>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>{alerte.description}</p>
              <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: 'var(--color-muted)' }}>
                <span>
                  <Calendar className="w-3 h-3 inline mr-1" />{' '}
                  {new Date(alerte.dateCreation).toLocaleString('fr-FR')}
                </span>
                {alerte.dateTraitement && (
                  <span>
                    <Clock className="w-3 h-3 inline mr-1" /> Traitée :{' '}
                    {new Date(alerte.dateTraitement).toLocaleString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions.includes('PRENDRE_EN_CHARGE') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTraiterAlerteId(alerte.id);
                  onMettreEnCours(alerte.id);
                }}
                loading={traiterLoading}
              >
                Prendre en charge
              </Button>
            )}
            {actions.includes('TRAITER') && (
              <Button variant="outline" size="sm" onClick={() => setTraiterAlerteId(alerte.id)}>
                {alerte.statut === 'NOUVELLE' ? 'Traiter' : 'Marquer traitée'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
