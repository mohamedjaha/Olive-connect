import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useReferentielVergers } from '@/features/vergers/hooks';
import { LIBELLE_CATEGORIE_ALERTE } from '@/domain/libelles';
import { alerteSchema, type AlerteForm as Valeurs } from './schemas';
import type { AlerteCreate } from '@/types/alerte';

interface Props {
  /** Quand le verger est imposé par l'écran, la sélection disparaît. */
  vergerId?: string;
  onSubmit: (data: AlerteCreate) => Promise<void>;
  isLoading: boolean;
}

export function AlerteForm({ vergerId, onSubmit, isLoading }: Props) {
  const { data: vergers = [] } = useReferentielVergers();

  const form = useForm<Valeurs>({
    resolver: zodResolver(alerteSchema),
    defaultValues: {
      vergerId: vergerId ?? '',
      categorie: 'MATURITE',
      description: '',
    },
  });

  const soumettre = (valeurs: Valeurs) =>
    onSubmit({
      vergerId: vergerId ?? valeurs.vergerId,
      categorie: valeurs.categorie,
      description: valeurs.description.trim(),
    });

  return (
    <form onSubmit={form.handleSubmit(soumettre)} className="space-y-4">
      {!vergerId && (
        <Select
          label="Verger *"
          options={vergers.map((v) => ({ value: v.id, label: v.nom }))}
          placeholder="Sélectionner un verger"
          error={form.formState.errors.vergerId?.message}
          {...form.register('vergerId')}
        />
      )}

      <Select
        label="Catégorie"
        options={[
          { value: 'MATURITE', label: `${LIBELLE_CATEGORIE_ALERTE.MATURITE} optimale` },
          { value: 'PROBLEME', label: 'Problème (pluie, ravageurs, autre)' },
        ]}
        error={form.formState.errors.categorie?.message}
        {...form.register('categorie')}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
          Description *
        </label>
        <textarea
          {...form.register('description')}
          rows={4}
          className="w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2"
          style={{
            borderColor: 'var(--color-muted)',
            color: 'var(--color-ink)',
          }}
          placeholder="Décrivez l'alerte : maturité observée, problème rencontré, localisation précise si différente du verger..."
        />
        {form.formState.errors.description && (
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>{form.formState.errors.description.message}</p>
        )}
      </div>

      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        La géolocalisation du verger sera utilisée automatiquement.
      </p>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={() => form.reset()}>
          Annuler
        </Button>
        <Button type="submit" loading={isLoading}>
          Signaler
        </Button>
      </div>
    </form>
  );
}
