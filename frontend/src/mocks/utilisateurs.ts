import { http, HttpResponse } from 'msw';
import type { Profil } from '@/api/utilisateurs';
import type { Role } from '@/auth/roles';

const CLE_PROFIL = 'oliveconnect_profil_mock';

function lireProfil(): Profil | null {
  const brut = localStorage.getItem(CLE_PROFIL);
  if (!brut) return null;
  try {
    return JSON.parse(brut) as Profil;
  } catch {
    return null;
  }
}

function ecrireProfil(profil: Profil): void {
  localStorage.setItem(CLE_PROFIL, JSON.stringify(profil));
}

/** Remet le mock d'inscription à zéro (tests et démonstration). */
export function reinitialiserProfilMock(): void {
  localStorage.removeItem(CLE_PROFIL);
}

/**
 * Mocks du domaine utilisateur, alignés sur le contrat du backend M2 :
 * - pas de profil tant que l'inscription n'a pas eu lieu (404) ;
 * - l'inscription n'accepte ni email ni rôle, et crée un `VISITEUR`.
 */
export const utilisateursHandlers = [
  http.get('/api/users/me', () => {
    const profil = lireProfil();
    if (!profil) {
      return HttpResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 });
    }
    return HttpResponse.json(profil);
  }),

  http.post('/api/users/register', async ({ request }) => {
    const corps = (await request.json()) as {
      nom?: string;
      prenom?: string;
      telephone?: string;
    };

    if (!corps.nom?.trim() || !corps.prenom?.trim()) {
      return HttpResponse.json({ message: 'Nom et prenom obligatoires' }, { status: 400 });
    }
    if (lireProfil()) {
      return HttpResponse.json({ message: 'Utilisateur deja inscrit' }, { status: 409 });
    }

    const profil: Profil = {
      id: 'u-demo',
      nom: corps.nom.trim(),
      prenom: corps.prenom.trim(),
      email: 'demo@oliveconnect.tn',
      telephone: corps.telephone?.trim() || null,
      role: 'VISITEUR',
      actif: true,
    };
    ecrireProfil(profil);
    return HttpResponse.json(profil, { status: 201 });
  }),

  http.patch('/api/users/:id/role', async ({ params, request }) => {
    const profil = lireProfil();
    if (!profil || profil.id !== params.id) {
      return HttpResponse.json({ message: 'Utilisateur introuvable' }, { status: 404 });
    }
    const corps = (await request.json()) as { role?: Role };
    if (!corps.role) {
      return HttpResponse.json({ message: 'Role obligatoire' }, { status: 400 });
    }
    const misAJour: Profil = { ...profil, role: corps.role };
    ecrireProfil(misAJour);
    return HttpResponse.json(misAJour);
  }),
];
