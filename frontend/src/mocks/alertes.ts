import { http, HttpResponse } from 'msw';
import type {
  Alerte,
  AlerteCreate,
  AlerteTraitement,
  ApiError,
  PaginatedResponse,
} from '@/types/alerte';
import { peutAlerte } from '@/domain/statuts';
import { CLEFS, ecrire, lire, lirePagination, paginer } from './store';
import { ALERTES } from './fixtures';

function erreur(status: number, message: string) {
  return HttpResponse.json<ApiError>(
    {
      timestamp: new Date().toISOString(),
      status,
      error: status === 404 ? 'Not Found' : 'Bad Request',
      message,
      path: '/api/alertes',
    },
    { status },
  );
}

export const alertesHandlers = [
  http.get('/api/alertes', ({ request }) => {
    const url = new URL(request.url);
    const { page, taille } = lirePagination(request);
    const vergerId = url.searchParams.get('vergerId');
    const agriculteurId = url.searchParams.get('agriculteurId');
    const categorie = url.searchParams.get('categorie');
    const statut = url.searchParams.get('statut');

    let donnees = lire(CLEFS.alertes, ALERTES);
    if (vergerId) donnees = donnees.filter((a) => a.vergerId === vergerId);
    if (agriculteurId) donnees = donnees.filter((a) => a.agriculteurId === agriculteurId);
    if (categorie) donnees = donnees.filter((a) => a.categorie === categorie);
    if (statut) donnees = donnees.filter((a) => a.statut === statut);

    return HttpResponse.json<PaginatedResponse<Alerte>>(paginer(donnees, page, taille));
  }),

  http.get('/api/alertes/:id', ({ params }) => {
    const alerte = lire(CLEFS.alertes, ALERTES).find((a) => a.id === params.id);
    if (!alerte) return erreur(404, 'Alerte introuvable');
    return HttpResponse.json(alerte);
  }),

  http.post('/api/alertes', async ({ request }) => {
    const body = (await request.json()) as AlerteCreate;
    const nouvelle: Alerte = {
      ...body,
      id: crypto.randomUUID(),
      agriculteurId: 'agr1',
      statut: 'NOUVELLE',
      dateCreation: new Date().toISOString(),
      dateMaj: new Date().toISOString(),
    };
    const toutes = lire(CLEFS.alertes, ALERTES);
    toutes.unshift(nouvelle);
    ecrire(CLEFS.alertes, toutes);
    return HttpResponse.json(nouvelle, { status: 201 });
  }),

  http.post('/api/alertes/:id/traiter', async ({ params, request }) => {
    const body = (await request.json()) as AlerteTraitement;
    const toutes = lire(CLEFS.alertes, ALERTES);
    const index = toutes.findIndex((a) => a.id === params.id);
    if (index === -1) return erreur(404, 'Alerte introuvable');

    const action = body.statut === 'EN_COURS' ? 'PRENDRE_EN_CHARGE' : 'TRAITER';
    if (!peutAlerte(toutes[index], action)) {
      return erreur(400, `Transition impossible depuis le statut ${toutes[index].statut}`);
    }

    const maintenant = new Date().toISOString();
    toutes[index] = {
      ...toutes[index],
      statut: body.statut,
      dateMaj: maintenant,
      ...(body.statut === 'TRAITEE' && {
        dateTraitement: maintenant,
        traitePar: 'resp1',
        commentaireTraitement: body.commentaire,
      }),
    };
    ecrire(CLEFS.alertes, toutes);
    return HttpResponse.json(toutes[index]);
  }),
];
