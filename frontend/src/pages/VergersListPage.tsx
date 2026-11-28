import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VergerList } from '@/features/vergers/VergerList';
import { VergerForm } from '@/features/vergers/VergerForm';
import { Modal } from '@/components/ui/Modal';
import { useCreateVerger, useUpdateVerger, useDeleteVerger } from '@/features/vergers/hooks';
import { Button } from '@/components/ui/Button';
import type { Verger } from '@/types/verger';
import { AlertTriangle } from 'lucide-react';

export function VergersListPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedVerger, setSelectedVerger] = useState<Verger | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Verger | null>(null);

  const createMutation = useCreateVerger();
  const updateMutation = useUpdateVerger();
  const deleteMutation = useDeleteVerger();

  const handleCreate = () => {
    setEditMode(false);
    setSelectedVerger(null);
    setModalOpen(true);
  };

  const handleEdit = (v: Verger) => {
    setEditMode(true);
    setSelectedVerger(v);
    setModalOpen(true);
  };

  const handleDelete = (v: Verger) => setDeleteConfirm(v);

  const handleView = (v: Verger) => {
    navigate(`/vergers/${v.id}`);
  };

  const onSubmit = async (data: any) => {
    if (editMode && selectedVerger) {
      await updateMutation.mutateAsync({ id: selectedVerger.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setModalOpen(false);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-display)' }}>
          Gestion des vergers
        </h1>
      </div>

      <VergerList onCreate={handleCreate} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} />

      {/* Modal Création/Édition */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedVerger(null); }}
        title={editMode ? 'Modifier le verger' : 'Nouveau verger'}
        size="lg"
      >
        <VergerForm
          defaultValues={selectedVerger ?? undefined}
          onSubmit={onSubmit}
          isLoading={isLoading}
          mode={editMode ? 'update' : 'create'}
        />
      </Modal>

      {/* Modal Confirmation Suppression */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
        description={`Supprimer le verger « ${deleteConfirm?.nom} » ? Cette action est irréversible.`}
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmDelete} loading={deleteMutation.isPending}>
            Supprimer
          </Button>
        </div>
      </Modal>

      {createMutation.isError && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg entry" style={{ background: 'var(--color-error)', color: 'white' }}>
          <AlertTriangle className="w-5 h-5" />
          <span>{createMutation.error?.message}</span>
        </div>
      )}
      {updateMutation.isError && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg entry" style={{ background: 'var(--color-error)', color: 'white' }}>
          <AlertTriangle className="w-5 h-5" />
          <span>{updateMutation.error?.message}</span>
        </div>
      )}
      {deleteMutation.isError && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg entry" style={{ background: 'var(--color-error)', color: 'white' }}>
          <AlertTriangle className="w-5 h-5" />
          <span>{deleteMutation.error?.message}</span>
        </div>
      )}
    </div>
  );
}