import type { ReactNode } from 'react';

export interface TableColumn<T> {
  /** Identifiant stable de la colonne (utilisé comme clé React). */
  key: string;
  /** Libellé affiché dans l'en-tête. */
  header: string;
  /** Rendu personnalisé d'une cellule. Par défaut, la valeur `ligne[key]`. */
  render?: (row: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Masque la colonne sous le point de rupture `md` (tableaux étroits sur mobile). */
  hideOnMobile?: boolean;
  /** Largeur CSS optionnelle, par exemple `12rem`. */
  width?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Légende accessible (lue par les lecteurs d'écran, masquée visuellement). */
  caption?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

const ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

function valeurAffichee(valeur: unknown): ReactNode {
  if (valeur === null || valeur === undefined || valeur === '') {
    return <span style={{ color: 'var(--color-muted)' }}>&mdash;</span>;
  }
  return String(valeur);
}

/**
 * Tableau de données générique.
 *
 * - défilement horizontal sur mobile (`overflow-x-auto`)
 * - colonnes masquables sous `md` pour les écrans étroits
 * - états vide et chargement intégrés
 * - en-têtes `scope="col"` et légende pour l'accessibilité
 */
export function Table<T>({
  columns,
  rows,
  getRowKey,
  caption,
  emptyMessage = 'Aucune donnée',
  isLoading = false,
  className = '',
}: TableProps<T>) {
  const isEmpty = !isLoading && rows.length === 0;

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead>
          <tr className="border-b border-solid" style={{ borderColor: 'var(--color-rule)' }}>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-3 py-2.5 font-medium whitespace-nowrap ${ALIGN[column.align ?? 'left']} ${
                  column.hideOnMobile ? 'hidden md:table-cell' : ''
                }`}
                style={{ width: column.width, color: 'var(--color-muted)' }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <tr
                key={`squelette-${index}`}
                className="border-b border-solid"
                style={{ borderColor: 'var(--color-rule)' }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-3 ${column.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                  >
                    <div
                      className="h-3 rounded animate-pulse"
                      style={{ background: 'var(--color-paper-3)' }}
                    />
                  </td>
                ))}
              </tr>
            ))}

          {isEmpty && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-10 text-center"
                style={{ color: 'var(--color-muted)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          )}

          {!isLoading &&
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="border-b border-solid transition-colors hover:bg-[var(--color-paper-2)]"
                style={{ borderColor: 'var(--color-rule)' }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-3 ${ALIGN[column.align ?? 'left']} ${
                      column.hideOnMobile ? 'hidden md:table-cell' : ''
                    }`}
                    style={{ color: 'var(--color-ink)' }}
                  >
                    {column.render
                      ? column.render(row)
                      : valeurAffichee((row as Record<string, unknown>)[column.key])}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}