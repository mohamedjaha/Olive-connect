import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LIBELLE_TYPE_RESSOURCE } from '@/domain/libelles';
import { maintenantLocal } from '@/lib/dates';
import {
  useChefsEquipe,
  usePressoirs,
  useRessourcesDisponibles,
  useVergersDisponibles,
} from './hooks';
import { tourneeSchema, type TourneeForm as Valeurs } from './schemas';
import type { TourneeCreate } from '@/types/tournee';

interface Props {
  onSubmit: (data: TourneeCreate) => Promise<void>;
  isLoading: boolean;
}

export function TourneeForm({ onSubmit, isLoading }: Props) {
  const form = useForm<Valeurs>({
    resolver: zodResolver(tourneeSchema),
    defaultValues: {
      dateDebut: maintenantLocal(),
      dateFin: maintenantLocal(),
      chefEquipeId: '',
      vergerIds: [],
      ressourceIds: [],
      pressoirId: '',
    },
  });

  const dateDebut = form.watch('dateDebut');
  const dateFin = form.watch('dateFin');
  const creneauPret = Boolean(dateDebut && dateFin && Date.parse(dateFin) > Date.parse(dateDebut));

  const { data: chefs = [] } = useChefsEquipe();
  const { data: pressoirs = [] } = usePressoirs();

  const { data: vergersData } = useVergersDisponibles(
    creneauPret ? dateDebut : '',
    creneauPret ? dateFin : '',
  );
  const { data: ressourcesData } = useRessourcesDisponibles(
    creneauPret ? dateDebut : '',
    creneauPret ? dateFin : '',
  );

  const vergers = vergersData ?? [];
  const ressources = ressourcesData ?? [];

  // Une ressource devenue indisponible après un changement de créneau sort de la sélection.
  useEffect(() => {
    if (!vergersData) return;
    const disponibles = new Set(vergersData.map((v) => v.id));
    const selection = form.getValues('vergerIds');
    const filtree = selection.filter((id) => disponibles.has(id));
    if (filtree.length !== selection.length) {
      form.setValue('vergerIds', filtree, { shouldValidate: true });
    }
  }, [vergersData, form]);

  useEffect(() => {
    if (!ressourcesData) return;
    const disponibles = new Set(ressourcesData.map((r) => r.id));
    const selection = form.getValues('ressourceIds');
    const filtree = selection.filter((id) => disponibles.has(id));
    if (filtree.length !== selection.length) {
      form.setValue('ressourceIds', filtree, { shouldValidate: true });
    }
  }, [ressourcesData, form]);

  const soumettre = (valeurs: Valeurs) =>
    onSubmit({
      ...valeurs,
      dateDebut: new Date(valeurs.dateDebut).toISOString(),
      dateFin: new Date(valeurs.dateFin).toISOString(),
    });

  return (
    <form onSubmit={form.handleSubmit(soumettre)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="datetime-local"
          label="Date de début *"
          error={form.formState.errors.dateDebut?.message}
          {...form.register('dateDebut')}
        />
        <Input
          type="datetime-local"
          label="Date de fin *"
          error={form.formState.errors.dateFin?.message}
          {...form.register('dateFin')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Chef d'équipe *"
          options={chefs.map((c) => ({ value: c.id, label: c.nom }))}
          placeholder="Sélectionner"
          error={form.formState.errors.chefEquipeId?.message}
          {...form.register('chefEquipeId')}
        />
        <Select
          label="Pressoir *"
          options={pressoirs.map((p) => ({
            value: p.id,
            label: `${p.nom} (${p.capaciteDisponible} kg/jour)`,
          }))}
          placeholder="Sélectionner"
          error={form.formState.errors.pressoirId?.message}
          {...form.register('pressoirId')}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
          Vergers concernés *
        </label>
        {!creneauPret ? (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Renseignez un créneau valide pour voir les vergers disponibles.
          </p>
        ) : vergers.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Aucun verger libre sur ce créneau.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {vergers.map((v) => (
              <label
                key={v.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--color-rule)',
                  background: 'var(--color-paper-2)',
                }}
              >
                <input
                  type="checkbox"
                  {...form.register('vergerIds')}
                  value={v.id}
                  className="w-4 h-4 rounded focus:ring-2"
                  style={{
                    color: 'var(--color-accent)',
                    borderColor: 'var(--color-muted)',
                  }}
                />
                <span className="text-sm" style={{ color: 'var(--color-ink)' }}>{v.nom}</span>
              </label>
            ))}
          </div>
        )}
        {form.formState.errors.vergerIds && (
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>{form.formState.errors.vergerIds.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
          Ressources à affecter *
        </label>
        {!creneauPret ? (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Renseignez un créneau valide pour voir les ressources disponibles.
          </p>
        ) : ressources.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Aucune ressource libre sur ce créneau.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ressources.map((r) => (
              <label
                key={r.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--color-rule)',
                  background: 'var(--color-paper-2)',
                }}
              >
                <input
                  type="checkbox"
                  {...form.register('ressourceIds')}
                  value={r.id}
                  className="w-4 h-4 rounded focus:ring-2"
                  style={{
                    color: 'var(--color-accent)',
                    borderColor: 'var(--color-muted)',
                  }}
                />
                <span className="text-sm" style={{ color: 'var(--color-ink)' }}>
                  {LIBELLE_TYPE_RESSOURCE[r.type]} - {r.nom}
                </span>
              </label>
            ))}
          </div>
        )}
        {form.formState.errors.ressourceIds && (
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>{form.formState.errors.ressourceIds.message}</p>
        )}
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Seules les ressources libres sur ce créneau sont proposées. L’API revérifie à la création.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-rule)' }}>
        <Button type="button" variant="ghost" onClick={() => form.reset()}>
          Annuler
        </Button>
        <Button type="submit" loading={isLoading}>
          Créer la tournée
        </Button>
      </div>
    </form>
  );
}
