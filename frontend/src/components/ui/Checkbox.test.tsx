import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('associe le libellé à la case', () => {
    render(<Checkbox label="Récolte urgente" />);

    const caseACocher = screen.getByLabelText('Récolte urgente');
    expect(caseACocher).toBeInTheDocument();
    expect(caseACocher).not.toBeChecked();
  });

  it('bascule au clic sur le libellé', () => {
    render(<Checkbox label="Récolte urgente" />);

    const caseACocher = screen.getByLabelText('Récolte urgente');
    fireEvent.click(caseACocher);

    expect(caseACocher).toBeChecked();
  });

  it('affiche l’erreur et marque le champ invalide', () => {
    render(<Checkbox label="Accepter les conditions" error="Vous devez accepter les conditions" />);

    const caseACocher = screen.getByLabelText('Accepter les conditions');
    expect(caseACocher).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Vous devez accepter les conditions');
  });

  it('affiche l’aide seulement en l’absence d’erreur', () => {
    const { rerender } = render(<Checkbox label="Récolte urgente" helperText="Visible par le responsable" />);
    expect(screen.getByText('Visible par le responsable')).toBeInTheDocument();

    rerender(<Checkbox label="Récolte urgente" helperText="Visible par le responsable" error="Champ requis" />);
    expect(screen.queryByText('Visible par le responsable')).not.toBeInTheDocument();
    expect(screen.getByText('Champ requis')).toBeInTheDocument();
  });
});
