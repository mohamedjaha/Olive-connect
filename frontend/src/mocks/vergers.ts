import { http, HttpResponse } from 'msw';
import type {
  ApiError,
  Verger,
  VergerCreate,
  VergerReferentiel,
} from '@/types/verger';
import type { Tournee } from '@/types/tournee';
import { vergersDisponibles } from '@/domain/planification';
import { CLEFS, ecrire, lire, lirePagination, paginer } from './store';
import { TOURNEES, VERGERS } from './fixtures';

function erreur(status: number, message: string, chemin: string) {
  return HttpResponse.json<ApiError>(
    {
      timestamp: new Date().toISOString(),
      status,
      error: status === 404 ? 'Not Found' : 'Bad Request',
      message,
      path: chemin,
    },
    { status },
  );
}

export const vergersHandlers = [
  // Routes spécifiques déclarées avant /:id, sinon « referentiel » est lu comme un identifiant.
  http.get('/api/vergers/referentiel', () => {
    const referentiel: VergerReferentiel[] = lire(CLEFS.vergers, VERGERS).map(({ id, nom }) => ({
      id,
      nom,
    }));
    return HttpResponse.json(referentiel);
  }),

  http.get('/api/vergers/disponibles', ({ request }): HttpResponse<VergerReferentiel[] | ApiError> => {
    const url = new URL(request.url);
    const dateDebut = url.searchParams.get('dateDebut');
    const dateFin = url.searchParams.get('dateFin');

    if (!dateDebut || !dateFin) {
      return erreur(400, 'dateDebut et dateFin sont requis', '/api/vergers/disponibles');
    }

    const libres = vergersDisponibles(lire(CLEFS.vergers, VERGERS), lire<Tournee>(CLEFS.tournees, TOURNEES), {
      dateDebut,
      dateFin,
    });

    return HttpResponse.json(libres.map(({ id, nom }) => ({ id, nom })));
  }),

  http.get('/api/vergers', ({ request }) => {
    const url = new URL(request.url);
    const { page, taille } = lirePagination(request);
    const agriculteurId = url.searchParams.get('agriculteurId');
    const maturite = url.searchParams.get('maturite');
    const statut = url.searchParams.get('statut');

    let donnees = lire(CLEFS.vergers, VERGERS);
    if (agriculteurId) donnees = donnees.filter((v) => v.agriculteurId === agriculteurId);
    if (maturite) donnees = donnees.filter((v) => v.maturite === maturite);
    if (statut) donnees = donnees.filter((v) => v.statut === statut);

    return HttpResponse.json(paginer(donnees, page, taille));
  }),

  http.get('/api/vergers/:id', ({ params }) => {
    const verger = lire(CLEFS.vergers, VERGERS).find((v) => v.id === params.id);
    if (!verger) return erreur(404, 'Verger introuvable', '/api/vergers');
    return HttpResponse.json(verger);
  }),

  http.post('/api/vergers', async ({ request }) => {
    const body = (await request.json()) as VergerCreate;
    const nouveau: Verger = {
      ...body,
      id: crypto.randomUUID(),
      agriculteurId: 'agr1', // simulé - viendra du jeton côté backend
      maturite: body.maturite ?? 'VERTE',
      statut: 'EN_ATTENTE',
      dateCreation: new Date().toISOString(),
      dateMaj: new Date().toISOString(),
    };
    const tous = lire(CLEFS.vergers, VERGERS);
    tous.unshift(nouveau);
    ecrire(CLEFS.vergers, tous);
    return HttpResponse.json(nouveau, { status: 201 });
  }),

  http.put('/api/vergers/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Verger>;
    const tous = lire(CLEFS.vergers, VERGERS);
    const index = tous.findIndex((v) => v.id === params.id);
    if (index === -1) return erreur(404, 'Verger introuvable', '/api/vergers');

    tous[index] = { ...tous[index], ...body, dateMaj: new Date().toISOString() };
    ecrire(CLEFS.vergers, tous);
    return HttpResponse.json(tous[index]);
  }),

  http.delete('/api/vergers/:id', ({ params }) => {
    const tous = lire(CLEFS.vergers, VERGERS);
    const index = tous.findIndex((v) => v.id === params.id);
    if (index === -1) return erreur(404, 'Verger introuvable', '/api/vergers');

    tous.splice(index, 1);
    ecrire(CLEFS.vergers, tous);
    return new HttpResponse(null, { status: 204 });
  }),
];
