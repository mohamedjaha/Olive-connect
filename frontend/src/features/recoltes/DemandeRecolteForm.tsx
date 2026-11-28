import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useReferentielVergers } from '@/features/vergers/hooks';
import { LIBELLE_TYPE_RECOLTE } from '@/domain/libelles';
import { aujourdHui } from '@/lib/dates';
import { demandeRecolteSchema, type DemandeRecolteForm as Valeurs } from './schemas';
import type { RecolteCreate } from '@/types/recolte';

interface Props {
  /** Quand le verger est imposé par l'écran, la sélection disparaît. */
  vergerId?: string;
  onSubmit: (data: RecolteCreate) => Promise<void>;
  isLoading: boolean;
}

export function DemandeRecolteForm({ vergerId, onSubmit, isLoading }: Props) {
  const { data: vergers = [] } = useReferentielVergers();

  const form = useForm<Valeurs>({
    resolver: zodResolver(demandeRecolteSchema),
    defaultValues: {
      vergerId: vergerId ?? '',
      type: 'PLANIFIEE',
      dateSouhaitee: aujourdHui(),
      motif: '',
      quantitePrevue: undefined,
    },
  });

  const soumettre = (valeurs: Valeurs) =>
    onSubmit({
      vergerId: vergerId ?? valeurs.vergerId,
      type: valeurs.type,
      dateSouhaitee: valeurs.dateSouhaitee,
      motif: valeurs.motif?.trim() || undefined,
      quantitePrevue: valeurs.quantitePrevue,
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
        label="Type"
        options={[
          { value: 'PLANIFIEE', label: LIBELLE_TYPE_RECOLTE.PLANIFIEE },
          { value: 'URGENTE', label: LIBELLE_TYPE_RECOLTE.URGENTE },
        ]}
        error={form.formState.errors.type?.message}
        {...form.register('type')}
      />

      <Input
        type="date"
        label="Date souhaitée *"
        error={form.formState.errors.dateSouhaitee?.message}
        {...form.register('dateSouhaitee')}
      />

      <Input
        label="Motif (si urgente)"
        placeholder="Ex : risque météo, maturité avancée..."
        {...form.register('motif')}
      />

      <Input
        type="number"
        step="0.1"
        min="0"
        label="Quantité prévue (kg)"
        error={form.formState.errors.quantitePrevue?.message}
        {...form.register('quantitePrevue', {
          setValueAs: (valeur) => (valeur === '' ? undefined : Number(valeur)),
        })}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={() => form.reset()}>
          Annuler
        </Button>
        <Button type="submit" loading={isLoading}>
          Déclarer
        </Button>
      </div>
    </form>
  );
}
