import { http, HttpResponse } from 'msw';
import type { ApiError, Verger, VergerReferentiel } from '@/types/verger';
import type { Tournee } from '@/types/tournee';
import { vergersDisponibles } from '@/domain/planification';
import { CLEFS, ecrire, lire, lirePagination, paginer } from './store';
import { TOURNEES, VERGERS } from './fixtures';

/** DTO brut renvoyé par le backend (`VergerResponse`). */
interface VergerBrut {
  id: string;
  nom: string;
  superficieHa: number;
  variete: string;
  localisation: { longitude: number; latitude: number };
  maturite?: number | null;
  statut: string;
  proprietaireId: string;
}

function maturitePourcentageVersEnum(valeur?: number | null): string {
  if (valeur === undefined || valeur === null) return 'VERTE';
  if (valeur < 25) return 'VERTE';
  if (valeur < 50) return 'MI_MATURE';
  if (valeur < 75) return 'MATURE';
  return 'SURMATURE';
}

/** Conversion du format frontend vers le format backend pour la réponse. */
function vergerToBrut(v: any): VergerBrut {
  return {
    id: v.id,
    nom: v.nom,
    superficieHa: v.superficie,
    variete: v.typeOlive,
    localisation: {
      longitude: v.localisation.longitude,
      latitude: v.localisation.latitude,
    },
    maturite: maturiteEnumVersPourcentage(v.maturite),
    statut: v.statut,
    proprietaireId: v.agriculteurId,
  };
}

function maturiteEnumVersPourcentage(valeur: string): number | null {
  switch (valeur) {
    case 'VERTE': return 10;
    case 'MI_MATURE': return 40;
    case 'MATURE': return 70;
    case 'SURMATURE': return 90;
    default: return null;
  }
}

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
    const proprietaireId = url.searchParams.get('proprietaireId');
    const statut = url.searchParams.get('statut');

    let donnees = [...lire(CLEFS.vergers, VERGERS)];
    if (proprietaireId) donnees = donnees.filter((v) => v.agriculteurId === proprietaireId);
    if (statut) donnees = donnees.filter((v) => v.statut === statut);

    return HttpResponse.json(paginer(donnees, page, taille));
  }),

  http.get('/api/vergers/:id', ({ params }) => {
    const verger = lire(CLEFS.vergers, VERGERS).find((v) => v.id === params.id);
    if (!verger) return erreur(404, 'Verger introuvable', '/api/vergers');
    return HttpResponse.json(vergerToBrut(verger));
  }),

  http.post('/api/vergers', async ({ request }) => {
    const body = (await request.json()) as VergerBrut;
    const nouveau: any = {
      id: crypto.randomUUID(),
      agriculteurId: body.proprietaireId ?? 'agr1', // simulé - viendra du jeton côté backend
      nom: body.nom,
      superficie: body.superficieHa,
      typeOlive: body.variete,
      localisation: body.localisation,
      maturite: maturitePourcentageVersEnum(body.maturite),
      statut: 'EN_ATTENTE',
      dateCreation: new Date().toISOString(),
      dateMaj: new Date().toISOString(),
    };
    const tous = lire(CLEFS.vergers, VERGERS);
    tous.unshift(nouveau);
    ecrire(CLEFS.vergers, tous);
    return HttpResponse.json(vergerToBrut(nouveau), { status: 201 });
  }),

  http.put('/api/vergers/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<VergerBrut>;
    const tous = lire(CLEFS.vergers, VERGERS);
    const index = tous.findIndex((v) => v.id === params.id);
    if (index === -1) return erreur(404, 'Verger introuvable', '/api/vergers');

    const miseAJour = { ...tous[index] };
    if (body.nom !== undefined) miseAJour.nom = body.nom;
    if (body.superficieHa !== undefined) miseAJour.superficie = body.superficieHa;
    if (body.variete !== undefined) miseAJour.typeOlive = body.variete as Verger['typeOlive'];
    if (body.localisation !== undefined) miseAJour.localisation = body.localisation;
    if (body.maturite !== undefined) miseAJour.maturite = maturitePourcentageVersEnum(body.maturite) as Verger['maturite'];
    if (body.statut !== undefined) miseAJour.statut = body.statut as Verger['statut'];
    miseAJour.dateMaj = new Date().toISOString();
    tous[index] = miseAJour;
    ecrire(CLEFS.vergers, tous);
    return HttpResponse.json(vergerToBrut(miseAJour));
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
