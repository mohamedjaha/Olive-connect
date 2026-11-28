import { z } from 'zod';

const TYPE_RECOLTE_VALUES = ['PLANIFIEE', 'URGENTE'] as const;

export const demandeRecolteSchema = z.object({
  vergerId: z.string().min(1, 'Vergers obligatoire'),
  type: z.enum(TYPE_RECOLTE_VALUES),
  dateSouhaitee: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (YYYY-MM-DD)'),
  motif: z.string().max(500).optional(),
  quantitePrevue: z.number().positive().optional(),
});

export const demandeRecolteUpdateSchema = demandeRecolteSchema.partial();

export type DemandeRecolteForm = z.infer<typeof demandeRecolteSchema>;
export type DemandeRecolteUpdateForm = z.infer<typeof demandeRecolteUpdateSchema>;
