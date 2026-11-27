import { describe, it, expect } from 'vitest';
import {
  actionsDemandeRecolte,
  peutDemandeRecolte,
  actionsTournee,
  peutTournee,
  actionsAlerte,
  peutAlerte,
} from '@/domain/statuts';
import type { StatutRecolte, StatutTournee, StatutAlerte } from '@/types/common';

describe('domain/statuts', () => {
  describe('DemandeRecolte', () => {
    const statuts: StatutRecolte[] = [
      'EN_ATTENTE',
      'PLANIFIEE',
      'EN_COURS',
      'TERMINEE',
      'ANNULEE',
      'RECUE',
    ];

    it.each(statuts)('actionsDemandeRecolte(%s) renvoie un tableau', (statut) => {
      const actions = actionsDemandeRecolte({ statut });
      expect(Array.isArray(actions)).toBe(true);
    });

    it('EN_ATTENTE : peut MODIFIER et ANNULER', () => {
      const d = { statut: 'EN_ATTENTE' as StatutRecolte };
      expect(peutDemandeRecolte(d, 'MODIFIER')).toBe(true);
      expect(peutDemandeRecolte(d, 'ANNULER')).toBe(true);
      expect(peutDemandeRecolte(d, 'DEMARRER')).toBe(false);
    });

    it('PLANIFIEE : peut MODIFIER, ANNULER, DEMARRER (sans tournée démarrée)', () => {
      const d = { statut: 'PLANIFIEE' as StatutRecolte };
      expect(peutDemandeRecolte(d, 'MODIFIER')).toBe(true);
      expect(peutDemandeRecolte(d, 'ANNULER')).toBe(true);
      expect(peutDemandeRecolte(d, 'DEMARRER')).toBe(true);
    });

    it('PLANIFIEE + tournée EN_COURS : NE PEUT PLUS modifier ni annuler', () => {
      const d = { statut: 'PLANIFIEE' as StatutRecolte };
      const ctx = { tourneeStatut: 'EN_COURS' as StatutTournee };
      expect(peutDemandeRecolte(d, 'MODIFIER', ctx)).toBe(false);
      expect(peutDemandeRecolte(d, 'ANNULER', ctx)).toBe(false);
      expect(peutDemandeRecolte(d, 'DEMARRER', ctx)).toBe(true);
    });

    it('PLANIFIEE + tournée TERMINEE : NE PEUT PLUS modifier ni annuler', () => {
      const d = { statut: 'PLANIFIEE' as StatutRecolte };
      const ctx = { tourneeStatut: 'TERMINEE' as StatutTournee };
      expect(peutDemandeRecolte(d, 'MODIFIER', ctx)).toBe(false);
      expect(peutDemandeRecolte(d, 'ANNULER', ctx)).toBe(false);
    });

    it('EN_COURS : peut seulement TERMINER', () => {
      const d = { statut: 'EN_COURS' as StatutRecolte };
      expect(peutDemandeRecolte(d, 'TERMINER')).toBe(true);
      expect(peutDemandeRecolte(d, 'MODIFIER')).toBe(false);
      expect(peutDemandeRecolte(d, 'ANNULER')).toBe(false);
    });

    it('TERMINEE, ANNULEE, RECUE : aucune action', () => {
      ['TERMINEE', 'ANNULEE', 'RECUE'].forEach((s) => {
        const d = { statut: s as StatutRecolte };
        expect(actionsDemandeRecolte(d)).toEqual([]);
      });
    });
  });

  describe('Tournee', () => {
    const statuts: StatutTournee[] = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];

    it.each(statuts)('actionsTournee(%s) renvoie un tableau', (statut) => {
      const actions = actionsTournee({ statut });
      expect(Array.isArray(actions)).toBe(true);
    });

    it('PLANIFIEE : peut MODIFIER, DEMARRER, ANNULER', () => {
      const t = { statut: 'PLANIFIEE' as StatutTournee };
      expect(peutTournee(t, 'MODIFIER')).toBe(true);
      expect(peutTournee(t, 'DEMARRER')).toBe(true);
      expect(peutTournee(t, 'ANNULER')).toBe(true);
      expect(peutTournee(t, 'TERMINER')).toBe(false);
    });

    it('EN_COURS : peut seulement TERMINER', () => {
      const t = { statut: 'EN_COURS' as StatutTournee };
      expect(peutTournee(t, 'TERMINER')).toBe(true);
      expect(peutTournee(t, 'MODIFIER')).toBe(false);
      expect(peutTournee(t, 'ANNULER')).toBe(false);
    });

    it('TERMINEE, ANNULEE : aucune action', () => {
      ['TERMINEE', 'ANNULEE'].forEach((s) => {
        const t = { statut: s as StatutTournee };
        expect(actionsTournee(t)).toEqual([]);
      });
    });
  });

  describe('Alerte', () => {
    const statuts: StatutAlerte[] = ['NOUVELLE', 'EN_COURS', 'TRAITEE'];

    it.each(statuts)('actionsAlerte(%s) renvoie un tableau', (statut) => {
      const actions = actionsAlerte({ statut });
      expect(Array.isArray(actions)).toBe(true);
    });

    it('NOUVELLE : PRENDRE_EN_CHARGE, TRAITER', () => {
      const a = { statut: 'NOUVELLE' as StatutAlerte };
      expect(peutAlerte(a, 'PRENDRE_EN_CHARGE')).toBe(true);
      expect(peutAlerte(a, 'TRAITER')).toBe(true);
    });

    it('EN_COURS : seulement TRAITER', () => {
      const a = { statut: 'EN_COURS' as StatutAlerte };
      expect(peutAlerte(a, 'TRAITER')).toBe(true);
      expect(peutAlerte(a, 'PRENDRE_EN_CHARGE')).toBe(false);
    });

    it('TRAITEE : aucune action', () => {
      const a = { statut: 'TRAITEE' as StatutAlerte };
      expect(actionsAlerte(a)).toEqual([]);
    });
  });
});