import { describe, it, expect } from 'vitest';
import {
  creneauValide,
  chevauche,
  ressourceDisponible,
  ressourcesAffectables,
  vergersDisponibles,
} from '@/domain/planification';
import type { Affectation, Ressource, Verger, Tournee } from '@/types/tournee';
import type { Verger as VergerType } from '@/types/verger';

describe('domain/planification', () => {
  describe('creneauValide', () => {
    it('retourne true pour un créneau valide (fin > début)', () => {
      expect(creneauValide({ dateDebut: '2025-11-20T08:00:00Z', dateFin: '2025-11-20T16:00:00Z' })).toBe(true);
    });

    it('retourne false si fin === début', () => {
      expect(creneauValide({ dateDebut: '2025-11-20T08:00:00Z', dateFin: '2025-11-20T08:00:00Z' })).toBe(false);
    });

    it('retourne false si fin < début', () => {
      expect(creneauValide({ dateDebut: '2025-11-20T16:00:00Z', dateFin: '2025-11-20T08:00:00Z' })).toBe(false);
    });

    it('retourne false pour des dates invalides', () => {
      expect(creneauValide({ dateDebut: 'invalid', dateFin: '2025-11-20T16:00:00Z' })).toBe(false);
      expect(creneauValide({ dateDebut: '2025-11-20T08:00:00Z', dateFin: 'invalid' })).toBe(false);
    });
  });

  describe('chevauche', () => {
    it('retourne true si les créneaux se chevauchent', () => {
      expect(
        chevauche(
          { dateDebut: '2025-11-20T08:00:00Z', dateFin: '2025-11-20T16:00:00Z' },
          { dateDebut: '2025-11-20T12:00:00Z', dateFin: '2025-11-20T20:00:00Z' },
        ),
      ).toBe(true);
    });

    it('retourne true si un créneau contient l\'autre', () => {
      expect(
        chevauche(
          { dateDebut: '2025-11-20T08:00:00Z', dateFin: '2025-11-20T20:00:00Z' },
          { dateDebut: '2025-11-20T10:00:00Z', dateFin: '2025-11-20T14:00:00Z' },
        ),
      ).toBe(true);
    });

    it('retourne false si les créneaux se touchent seulement (finA === débutB)', () => {
      expect(
        chevauche(
          { dateDebut: '2025-11-20T08:00:00Z', dateFin: '2025-11-20T16:00:00Z' },
          { dateDebut: '2025-11-20T16:00:00Z', dateFin: '2025-11-21T00:00:00Z' },
        ),
      ).toBe(false);
    });

    it('retourne false si les créneaux sont disjoints', () => {
      expect(
        chevauche(
          { dateDebut: '2025-11-20T08:00:00Z', dateFin: '2025-11-20T12:00:00Z' },
          { dateDebut: '2025-11-20T14:00:00Z', dateFin: '2025-11-20T18:00:00Z' },
        ),
      ).toBe(false);
    });

    it('retourne false pour des dates invalides', () => {
      expect(
        chevauche(
          { dateDebut: 'invalid', dateFin: '2025-11-20T16:00:00Z' },
          { dateDebut: '2025-11-20T08:00:00Z', dateFin: '2025-11-20T12:00:00Z' },
        ),
      ).toBe(false);
    });
  });

  describe('ressourceDisponible', () => {
    const ressource: Ressource = {
      id: 'r1',
      type: 'TRACTEUR',
      nom: 'Tracteur 1',
      capacite: 1,
      statut: 'DISPONIBLE',
      dateCreation: '2025-10-01T00:00:00Z',
      dateMaj: '2025-11-01T00:00:00Z',
    };

    const affectationActive: Affectation = {
      id: 'af1',
      tourneeId: 't1',
      ressourceId: 'r1',
      dateDebut: '2025-11-20T08:00:00Z',
      dateFin: '2025-11-20T16:00:00Z',
      statut: 'PLANIFIEE',
    };

    const affectationTerminee: Affectation = {
      ...affectationActive,
      id: 'af2',
      statut: 'TERMINEE',
    };

    it('retourne false si statut MAINTENANCE', () => {
      expect(
        ressourceDisponible(
          { ...ressource, statut: 'MAINTENANCE' },
          [],
          { dateDebut: '2025-11-20T08:00:00Z', dateFin: '2025-11-20T16:00:00Z' },
        ),
      ).toBe(false);
    });

    it('retourne false si statut INDISPONIBLE', () => {
      expect(
        ressourceDisponible(
          { ...ressource, statut: 'INDISPONIBLE' },
          [],
          { dateDebut: '2025-11-20T08:00:00Z', dateFin: '2025-11-20T16:00:00Z' },
        ),
      ).toBe(false);
    });

    it('retourne true si aucune affectation', () => {
      expect(
        ressourceDisponible(ressource, [], { dateDebut: '2025-11-20T08:00:00Z', dateFin: '2025-11-20T16:00:00Z' }),
      ).toBe(true);
    });

    it('retourne false si affectation active chevauche', () => {
      expect(
        ressourceDisponible(
          ressource,
          [affectationActive],
          { dateDebut: '2025-11-20T10:00:00Z', dateFin: '2025-11-20T14:00:00Z' },
        ),
      ).toBe(false);
    });

    it('retourne true si affectation ne chevauche pas', () => {
      expect(
        ressourceDisponible(
          ressource,
          [affectationActive],
          { dateDebut: '2025-11-21T08:00:00Z', dateFin: '2025-11-21T16:00:00Z' },
        ),
      ).toBe(true);
    });

    it('retourne true si affectation TERMINEE (non active)', () => {
      expect(
        ressourceDisponible(
          ressource,
          [affectationTerminee],
          { dateDebut: '2025-11-20T10:00:00Z', dateFin: '2025-11-20T14:00:00Z' },
        ),
      ).toBe(true);
    });

    it('retourne true si affectation ANNULEE (non active)', () => {
      expect(
        ressourceDisponible(
          ressource,
          [{ ...affectationActive, statut: 'ANNULEE' }],
          { dateDebut: '2025-11-20T10:00:00Z', dateFin: '2025-11-20T14:00:00Z' },
        ),
      ).toBe(true);
    });

    it('ignore la tournée exclue via options.ignorerTourneeId', () => {
      expect(
        ressourceDisponible(
          ressource,
          [affectationActive],
          { dateDebut: '2025-11-20T10:00:00Z', dateFin: '2025-11-20T14:00:00Z' },
          { ignorerTourneeId: 't1' },
        ),
      ).toBe(true);
    });
  });

  describe('ressourcesAffectables', () => {
    const ressources: Ressource[] = [
      { id: 'r1', type: 'TRACTEUR', nom: 'T1', capacite: 1, statut: 'DISPONIBLE', dateCreation: '', dateMaj: '' },
      { id: 'r2', type: 'BENNE', nom: 'B1', capacite: 5000, statut: 'DISPONIBLE', dateCreation: '', dateMaj: '' },
      { id: 'r3', type: 'OUVRIER', nom: 'O1', capacite: 1, statut: 'MAINTENANCE', dateCreation: '', dateMaj: '' },
    ];

    const affectations: Affectation[] = [
      {
        id: 'af1',
        tourneeId: 't1',
        ressourceId: 'r1',
        dateDebut: '2025-11-20T08:00:00Z',
        dateFin: '2025-11-20T16:00:00Z',
        statut: 'PLANIFIEE',
      },
    ];

    it('retourne les ressources libres sur le créneau', () => {
      const libres = ressourcesAffectables(
        ressources,
        affectations,
        { dateDebut: '2025-11-21T08:00:00Z', dateFin: '2025-11-21T16:00:00Z' },
      );
      expect(libres.map((r) => r.id).sort()).toEqual(['r1', 'r2']);
    });

    it('exclut les ressources en MAINTENANCE', () => {
      const libres = ressourcesAffectables(
        ressources,
        [],
        { dateDebut: '2025-11-20T08:00:00Z', dateFin: '2025-11-20T16:00:00Z' },
      );
      expect(libres.find((r) => r.id === 'r3')).toBeUndefined();
    });

    it('retourne [] si créneau invalide', () => {
      expect(
        ressourcesAffectables(
          ressources,
          [],
          { dateDebut: '2025-11-20T16:00:00Z', dateFin: '2025-11-20T08:00:00Z' },
        ),
      ).toEqual([]);
    });
  });

  describe('vergersDisponibles', () => {
    const vergers: VergerType[] = [
      {
        id: 'v1',
        agriculteurId: 'agr1',
        nom: 'Verger 1',
        superficie: 10,
        typeOlive: 'CHETOUI',
        localisation: { latitude: 0, longitude: 0 },
        maturite: 'MATURE',
        statut: 'PLANIFIE',
        dateCreation: '',
        dateMaj: '',
      },
      {
        id: 'v2',
        agriculteurId: 'agr1',
        nom: 'Verger 2',
        superficie: 5,
        typeOlive: 'CHEMLELI',
        localisation: { latitude: 0, longitude: 0 },
        maturite: 'MATURE',
        statut: 'PLANIFIE',
        dateCreation: '',
        dateMaj: '',
      },
    ];

    const tournees: Tournee[] = [
      {
        id: 't1',
        dateDebut: '2025-11-20T08:00:00Z',
        dateFin: '2025-11-20T16:00:00Z',
        chefEquipeId: 'ce1',
        vergerIds: ['v1'],
        ressourceIds: [],
        pressoirId: 'p1',
        statut: 'PLANIFIEE',
        avancement: 0,
        dateCreation: '',
        dateMaj: '',
      },
    ];

    it('retourne les vergers non affectés sur le créneau', () => {
      const libres = vergersDisponibles(
        vergers,
        tournees,
        { dateDebut: '2025-11-21T08:00:00Z', dateFin: '2025-11-21T16:00:00Z' },
      );
      expect(libres.map((v) => v.id).sort()).toEqual(['v1', 'v2']);
    });

    it('exclut le verger déjà dans une tournée chevauchante', () => {
      const libres = vergersDisponibles(
        vergers,
        tournees,
        { dateDebut: '2025-11-20T10:00:00Z', dateFin: '2025-11-20T14:00:00Z' },
      );
      expect(libres.map((v) => v.id)).toEqual(['v2']);
    });

    it('n\'exclut pas si la tournée est ANNULEE', () => {
      const libres = vergersDisponibles(
        vergers,
        [{ ...tournees[0], statut: 'ANNULEE' }],
        { dateDebut: '2025-11-20T10:00:00Z', dateFin: '2025-11-20T14:00:00Z' },
      );
      expect(libres.map((v) => v.id).sort()).toEqual(['v1', 'v2']);
    });

    it('ignore la tournée exclue via options.ignorerTourneeId', () => {
      const libres = vergersDisponibles(
        vergers,
        tournees,
        { dateDebut: '2025-11-20T10:00:00Z', dateFin: '2025-11-20T14:00:00Z' },
        { ignorerTourneeId: 't1' },
      );
      expect(libres.map((v) => v.id).sort()).toEqual(['v1', 'v2']);
    });

    it('retourne [] si créneau invalide', () => {
      expect(
        vergersDisponibles(
          vergers,
          tournees,
          { dateDebut: '2025-11-20T16:00:00Z', dateFin: '2025-11-20T08:00:00Z' },
        ),
      ).toEqual([]);
    });
  });
});