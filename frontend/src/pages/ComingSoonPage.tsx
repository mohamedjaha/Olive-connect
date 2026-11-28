import { Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoonPage({ title, description }: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-paper)' }}>
      <Card variant="sheet" className="w-full max-w-md">
        <CardContent className="text-center py-12 px-6 space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
            <Info className="w-8 h-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-display)' }}>
              {title}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {description ?? 'Cette fonctionnalité est en cours de développement.'}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 w-full"
          >
            <span className="text-sm" aria-hidden="true">←</span>
            Retour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}