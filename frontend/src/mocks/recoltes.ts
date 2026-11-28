import { http, HttpResponse } from 'msw';
import type { ApiError, PaginatedResponse, Recolte } from '@/types/recolte';
import type { Tournee } from '@/types/tournee';
import { peutDemandeRecolte } from '@/domain/statuts';
import { CLEFS, ecrire, lire, lirePagination, paginer } from './store';
import { RECOLTES, TOURNEES } from './fixtures';

/** DTO brut renvoyé par le backend (`DemandeRecolteResponse`). */
interface DemandeBrut {
  id: string;
  type: string;
  dateSouhaitee: string;
  dateCreation: string;
  statut: string;
  motif?: string | null;
  vergerId: string;
  agriculteurId: string;
}

/** Conversion du format backend vers le format frontend stocké. */
function brutToRecolte(brut: DemandeBrut): Recolte {
  return {
    id: brut.id,
    vergerId: brut.vergerId,
    agriculteurId: brut.agriculteurId,
    type: brut.type as Recolte['type'],
    dateSouhaitee: brut.dateSouhaitee,
    statut: brut.statut as Recolte['statut'],
    motif: brut.motif ?? undefined,
    dateCreation: brut.dateCreation,
    dateMaj: new Date().toISOString(),
  };
}

/** Conversion du format frontend vers le format backend pour la réponse. */
function recolteToBrut(r: Recolte): DemandeBrut {
  return {
    id: r.id,
    type: r.type,
    dateSouhaitee: r.dateSouhaitee,
    dateCreation: r.dateCreation,
    statut: r.statut,
    motif: r.motif ?? null,
    vergerId: r.vergerId,
    agriculteurId: r.agriculteurId,
  };
}

function erreur(status: number, message: string) {
  return HttpResponse.json<ApiError>(
    {
      timestamp: new Date().toISOString(),
      status,
      error: status === 404 ? 'Not Found' : 'Bad Request',
      message,
      path: '/api/demandes',
    },
    { status },
  );
}

/** Joint le statut de la tournée, nécessaire pour appliquer la règle « avant démarrage ». */
function enrichir(recolte: Recolte): Recolte {
  if (!recolte.tourneeId) return recolte;

  const tournee = lire<Tournee>(CLEFS.tournees, TOURNEES).find((t) => t.id === recolte.tourneeId);
  return { ...recolte, tourneeStatut: tournee?.statut };
}

export const recoltesHandlers = [
  http.get('/api/demandes', ({ request }) => {
    const url = new URL(request.url);
    const { page, taille } = lirePagination(request);
    const vergerId = url.searchParams.get('vergerId');
    const agriculteurId = url.searchParams.get('agriculteurId');
    const statut = url.searchParams.get('statut');
    const type = url.searchParams.get('type');

    let donnees = lire(CLEFS.recoltes, RECOLTES).map(brutToRecolte);
    if (vergerId) donnees = donnees.filter((r) => r.vergerId === vergerId);
    if (agriculteurId) donnees = donnees.filter((r) => r.agriculteurId === agriculteurId);
    if (statut) donnees = donnees.filter((r) => r.statut === statut);
    if (type) donnees = donnees.filter((r) => r.type === type);

    return HttpResponse.json<PaginatedResponse<Recolte>>(
      paginer(donnees.map(enrichir), page, taille),
    );
  }),

  http.get('/api/demandes/:id', ({ params }) => {
    const recolte = lire(CLEFS.recoltes, RECOLTES).find((r) => r.id === params.id);
    if (!recolte) return erreur(404, 'Récolte introuvable');
    return HttpResponse.json(recolteToBrut(enrichir(recolte)));
  }),

  http.post('/api/demandes', async ({ request }) => {
    const body = (await request.json()) as { vergerId: string; type: string; dateSouhaitee: string; motif?: string | null };
    const nouvelle: Recolte = {
      id: crypto.randomUUID(),
      vergerId: body.vergerId,
      agriculteurId: 'agr1',
      type: body.type as Recolte['type'],
      dateSouhaitee: body.dateSouhaitee,
      statut: 'EN_ATTENTE',
      motif: body.motif ?? undefined,
      dateCreation: new Date().toISOString(),
      dateMaj: new Date().toISOString(),
    };
    const toutes = lire(CLEFS.recoltes, RECOLTES);
    toutes.unshift(nouvelle);
    ecrire(CLEFS.recoltes, toutes);
    return HttpResponse.json(recolteToBrut(nouvelle), { status: 201 });
  }),

  http.put('/api/demandes/:id', async ({ params, request }) => {
    const body = (await request.json()) as { type?: string; dateSouhaitee?: string; motif?: string | null };
    const toutes = lire(CLEFS.recoltes, RECOLTES);
    const index = toutes.findIndex((r) => r.id === params.id);
    if (index === -1) return erreur(404, 'Récolte introuvable');

    const miseAJour = { ...toutes[index] };
    if (body.type !== undefined) miseAJour.type = body.type as Recolte['type'];
    if (body.dateSouhaitee !== undefined) miseAJour.dateSouhaitee = body.dateSouhaitee;
    if (body.motif !== undefined) miseAJour.motif = body.motif ?? undefined;
    miseAJour.dateMaj = new Date().toISOString();
    toutes[index] = miseAJour;
    ecrire(CLEFS.recoltes, toutes);
    return HttpResponse.json(recolteToBrut(miseAJour));
  }),

  http.delete('/api/demandes/:id', ({ params }) => {
    const toutes = lire(CLEFS.recoltes, RECOLTES);
    const index = toutes.findIndex((r) => r.id === params.id);
    if (index === -1) return erreur(404, 'Récolte introuvable');

    toutes.splice(index, 1);
    ecrire(CLEFS.recoltes, toutes);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/demandes/:id/annuler', async ({ params, request }) => {
    const body = (await request.json()) as { motif?: string };
    const toutes = lire(CLEFS.recoltes, RECOLTES);
    const index = toutes.findIndex((r) => r.id === params.id);
    if (index === -1) return erreur(404, 'Récolte introuvable');

    const recolte = enrichir(toutes[index]);
    if (!peutDemandeRecolte(recolte, 'ANNULER', { tourneeStatut: recolte.tourneeStatut })) {
      return erreur(400, "Impossible d'annuler une récolte déjà démarrée ou terminée");
    }

    toutes[index] = {
      ...toutes[index],
      statut: 'ANNULEE',
      dateMaj: new Date().toISOString(),
      motif: body.motif ?? toutes[index].motif,
    };
    ecrire(CLEFS.recoltes, toutes);
    return HttpResponse.json(recolteToBrut(toutes[index]));
  }),

  http.post('/api/demandes/:id/demarrer', ({ params }) => {
    const toutes = lire(CLEFS.recoltes, RECOLTES);
    const index = toutes.findIndex((r) => r.id === params.id);
    if (index === -1) return erreur(404, 'Récolte introuvable');

    if (!peutDemandeRecolte(toutes[index], 'DEMARRER')) {
      return erreur(400, 'Seules les récoltes planifiées peuvent être démarrées');
    }

    toutes[index] = {
      ...toutes[index],
      statut: 'EN_COURS',
      dateDebut: new Date().toISOString(),
      dateMaj: new Date().toISOString(),
    };
    ecrire(CLEFS.recoltes, toutes);
    return HttpResponse.json(recolteToBrut(toutes[index]));
  }),

  http.post('/api/demandes/:id/terminer', async ({ params, request }) => {
    const body = (await request.json()) as { quantiteReelle: number };
    const toutes = lire(CLEFS.recoltes, RECOLTES);
    const index = toutes.findIndex((r) => r.id === params.id);
    if (index === -1) return erreur(404, 'Récolte introuvable');

    if (!peutDemandeRecolte(toutes[index], 'TERMINER')) {
      return erreur(400, 'Seules les récoltes en cours peuvent être terminées');
    }

    toutes[index] = {
      ...toutes[index],
      statut: 'TERMINEE',
      quantiteReelle: body.quantiteReelle,
      dateFin: new Date().toISOString(),
      dateMaj: new Date().toISOString(),
    };
    ecrire(CLEFS.recoltes, toutes);
    return HttpResponse.json(recolteToBrut(toutes[index]));
  }),

  http.post('/api/demandes/planifier', async ({ request }) => {
    const body = (await request.json()) as { recolteIds: string[]; dateDebut: string; dateFin: string; chefEquipeId: string };
    const toutes = lire(CLEFS.recoltes, RECOLTES);
    const tourneeId = `t${Date.now()}`;
    const maintenant = new Date().toISOString();

    body.recolteIds.forEach((id) => {
      const index = toutes.findIndex((r) => r.id === id);
      if (index !== -1 && toutes[index].statut === 'EN_ATTENTE') {
        toutes[index] = {
          ...toutes[index],
          statut: 'PLANIFIEE',
          datePlanifiee: body.dateDebut.split('T')[0],
          tourneeId,
          dateMaj: maintenant,
        };
      }
    });

    ecrire(CLEFS.recoltes, toutes);
    return HttpResponse.json({ tourneeId });
  }),
];
