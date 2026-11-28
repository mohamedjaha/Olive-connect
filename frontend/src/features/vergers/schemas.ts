import { z } from 'zod';

export const coordonneesSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Latitude invalide'),
  longitude: z.number().min(-180).max(180, 'Longitude invalide'),
});

const TYPE_OLIVE_VALUES = { CHETOUI: 'CHETOUI', CHEMLELI: 'CHEMLELI', PANCHU: 'PANCHU', ARBEQUINE: 'ARBEQUINE', AUTRE: 'AUTRE' } as const;
const MATURITE_VALUES = { VERTE: 'VERTE', MI_MATURE: 'MI_MATURE', MATURE: 'MATURE', SURMATURE: 'SURMATURE' } as const;

export const vergerCreateSchema = z.object({
  nom: z.string().min(2, 'Nom trop court').max(100),
  superficie: z.number().positive('Superficie doit être positive').max(1000),
  typeOlive: z.enum(TYPE_OLIVE_VALUES),
  localisation: coordonneesSchema,
  maturite: z.enum(MATURITE_VALUES).optional(),
});

export const vergerUpdateSchema = vergerCreateSchema.partial();

export type VergerCreateForm = z.infer<typeof vergerCreateSchema>;
export type VergerUpdateForm = z.infer<typeof vergerUpdateSchema>;
