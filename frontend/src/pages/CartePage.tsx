import { MapView } from '@/components/map/MapView';

export function CartePage() {
  const markers: Array<{ id: string; coordinates: [number, number]; popupContent: React.ReactNode }> = [
    {
      id: 'v1',
      coordinates: [10.76, 34.74] as [number, number],
      popupContent: `
        <h3 style="font-weight:600">Verger Nord</h3>
        <p>Variété: Chétoui</p>
        <p>Maturité: Mature</p>
        <p>Rendement: 4200 kg/ha</p>
      `
    },
    {
      id: 'v2',
      coordinates: [10.78, 34.71] as [number, number],
      popupContent: `
        <h3 style="font-weight:600">Verger Sud</h3>
        <p>Variété: Chemléli</p>
        <p>Maturité: Mi-mature</p>
        <p>Rendement: 3800 kg/ha</p>
      `
    },
    {
      id: 'v3',
      coordinates: [10.72, 34.78] as [number, number],
      popupContent: `
        <h3 style="font-weight:600">Verger Est</h3>
        <p>Variété: Arbequine</p>
        <p>Maturité: Verte</p>
        <p>Rendement: 3200 kg/ha</p>
      `
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>
      <div className="container py-6">
        <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-display)' }}>
          Carte des vergers
        </h1>
        <div style={{ height: 'calc(100vh - 200px)', borderRadius: 'var(--radius-card)', overflow: 'hidden', border: '1px solid', borderColor: 'var(--color-rule)' }}>
          <MapView 
            center={[10.76, 34.74]}
            zoom={12}
            markers={markers}
          />
        </div>
      </div>
    </div>
  );
}