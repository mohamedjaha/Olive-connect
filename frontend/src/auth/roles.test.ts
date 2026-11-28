import { describe, expect, it } from 'vitest';
import { accueilPourRole, libelleRole, normaliserRole, ROLES, ROLE_HOME } from './roles';

describe('normaliserRole', () => {
  it('conserve un rôle du vocabulaire backend', () => {
    expect(normaliserRole('AGRICULTEUR')).toBe('AGRICULTEUR');
    expect(normaliserRole('responsable_pressoir')).toBe('RESPONSABLE_PRESSOIR');
  });

  it("absorbe l'alias ADMINISTRATEUR du front M0", () => {
    expect(normaliserRole('ADMINISTRATEUR')).toBe('ADMIN');
    expect(normaliserRole('administrateur')).toBe('ADMIN');
  });

  it('retombe sur VISITEUR pour une valeur absente ou inconnue', () => {
    expect(normaliserRole(undefined)).toBe('VISITEUR');
    expect(normaliserRole(null)).toBe('VISITEUR');
    expect(normaliserRole('')).toBe('VISITEUR');
    expect(normaliserRole('SUPER_HEROS')).toBe('VISITEUR');
  });
});

describe('ROLE_HOME', () => {
  it('couvre tous les rôles connus', () => {
    ROLES.forEach((role) => {
      expect(ROLE_HOME[role]).toBeTruthy();
    });
  });

  it("n'envoie jamais un visiteur vers une page protégée", () => {
    expect(accueilPourRole('VISITEUR')).toBe('/en-attente');
    expect(accueilPourRole(undefined)).toBe('/en-attente');
  });

  it('dirige chaque rôle vers son espace', () => {
    expect(accueilPourRole('AGRICULTEUR')).toBe('/vergers');
    expect(accueilPourRole('CHEF_EQUIPE')).toBe('/tournees');
    expect(accueilPourRole('RESPONSABLE_LOGISTIQUE')).toBe('/ressources');
    expect(accueilPourRole('ADMIN')).toBe('/admin');
    expect(accueilPourRole('ADMINISTRATEUR')).toBe('/admin');
  });
});

describe('libelleRole', () => {
  it('affiche un libellé français', () => {
    expect(libelleRole('ADMIN')).toBe('Administrateur');
    expect(libelleRole('ADMINISTRATEUR')).toBe('Administrateur');
    expect(libelleRole('CHEF_EQUIPE')).toBe("Chef d'équipe");
    expect(libelleRole(null)).toBe('Visiteur');
  });
});
