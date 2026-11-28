import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge, VARIANTE_MATURITE, VARIANTE_STATUT_VERGER } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LIBELLE_MATURITE, LIBELLE_STATUT_VERGER, LIBELLE_TYPE_OLIVE } from '@/domain/libelles';
import type { Verger } from '@/types/verger';

interface VergerCardProps {
  verger: Verger;
  onEdit: (v: Verger) => void;
  onDelete: (v: Verger) => void;
  onView: (v: Verger) => void;
}

export function VergerCard({ verger, onEdit, onDelete, onView }: VergerCardProps) {
  const statutVariant = VARIANTE_STATUT_VERGER[verger.statut];
  const maturiteVariant = VARIANTE_MATURITE[verger.maturite];
  const typeLabel = LIBELLE_TYPE_OLIVE[verger.typeOlive];

  return (
    <Card variant="entry" padding="none" className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="entry-grid">
              <div>
                <span className="label">Nom</span>
                <span className="value text-lg font-semibold truncate block">{verger.nom}</span>
              </div>
              <div>
                <span className="label">Statut</span>
                <span className="value">
                  <Badge variant={statutVariant}>{LIBELLE_STATUT_VERGER[verger.statut]}</Badge>
                </span>
              </div>
              <div>
                <span className="label">Variété</span>
                <span className="value">{typeLabel}</span>
              </div>
              <div>
                <span className="label">Superficie</span>
                <span className="value num">{verger.superficie} ha</span>
              </div>
              <div>
                <span className="label">Maturité</span>
                <span className="value">
                  <Badge variant={maturiteVariant} size="sm">
                    {LIBELLE_MATURITE[verger.maturite]}
                  </Badge>
                </span>
              </div>
              <div>
                <span className="label">Coordonnées</span>
                <span className="value num">{verger.localisation.latitude.toFixed(4)}, {verger.localisation.longitude.toFixed(4)}</span>
              </div>
              {verger.rendementDisponible && (
                <div>
                  <span className="label">Rendement dispo</span>
                  <span className="value num">{verger.rendementDisponible} kg/ha</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-solid px-5 py-3 entry-foot" style={{ borderColor: 'var(--color-rule)' }}>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(verger)}>Voir</Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(verger)}>Modifier</Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(verger)}>Supprimer</Button>
        </div>
      </CardFooter>
    </Card>
  );
}