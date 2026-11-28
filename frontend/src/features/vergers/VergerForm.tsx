import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { vergerCreateSchema, vergerUpdateSchema, type VergerCreateForm, type VergerUpdateForm } from './schemas';
import { LIBELLE_TYPE_OLIVE, LIBELLE_MATURITE } from '@/domain/libelles';

interface VergerFormProps {
  defaultValues?: Partial<VergerCreateForm>;
  onSubmit: (data: VergerCreateForm | VergerUpdateForm) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'update';
}

const TYPE_OLIVE_OPTIONS = Object.entries(LIBELLE_TYPE_OLIVE).map(([value, label]) => ({ value, label }));
const MATURITE_OPTIONS = Object.entries(LIBELLE_MATURITE).map(([value, label]) => ({ value, label }));

export function VergerForm({ defaultValues, onSubmit, isLoading, mode }: VergerFormProps) {
  const schema = mode === 'create' ? vergerCreateSchema : vergerUpdateSchema;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VergerCreateForm | VergerUpdateForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom: '',
      superficie: undefined,
      typeOlive: 'CHETOUI',
      localisation: { latitude: 34.7406, longitude: 10.7603 },
      maturite: 'VERTE',
      ...defaultValues,
    },
  });

  const lat = watch('localisation.latitude');
  const lng = watch('localisation.longitude');

  const handleLatChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) setValue('localisation.latitude', num, { shouldValidate: true });
  };
  const handleLngChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) setValue('localisation.longitude', num, { shouldValidate: true });
  };

  return (
    <Card variant="sheet">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Nouveau verger' : 'Modifier le verger'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <CardContent className="space-y-5 p-6">
          <Input
            label="Nom du verger *"
            placeholder="Ex: Verger Nord"
            error={errors.nom?.message}
            {...register('nom')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.1"
              min="0.1"
              max="1000"
              label="Superficie (ha) *"
              placeholder="12.5"
              error={errors.superficie?.message}
              {...register('superficie', { valueAsNumber: true })}
            />
            <Select
              label="Variété d'olive *"
              options={TYPE_OLIVE_OPTIONS}
              error={errors.typeOlive?.message}
              {...register('typeOlive')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.000001"
              min="-90"
              max="90"
              label="Latitude *"
              placeholder="34.740600"
              error={errors.localisation?.latitude?.message}
              value={lat?.toString() ?? ''}
              onChange={(e) => handleLatChange(e.target.value)}
            />
            <Input
              type="number"
              step="0.000001"
              min="-180"
              max="180"
              label="Longitude *"
              placeholder="10.760300"
              error={errors.localisation?.longitude?.message}
              value={lng?.toString() ?? ''}
              onChange={(e) => handleLngChange(e.target.value)}
            />
          </div>

          <Select
            label="Maturité"
            options={MATURITE_OPTIONS}
            placeholder="Sélectionner"
            error={errors.maturite?.message}
            {...register('maturite')}
          />

          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            * Champs obligatoires. La géolocalisation automatique sera proposée sur mobile.
          </p>
        </CardContent>

        <CardFooter className="justify-end entry-foot" style={{ borderColor: 'var(--color-rule)' }}>
          <Button type="button" variant="ghost" onClick={() => window.history.back()}>
            Annuler
          </Button>
          <Button type="submit" loading={isLoading}>
            {mode === 'create' ? 'Créer' : 'Enregistrer'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
