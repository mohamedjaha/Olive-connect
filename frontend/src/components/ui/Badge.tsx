import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import type { Maturite, StatutVerger } from '@/types/verger';
import type { StatutRecolte } from '@/types/recolte';
import type { CategorieAlerte, StatutAlerte } from '@/types/alerte';
import type {
  StatutAffectation,
  StatutRessource,
  StatutTournee,
} from '@/types/tournee';

export type BadgeVariant = 'accent' | 'green' | 'muted' | 'error' | 'default';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    const base = 'badge';
    const variants = {
      default: '',
      accent: 'badge--accent',
      green: 'badge--green',
      muted: 'badge--muted',
      error: 'badge--error',
    };
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  },
);
Badge.displayName = 'Badge';

/**
 * Variantes d'affichage par vocabulaire contrôlé.
 * Les tables sont exhaustives : une valeur ajoutée au type casse la compilation ici.
 * Les libellés vivent dans `domain/libelles.ts`.
 */
export const VARIANTE_STATUT_VERGER: Record<StatutVerger, BadgeVariant> = {
  EN_ATTENTE: 'muted',
  PLANIFIE: 'accent',
  EN_COURS: 'accent',
  TERMINE: 'green',
  ANNULE: 'error',
};

export const VARIANTE_MATURITE: Record<Maturite, BadgeVariant> = {
  VERTE: 'muted',
  MI_MATURE: 'accent',
  MATURE: 'green',
  SURMATURE: 'error',
};

export const VARIANTE_STATUT_RECOLTE: Record<StatutRecolte, BadgeVariant> = {
  EN_ATTENTE: 'muted',
  PLANIFIEE: 'accent',
  EN_COURS: 'accent',
  TERMINEE: 'green',
  ANNULEE: 'error',
  RECUE: 'green',
};

export const VARIANTE_STATUT_ALERTE: Record<StatutAlerte, BadgeVariant> = {
  NOUVELLE: 'error',
  EN_COURS: 'accent',
  TRAITEE: 'green',
};

export const VARIANTE_CATEGORIE_ALERTE: Record<CategorieAlerte, BadgeVariant> = {
  MATURITE: 'accent',
  PROBLEME: 'error',
};

export const VARIANTE_STATUT_TOURNEE: Record<StatutTournee, BadgeVariant> = {
  PLANIFIEE: 'accent',
  EN_COURS: 'accent',
  TERMINEE: 'green',
  ANNULEE: 'error',
};

export const VARIANTE_STATUT_RESSOURCE: Record<StatutRessource, BadgeVariant> = {
  DISPONIBLE: 'green',
  OCCUPEE: 'accent',
  MAINTENANCE: 'muted',
  INDISPONIBLE: 'error',
};

export const VARIANTE_STATUT_AFFECTATION: Record<StatutAffectation, BadgeVariant> = {
  PLANIFIEE: 'accent',
  CONFIRMEE: 'accent',
  EN_COURS: 'accent',
  TERMINEE: 'green',
  ANNULEE: 'error',
};