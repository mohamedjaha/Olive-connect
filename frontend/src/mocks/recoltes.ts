import { http, HttpResponse } from 'msw';
import type {
  ApiError,
  PaginatedResponse,
  Recolte,
  RecolteCreate,
  RecoltePlanification,
  RecolteUpdate,
} from '@/types/recolte';
import type { Tournee } from '@/types/tournee';
import { peutDemandeRecolte } from '@/domain/statuts';
import { CLEFS, ecrire, lire, lirePagination, paginer } from './store';
import { RECOLTES, TOURNEES } from './fixtures';

function erreur(status: number, message: string) {
  return HttpResponse.json<ApiError>(
    {
      timestamp: new Date().toISOString(),
      status,
      error: status === 404 ? 'Not Found' : 'Bad Request',
      message,
      path: '/api/recoltes',
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
  http.get('/api/recoltes', ({ request }) => {
    const url = new URL(request.url);
    const { page, taille } = lirePagination(request);
    const vergerId = url.searchParams.get('vergerId');
    const agriculteurId = url.searchParams.get('agriculteurId');
    const statut = url.searchParams.get('statut');
    const type = url.searchParams.get('type');

    let donnees = lire(CLEFS.recoltes, RECOLTES);
    if (vergerId) donnees = donnees.filter((r) => r.vergerId === vergerId);
    if (agriculteurId) donnees = donnees.filter((r) => r.agriculteurId === agriculteurId);
    if (statut) donnees = donnees.filter((r) => r.statut === statut);
    if (type) donnees = donnees.filter((r) => r.type === type);

    return HttpResponse.json<PaginatedResponse<Recolte>>(
      paginer(donnees.map(enrichir), page, taille),
    );
  }),

  http.get('/api/recoltes/:id', ({ params }) => {
    const recolte = lire(CLEFS.recoltes, RECOLTES).find((r) => r.id === params.id);
    if (!recolte) return erreur(404, 'Récolte introuvable');
    return HttpResponse.json(enrichir(recolte));
  }),

  http.post('/api/recoltes', async ({ request }) => {
    const body = (await request.json()) as RecolteCreate;
    const nouvelle: Recolte = {
      ...body,
      id: crypto.randomUUID(),
      agriculteurId: 'agr1',
      statut: 'EN_ATTENTE',
      dateCreation: new Date().toISOString(),
      dateMaj: new Date().toISOString(),
    };
    const toutes = lire(CLEFS.recoltes, RECOLTES);
    toutes.unshift(nouvelle);
    ecrire(CLEFS.recoltes, toutes);
    return HttpResponse.json(nouvelle, { status: 201 });
  }),

  http.put('/api/recoltes/:id', async ({ params, request }) => {
    const body = (await request.json()) as RecolteUpdate;
    const toutes = lire(CLEFS.recoltes, RECOLTES);
    const index = toutes.findIndex((r) => r.id === params.id);
    if (index === -1) return erreur(404, 'Récolte introuvable');

    toutes[index] = { ...toutes[index], ...body, dateMaj: new Date().toISOString() };
    ecrire(CLEFS.recoltes, toutes);
    return HttpResponse.json(toutes[index]);
  }),

  http.delete('/api/recoltes/:id', ({ params }) => {
    const toutes = lire(CLEFS.recoltes, RECOLTES);
    const index = toutes.findIndex((r) => r.id === params.id);
    if (index === -1) return erreur(404, 'Récolte introuvable');

    toutes.splice(index, 1);
    ecrire(CLEFS.recoltes, toutes);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/recoltes/:id/annuler', async ({ params, request }) => {
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
    return HttpResponse.json(toutes[index]);
  }),

  http.post('/api/recoltes/:id/demarrer', ({ params }) => {
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
    return HttpResponse.json(toutes[index]);
  }),

  http.post('/api/recoltes/:id/terminer', async ({ params, request }) => {
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
    return HttpResponse.json(toutes[index]);
  }),

  http.post('/api/recoltes/planifier', async ({ request }) => {
    const body = (await request.json()) as RecoltePlanification;
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
