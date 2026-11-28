import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Badge,
  VARIANTE_CATEGORIE_ALERTE,
  VARIANTE_STATUT_ALERTE,
} from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAlertes, useCreateAlerte, useTraiterAlerte } from '@/features/alertes/hooks';
import { AlerteForm } from '@/features/alertes/AlerteForm';
import { useNomsVergers } from '@/features/vergers/hooks';
import { useListeFiltrable } from '@/features/listes/useListeFiltrable';
import { actionsAlerte } from '@/domain/statuts';
import { LIBELLE_CATEGORIE_ALERTE, LIBELLE_STATUT_ALERTE } from '@/domain/libelles';
import type { Alerte, AlerteCreate } from '@/types/alerte';

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'NOUVELLE', label: 'Nouvelle' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'TRAITEE', label: 'Traitée' },
];

const CATEGORIE_OPTIONS = [
  { value: '', label: 'Toutes les catégories' },
  { value: 'MATURITE', label: 'Maturité' },
  { value: 'PROBLEME', label: 'Problème' },
];

export function AlertesListPage() {
  const navigate = useNavigate();
  const liste = useListeFiltrable({ statut: '', categorie: '', vergerId: '' });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [traiterAlerteId, setTraiterAlerteId] = useState<string | null>(null);
  const [traiterAlerteCommentaire, setTraiterAlerteCommentaire] = useState('');

  const { vergers, parId } = useNomsVergers();

  const { data } = useAlertes({
    page: liste.page,
    size: liste.taille,
    ...liste.filtres,
  });

  const createAlerteMutation = useCreateAlerte();
  const traiterAlerteMutation = useTraiterAlerte();

  const alertes = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const alerteSelectionnee = alertes.find((a) => a.id === traiterAlerteId);

  const handleCreate = async (data: AlerteCreate) => {
    await createAlerteMutation.mutateAsync(data);
    setCreateModalOpen(false);
  };

  const handleMettreEnCours = async (alerteId: string) => {
    await traiterAlerteMutation.mutateAsync({
      id: alerteId,
      data: { statut: 'EN_COURS', commentaire: 'Prise en charge' },
    });
  };

  const handleTraiter = async (alerteId: string) => {
    if (traiterAlerteCommentaire.trim()) {
      await traiterAlerteMutation.mutateAsync({
        id: alerteId,
        data: { statut: 'TRAITEE', commentaire: traiterAlerteCommentaire },
      });
      setTraiterAlerteId(null);
      setTraiterAlerteCommentaire('');
    }
  };

  const fermerModal = () => {
    setTraiterAlerteId(null);
    setTraiterAlerteCommentaire('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vergers')}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Vergers
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des alertes</h1>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} disabled={createAlerteMutation.isPending} className="flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-4 h-4" aria-hidden="true" /> Signaler une alerte
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <CardTitle className="flex items-center gap-2">
            <span>Alertes terrain</span>
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
              options={CATEGORIE_OPTIONS}
              value={liste.filtres.categorie}
              onChange={(e) => liste.definirFiltre('categorie', e.target.value)}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {alertes.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--color-muted)' }}>
              Aucune alerte trouvée.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-rule)' }}>
              {alertes.map((alerte) => (
                <AlerteRow
                  key={alerte.id}
                  alerte={alerte}
                  nomVerger={parId(alerte.vergerId)}
                  onPrendreEnCharge={(id) => {
                    setTraiterAlerteId(id);
                    void handleMettreEnCours(id);
                  }}
                  onOuvrirTraitement={setTraiterAlerteId}
                  traiterAlerteId={traiterAlerteId}
                  traiterLoading={traiterAlerteMutation.isPending}
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
        title="Nouvelle alerte terrain"
        size="lg"
      >
        <AlerteForm onSubmit={handleCreate} isLoading={createAlerteMutation.isPending} />
      </Modal>

      {traiterAlerteId && alerteSelectionnee && (
        <Modal isOpen onClose={fermerModal} title="Traiter l'alerte" size="md">
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
              <Button variant="ghost" onClick={fermerModal}>
                Annuler
              </Button>
              {actionsAlerte(alerteSelectionnee).includes('PRENDRE_EN_CHARGE') && (
                <Button
                  variant="secondary"
                  onClick={() => handleMettreEnCours(traiterAlerteId)}
                  loading={traiterAlerteMutation.isPending}
                >
                  Mettre en cours
                </Button>
              )}
              {actionsAlerte(alerteSelectionnee).includes('TRAITER') && (
                <Button
                  onClick={() => handleTraiter(traiterAlerteId)}
                  loading={traiterAlerteMutation.isPending}
                  disabled={!traiterAlerteCommentaire.trim()}
                >
                  Marquer traitée
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

interface AlerteRowProps {
  alerte: Alerte;
  nomVerger: string;
  onPrendreEnCharge: (id: string) => void;
  onOuvrirTraitement: (id: string) => void;
  traiterAlerteId: string | null;
  traiterLoading: boolean;
}

function AlerteRow({
  alerte,
  nomVerger,
  onPrendreEnCharge,
  onOuvrirTraitement,
  traiterAlerteId,
  traiterLoading,
}: AlerteRowProps) {
  const actions = actionsAlerte(alerte);
  const isSelected = traiterAlerteId === alerte.id;
  const categorieVariant = VARIANTE_CATEGORIE_ALERTE[alerte.categorie];

  return (
    <div
      className={`p-4 hover:bg-[var(--color-paper-3)] transition-colors ${
        alerte.statut === 'NOUVELLE' ? 'bg-[var(--color-error-soft)]' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              categorieVariant === 'error'
                ? 'bg-[var(--color-error-soft)]'
                : 'bg-[var(--color-accent-soft)]'
            }`}
          >
            <MapPin
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
                {nomVerger}
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
                <MapPin className="w-3 h-3 inline mr-1" />{' '}
                {alerte.localisation
                  ? `${alerte.localisation.latitude.toFixed(4)}, ${alerte.localisation.longitude.toFixed(4)}`
                  : 'Non géolocalisée'}
              </span>
              <span>Créée : {new Date(alerte.dateCreation).toLocaleString('fr-FR')}</span>
              {alerte.dateTraitement && (
                <span>Traitée : {new Date(alerte.dateTraitement).toLocaleString('fr-FR')}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions.includes('PRENDRE_EN_CHARGE') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPrendreEnCharge(alerte.id)}
              loading={traiterLoading && isSelected}
            >
              Prendre en charge
            </Button>
          )}
          {actions.includes('TRAITER') && (
            <Button variant="outline" size="sm" onClick={() => onOuvrirTraitement(alerte.id)}>
              {alerte.statut === 'NOUVELLE' ? 'Traiter' : 'Marquer traitée'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
