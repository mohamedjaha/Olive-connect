import { z } from 'zod';

export const tourneeSchema = z
  .object({
    dateDebut: z.string().min(1, 'Date de début requise'),
    dateFin: z.string().min(1, 'Date de fin requise'),
    chefEquipeId: z.string().min(1, "Chef d'équipe requis"),
    vergerIds: z.array(z.string()).min(1, 'Au moins un verger requis'),
    ressourceIds: z.array(z.string()).min(1, 'Au moins une ressource requise'),
    pressoirId: z.string().min(1, 'Pressoir requis'),
  })
  .refine(
    (valeurs) => Date.parse(valeurs.dateFin) > Date.parse(valeurs.dateDebut),
    { message: 'La fin doit être postérieure au début', path: ['dateFin'] },
  );

export type TourneeForm = z.infer<typeof tourneeSchema>;
