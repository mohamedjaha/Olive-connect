import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table, type TableColumn } from './Table';

interface Ligne {
  id: string;
  nom: string;
  surface: number;
}

const colonnes: TableColumn<Ligne>[] = [
  { key: 'nom', header: 'Nom' },
  { key: 'surface', header: 'Surface (ha)', align: 'right', render: (ligne) => `${ligne.surface} ha` },
];

const lignes: Ligne[] = [
  { id: 'v1', nom: 'Oliviers Nord', surface: 12 },
  { id: 'v2', nom: 'Oliviers Sud', surface: 8 },
];

describe('Table', () => {
  it('affiche les en-têtes et une ligne par donnée', () => {
    render(<Table columns={colonnes} rows={lignes} getRowKey={(ligne) => ligne.id} />);

    expect(screen.getByRole('columnheader', { name: 'Nom' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Surface (ha)' })).toBeInTheDocument();
    // 1 ligne d'en-tête + 2 lignes de données
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('Oliviers Nord')).toBeInTheDocument();
  });

  it('utilise le rendu personnalisé et l’alignement de la colonne', () => {
    render(<Table columns={colonnes} rows={lignes} getRowKey={(ligne) => ligne.id} />);

    const cellule = screen.getByText('12 ha');
    expect(cellule).toHaveClass('text-right');
  });

  it('affiche le message vide quand il n’y a aucune ligne', () => {
    render(
      <Table
        columns={colonnes}
        rows={[]}
        getRowKey={(ligne) => ligne.id}
        emptyMessage="Aucun verger enregistré"
      />
    );

    expect(screen.getByText('Aucun verger enregistré')).toBeInTheDocument();
  });

  it('affiche le squelette de chargement sans message vide', () => {
    render(
      <Table
        columns={colonnes}
        rows={[]}
        getRowKey={(ligne) => ligne.id}
        emptyMessage="Aucun verger enregistré"
        isLoading
      />
    );

    expect(screen.queryByText('Aucun verger enregistré')).not.toBeInTheDocument();
    // 1 en-tête + 3 lignes de squelette
    expect(screen.getAllByRole('row')).toHaveLength(4);
  });

  it('expose la légende aux lecteurs d’écran', () => {
    render(
      <Table
        columns={colonnes}
        rows={lignes}
        getRowKey={(ligne) => ligne.id}
        caption="Liste des vergers"
      />
    );

    expect(screen.getByRole('table', { name: 'Liste des vergers' })).toBeInTheDocument();
  });
});
