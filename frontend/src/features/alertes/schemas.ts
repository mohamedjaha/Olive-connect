import { z } from 'zod';

export const alerteSchema = z.object({
  vergerId: z.string().min(1, 'Verger requis'),
  categorie: z.enum(['MATURITE', 'PROBLEME']),
  description: z.string().min(10, 'Description trop courte (min 10 caractères)'),
});

export type AlerteForm = z.infer<typeof alerteSchema>;
