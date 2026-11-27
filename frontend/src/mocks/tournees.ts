import { http, HttpResponse } from 'msw';
import type {
  Affectation,
  AffectationCreate,
  ApiError,
  PaginatedResponse,
  Ressource,
  RessourceCreate,
  RessourceUpdate,
  Tournee,
  TourneeCreate,
  TourneeUpdate,
} from '@/types/tournee';
import {
  creneauValide,
  ressourcesAffectables,
  ressourceDisponible,
  vergersDisponibles,
} from '@/domain/planification';
import { peutTournee } from '@/domain/statuts';
import { CLEFS, ecrire, lire, lirePagination, paginer } from './store';
import {
  AFFECTATIONS,
  CHEFS_EQUIPE,
  PRESSOIRS,
  RESSOURCES,
  TOURNEES,
  VERGERS,
} from './fixtures';

function erreur(status: number, message: string, chemin: string) {
  return HttpResponse.json<ApiError>(
    {
      timestamp: new Date().toISOString(),
      status,
      error: status === 404 ? 'Not Found' : status === 409 ? 'Conflict' : 'Bad Request',
      message,
      path: chemin,
    },
    { status },
  );
}

/** Enrichit une tournée avec les noms du référentiel, jamais avec des noms inventés. */
function enrichir(tournee: Tournee): Tournee {
  const ressources = lire(CLEFS.ressources, RESSOURCES);
  const vergers = lire(CLEFS.vergers, VERGERS);

  return {
    ...tournee,
    chefEquipeNom: CHEFS_EQUIPE.find((c) => c.id === tournee.chefEquipeId)?.nom,
    pressoirNom: PRESSOIRS.find((p) => p.id === tournee.pressoirId)?.nom,
    vergers: tournee.vergerIds.map((id) => ({
      id,
      nom: vergers.find((v) => v.id === id)?.nom ?? 'Non renseigné',
    })),
    ressources: tournee.ressourceIds
      .map((id) => ressources.find((r) => r.id === id))
      .filter((r): r is Ressource => r !== undefined),
  };
}

/** Vérifie créneau, ressources et vergers. Retourne un message d'erreur, ou null. */
function controlerPlanification(
  body: Pick<TourneeCreate, 'dateDebut' | 'dateFin' | 'ressourceIds' | 'vergerIds'>,
  ignorerTourneeId?: string,
): string | null {
  const creneau = { dateDebut: body.dateDebut, dateFin: body.dateFin };
  if (!creneauValide(creneau)) {
    return 'Créneau invalide : la fin doit être postérieure au début';
  }

  const ressources = lire(CLEFS.ressources, RESSOURCES);
  const affectations = lire(CLEFS.affectations, AFFECTATIONS);
  const tournees = lire(CLEFS.tournees, TOURNEES);
  const vergers = lire(CLEFS.vergers, VERGERS);

  const ressourcesOccupees = body.ressourceIds
    .map((id) => ressources.find((r) => r.id === id))
    .filter((r): r is Ressource => r !== undefined)
    .filter((r) => !ressourceDisponible(r, affectations, creneau, { ignorerTourneeId }))
    .map((r) => r.nom);

  if (ressourcesOccupees.length > 0) {
    return `Ressource(s) indisponible(s) sur ce créneau : ${ressourcesOccupees.join(', ')}`;
  }

  const libres = new Set(
    vergersDisponibles(vergers, tournees, creneau, { ignorerTourneeId }).map((v) => v.id),
  );
  const vergersOccupes = body.vergerIds
    .filter((id) => !libres.has(id))
    .map((id) => vergers.find((v) => v.id === id)?.nom ?? id);

  if (vergersOccupes.length > 0) {
    return `Verger(s) déjà engagé(s) sur ce créneau : ${vergersOccupes.join(', ')}`;
  }

  return null;
}

export const tourneesHandlers = [
  http.get('/api/tournees', ({ request }) => {
    const url = new URL(request.url);
    const { page, taille } = lirePagination(request);
    const statut = url.searchParams.get('statut');
    const chefEquipeId = url.searchParams.get('chefEquipeId');
    const pressoirId = url.searchParams.get('pressoirId');

    let donnees = lire(CLEFS.tournees, TOURNEES);
    if (statut) donnees = donnees.filter((t) => t.statut === statut);
    if (chefEquipeId) donnees = donnees.filter((t) => t.chefEquipeId === chefEquipeId);
    if (pressoirId) donnees = donnees.filter((t) => t.pressoirId === pressoirId);

    return HttpResponse.json<PaginatedResponse<Tournee>>(
      paginer(donnees.map(enrichir), page, taille),
    );
  }),

  http.get('/api/tournees/:id', ({ params }) => {
    const tournee = lire(CLEFS.tournees, TOURNEES).find((t) => t.id === params.id);
    if (!tournee) return erreur(404, 'Tournée introuvable', '/api/tournees');
    return HttpResponse.json(enrichir(tournee));
  }),

  http.post('/api/tournees', async ({ request }) => {
    const body = (await request.json()) as TourneeCreate;

    const probleme = controlerPlanification(body);
    if (probleme) return erreur(409, probleme, '/api/tournees');

    const nouvelle: Tournee = {
      ...body,
      id: crypto.randomUUID(),
      statut: 'PLANIFIEE',
      avancement: 0,
      dateCreation: new Date().toISOString(),
      dateMaj: new Date().toISOString(),
    };

    const toutes = lire(CLEFS.tournees, TOURNEES);
    toutes.unshift(nouvelle);
    ecrire(CLEFS.tournees, toutes);

    const affectations = lire(CLEFS.affectations, AFFECTATIONS);
    body.ressourceIds.forEach((ressourceId) => {
      affectations.push({
        id: crypto.randomUUID(),
        tourneeId: nouvelle.id,
        ressourceId,
        dateDebut: body.dateDebut,
        dateFin: body.dateFin,
        statut: 'PLANIFIEE',
      });
    });
    ecrire(CLEFS.affectations, affectations);

    return HttpResponse.json(enrichir(nouvelle), { status: 201 });
  }),

  http.put('/api/tournees/:id', async ({ params, request }) => {
    const body = (await request.json()) as TourneeUpdate;
    const toutes = lire(CLEFS.tournees, TOURNEES);
    const index = toutes.findIndex((t) => t.id === params.id);
    if (index === -1) return erreur(404, 'Tournée introuvable', '/api/tournees');

    const fusion = { ...toutes[index], ...body };
    const probleme = controlerPlanification(
      {
        dateDebut: fusion.dateDebut,
        dateFin: fusion.dateFin,
        ressourceIds: fusion.ressourceIds,
        vergerIds: fusion.vergerIds,
      },
      fusion.id,
    );
    if (probleme) return erreur(409, probleme, '/api/tournees');

    toutes[index] = { ...fusion, dateMaj: new Date().toISOString() };
    ecrire(CLEFS.tournees, toutes);

    if (body.ressourceIds) {
      const affectations = lire(CLEFS.affectations, AFFECTATIONS).filter(
        (a) => a.tourneeId !== params.id,
      );
      body.ressourceIds.forEach((ressourceId) => {
        affectations.push({
          id: crypto.randomUUID(),
          tourneeId: fusion.id,
          ressourceId,
          dateDebut: fusion.dateDebut,
          dateFin: fusion.dateFin,
          statut: 'PLANIFIEE',
        });
      });
      ecrire(CLEFS.affectations, affectations);
    }

    return HttpResponse.json(enrichir(toutes[index]));
  }),

  http.delete('/api/tournees/:id', ({ params }) => {
    const toutes = lire(CLEFS.tournees, TOURNEES);
    const index = toutes.findIndex((t) => t.id === params.id);
    if (index === -1) return erreur(404, 'Tournée introuvable', '/api/tournees');

    toutes.splice(index, 1);
    ecrire(CLEFS.tournees, toutes);
    ecrire(
      CLEFS.affectations,
      lire(CLEFS.affectations, AFFECTATIONS).filter((a) => a.tourneeId !== params.id),
    );

    return new HttpResponse(null, { status: 204 });
  }),

  http.post('/api/tournees/:id/demarrer', ({ params }) => {
    const toutes = lire(CLEFS.tournees, TOURNEES);
    const index = toutes.findIndex((t) => t.id === params.id);
    if (index === -1) return erreur(404, 'Tournée introuvable', '/api/tournees');

    if (!peutTournee(toutes[index], 'DEMARRER')) {
      return erreur(400, 'Seules les tournées planifiées peuvent être démarrées', '/api/tournees');
    }

    toutes[index] = {
      ...toutes[index],
      statut: 'EN_COURS',
      avancement: 0,
      dateMaj: new Date().toISOString(),
    };
    ecrire(CLEFS.tournees, toutes);

    const affectations = lire(CLEFS.affectations, AFFECTATIONS);
    affectations.forEach((a) => {
      if (a.tourneeId === params.id && a.statut === 'PLANIFIEE') a.statut = 'EN_COURS';
    });
    ecrire(CLEFS.affectations, affectations);

    return HttpResponse.json(toutes[index]);
  }),

  http.post('/api/tournees/:id/terminer', async ({ params, request }) => {
    const body = (await request.json()) as { quantiteReelle?: number };
    const toutes = lire(CLEFS.tournees, TOURNEES);
    const index = toutes.findIndex((t) => t.id === params.id);
    if (index === -1) return erreur(404, 'Tournée introuvable', '/api/tournees');

    if (!peutTournee(toutes[index], 'TERMINER')) {
      return erreur(400, 'Seules les tournées en cours peuvent être terminées', '/api/tournees');
    }

    toutes[index] = {
      ...toutes[index],
      statut: 'TERMINEE',
      avancement: 100,
      quantiteTotaleReelle: body.quantiteReelle,
      dateMaj: new Date().toISOString(),
    };
    ecrire(CLEFS.tournees, toutes);

    const affectations = lire(CLEFS.affectations, AFFECTATIONS);
    affectations.forEach((a) => {
      if (a.tourneeId === params.id && a.statut === 'EN_COURS') a.statut = 'TERMINEE';
    });
    ecrire(CLEFS.affectations, affectations);

    return HttpResponse.json(toutes[index]);
  }),

  http.post('/api/tournees/:id/annuler', async ({ params, request }) => {
    await request.json();
    const toutes = lire(CLEFS.tournees, TOURNEES);
    const index = toutes.findIndex((t) => t.id === params.id);
    if (index === -1) return erreur(404, 'Tournée introuvable', '/api/tournees');

    if (!peutTournee(toutes[index], 'ANNULER')) {
      return erreur(400, "Impossible d'annuler une tournée déjà démarrée ou terminée", '/api/tournees');
    }

    toutes[index] = { ...toutes[index], statut: 'ANNULEE', dateMaj: new Date().toISOString() };
    ecrire(CLEFS.tournees, toutes);

    const affectations = lire(CLEFS.affectations, AFFECTATIONS);
    affectations.forEach((a) => {
      if (a.tourneeId === params.id) a.statut = 'ANNULEE';
    });
    ecrire(CLEFS.affectations, affectations);

    return HttpResponse.json(toutes[index]);
  }),

  // Ressources
  http.get('/api/ressources', ({ request }) => {
    const url = new URL(request.url);
    const { page, taille } = lirePagination(request);
    const type = url.searchParams.get('type');
    const statut = url.searchParams.get('statut');

    let donnees = lire(CLEFS.ressources, RESSOURCES);
    if (type) donnees = donnees.filter((r) => r.type === type);
    if (statut) donnees = donnees.filter((r) => r.statut === statut);

    return HttpResponse.json<PaginatedResponse<Ressource>>(paginer(donnees, page, taille));
  }),

  http.get('/api/ressources/disponibilites', ({ request }) => {
    const url = new URL(request.url);
    const dateDebut = url.searchParams.get('dateDebut');
    const dateFin = url.searchParams.get('dateFin');
    const type = url.searchParams.get('type');

    if (!dateDebut || !dateFin) {
      return erreur(400, 'dateDebut et dateFin sont requis', '/api/ressources/disponibilites');
    }

    let ressources = lire(CLEFS.ressources, RESSOURCES);
    if (type) ressources = ressources.filter((r) => r.type === type);

    const libres = ressourcesAffectables(
      ressources,
      lire(CLEFS.affectations, AFFECTATIONS),
      { dateDebut, dateFin },
    );

    return HttpResponse.json(libres);
  }),

  http.get('/api/ressources/:id', ({ params }) => {
    const ressource = lire(CLEFS.ressources, RESSOURCES).find((r) => r.id === params.id);
    if (!ressource) return erreur(404, 'Ressource introuvable', '/api/ressources');
    return HttpResponse.json(ressource);
  }),

  http.post('/api/ressources', async ({ request }) => {
    const body = (await request.json()) as RessourceCreate;
    const nouvelle: Ressource = {
      ...body,
      id: crypto.randomUUID(),
      statut: 'DISPONIBLE',
      dateCreation: new Date().toISOString(),
      dateMaj: new Date().toISOString(),
    };
    const toutes = lire(CLEFS.ressources, RESSOURCES);
    toutes.unshift(nouvelle);
    ecrire(CLEFS.ressources, toutes);
    return HttpResponse.json(nouvelle, { status: 201 });
  }),

  http.put('/api/ressources/:id', async ({ params, request }) => {
    const body = (await request.json()) as RessourceUpdate;
    const toutes = lire(CLEFS.ressources, RESSOURCES);
    const index = toutes.findIndex((r) => r.id === params.id);
    if (index === -1) return erreur(404, 'Ressource introuvable', '/api/ressources');

    toutes[index] = { ...toutes[index], ...body, dateMaj: new Date().toISOString() };
    ecrire(CLEFS.ressources, toutes);
    return HttpResponse.json(toutes[index]);
  }),

  http.delete('/api/ressources/:id', ({ params }) => {
    const toutes = lire(CLEFS.ressources, RESSOURCES);
    const index = toutes.findIndex((r) => r.id === params.id);
    if (index === -1) return erreur(404, 'Ressource introuvable', '/api/ressources');

    const utilisee = lire(CLEFS.affectations, AFFECTATIONS).some(
      (a) => a.ressourceId === params.id && a.statut !== 'ANNULEE' && a.statut !== 'TERMINEE',
    );
    if (utilisee) {
      return erreur(400, 'Cette ressource est affectée à une tournée en cours', '/api/ressources');
    }

    toutes.splice(index, 1);
    ecrire(CLEFS.ressources, toutes);
    return new HttpResponse(null, { status: 204 });
  }),

  // Affectations
  http.get('/api/affectations', ({ request }) => {
    const url = new URL(request.url);
    const tourneeId = url.searchParams.get('tourneeId');
    const ressourceId = url.searchParams.get('ressourceId');

    let donnees = lire(CLEFS.affectations, AFFECTATIONS);
    if (tourneeId) donnees = donnees.filter((a) => a.tourneeId === tourneeId);
    if (ressourceId) donnees = donnees.filter((a) => a.ressourceId === ressourceId);

    const ressources = lire(CLEFS.ressources, RESSOURCES);
    return HttpResponse.json<Affectation[]>(
      donnees.map((a) => ({
        ...a,
        ressource: ressources.find((r) => r.id === a.ressourceId),
      })),
    );
  }),

  http.post('/api/affectations', async ({ request }) => {
    const body = (await request.json()) as AffectationCreate;

    if (!creneauValide(body)) {
      return erreur(400, 'Créneau invalide', '/api/affectations');
    }

    const ressource = lire(CLEFS.ressources, RESSOURCES).find((r) => r.id === body.ressourceId);
    if (!ressource) return erreur(404, 'Ressource introuvable', '/api/affectations');

    if (!ressourceDisponible(ressource, lire(CLEFS.affectations, AFFECTATIONS), body)) {
      return erreur(409, 'Cette ressource est déjà affectée sur ce créneau', '/api/affectations');
    }

    const nouvelle: Affectation = {
      ...body,
      id: crypto.randomUUID(),
      statut: 'PLANIFIEE',
    };
    const toutes = lire(CLEFS.affectations, AFFECTATIONS);
    toutes.push(nouvelle);
    ecrire(CLEFS.affectations, toutes);
    return HttpResponse.json(nouvelle, { status: 201 });
  }),

  http.delete('/api/affectations/:id', ({ params }) => {
    const toutes = lire(CLEFS.affectations, AFFECTATIONS);
    const index = toutes.findIndex((a) => a.id === params.id);
    if (index === -1) return erreur(404, 'Affectation introuvable', '/api/affectations');

    toutes.splice(index, 1);
    ecrire(CLEFS.affectations, toutes);
    return new HttpResponse(null, { status: 204 });
  }),

  // Référentiels
  http.get('/api/chefs-equipe', () => HttpResponse.json(CHEFS_EQUIPE)),
  http.get('/api/pressoirs', () => HttpResponse.json(PRESSOIRS)),
];
