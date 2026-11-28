import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Leaf, Truck, AlertTriangle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BoutonGoogle } from '@/components/auth/BoutonGoogle';
import { useSession } from '@/auth/SessionContext';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isLoading, mode, connecterAvecJeton } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heure, setHeure] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Horloge de l'en-tête : un seul intervalle, arrêté au démontage.
  useEffect(() => {
    const rafraichir = () =>
      setHeure(
        new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    rafraichir();
    const intervalle = window.setInterval(rafraichir, 1000);
    return () => window.clearInterval(intervalle);
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Identifiants invalides');
    }
  };

  const gererJetonGoogle = async (jeton: string) => {
    setError(null);
    try {
      await connecterAvecJeton(jeton);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion Google impossible');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* ===== GAUCHE : carte décorée, contenu aligné à droite ===== */}
        <section className="hidden lg:flex lg:w-1/2 relative" style={{ background: 'var(--color-paper-2)' }}>
          <div className="absolute inset-0" style={{ background: 'var(--color-paper-2)' }}>
            {/* Fond de carte cadastrale, style Furrow */}
            <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <pattern id="contour" patternUnits="userSpaceOnUse" width="60" height="60">
                  <path d="M30 0 Q45 15 60 30 Q45 45 30 60 Q15 45 0 30 Q15 15 30 0" fill="none" stroke="currentColor" stroke-width="0.5" opacity="0.4"/>
                </pattern>
              </defs>
              <rect width="1200" height="800" fill="url(#contour)" style={{ stroke: 'var(--color-contour)' }} />
              {/* Haies */}
              <g stroke="var(--color-hedge)" stroke-width="1" stroke-dasharray="4 4" opacity="0.6">
                <path d="M100 200 Q200 180 300 220 Q400 260 500 240 Q600 220 700 250" fill="none"/>
                <path d="M150 400 Q250 380 350 420 Q450 460 550 440 Q650 420 750 450" fill="none"/>
                <path d="M200 600 Q300 580 400 620 Q500 660 600 640 Q700 620 800 650" fill="none"/>
              </g>
              {/* Eau */}
              <path d="M0 700 Q300 680 600 720 Q900 760 1200 740 L1200 800 L0 800 Z" fill="var(--color-water)" opacity="0.4"/>
              {/* Limite de l'exploitation */}
              <path d="M100 150 Q300 100 550 140 Q800 180 1000 150 Q1050 300 1020 500 Q980 650 900 700 Q700 750 400 720 Q200 700 150 550 Q100 400 100 150 Z"
                    fill="none" stroke="var(--color-accent)" stroke-width="3" stroke-dasharray="8 4"/>
              {/* Repères */}
              <g fill="var(--color-accent)">
                <circle cx="200" cy="300" r="6"/>
                <circle cx="450" cy="400" r="6"/>
                <circle cx="700" cy="350" r="6"/>
                <circle cx="350" cy="550" r="6"/>
                <circle cx="600" cy="500" r="6"/>
              </g>
            </svg>
            <div className="absolute bottom-6 left-6" style={{ background: 'var(--color-accent)', color: 'var(--color-accent-ink)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)', fontWeight: 500, fontFamily: 'var(--font-body)', boxShadow: 'var(--shadow-lift)' }}>
              Exploitation Sfax-Nord
            </div>
          </div>

          <div className="relative z-10 flex-col items-end justify-center p-8 pr-0 h-full max-w-lg">
            <div className="inline-flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--color-accent)' }}>
              <span className="font-semibold" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-display)' }}>OliveConnect</span>
            </div>
            <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-display)', lineHeight: 1.2, maxWidth: '24ch' }}>
              Gérez vos vergers et vos récoltes d’olives
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)', maxWidth: '40ch' }}>
              Plateforme de gestion pour la filière oléicole : vergers, tournées, alertes terrain et pressoirs.
            </p>

            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg flex-nowrap" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid', borderColor: 'var(--color-rule)' }}>
                <Leaf className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>124 vergers</span>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>suivis en temps réel</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg flex-nowrap" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid', borderColor: 'var(--color-rule)' }}>
                <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>48 tournées</span>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>planifiées ce mois</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg flex-nowrap" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid', borderColor: 'var(--color-rule)' }}>
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" aria-hidden="true" />
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Alertes terrain</span>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>géolocalisées et traitées</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg flex-nowrap" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid', borderColor: 'var(--color-rule)' }}>
                <Scale className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Pressoirs</span>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>réception et capacité</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2" style={{ color: 'var(--color-muted)' }}>
              <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-outlier)' }}>Sfax, Tunisie</span>
              <span className="w-px h-3" style={{ background: 'var(--color-rule)' }} />
              <span className="text-xs">Coopérative oléicole</span>
            </div>
          </div>
        </section>

        {/* ===== DROITE : formulaire ===== */}
        <section className="flex-1 flex items-center justify-center p-4 lg:p-12 min-h-[560px]" style={{ background: 'var(--color-paper)' }}>
          <div className="w-full entry animate-slide-up" style={{ maxWidth: '380px', margin: '0 auto' }}>
            <header className="entry-head flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-muted)] text-xs font-medium">Connexion</span>
                <span className="w-px h-4" style={{ background: 'var(--color-rule)' }} />
                <span className="text-[var(--color-muted)] text-xs font-mono">{heure}</span>
              </div>
              <span className="text-[var(--color-muted)] text-xs" style={{ fontFamily: 'var(--font-outlier)' }}>OliveConnect v1.0</span>
            </header>

            <div className="entry-body space-y-5">
              <h2 id="login-heading" className="text-xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-display)', lineHeight: 1.2, maxWidth: '24ch' }}>
                Accédez à votre espace
              </h2>

              {error && (
                <div className="text-sm text-center" role="alert" style={{ color: 'var(--color-error)', background: 'var(--color-error-soft)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-pill)' }}>
                  {error}
                </div>
              )}

              {mode === 'google' ? (
                <div className="space-y-4 mt-6">
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    OliveConnect utilise votre compte Google : aucun mot de passe à retenir.
                  </p>
                  <BoutonGoogle onJeton={gererJetonGoogle} texte="signin_with" largeur={320} />
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Première connexion ? Votre profil est créé à l’étape suivante, puis un
                    administrateur vous attribue un rôle.
                  </p>
                  <div className="pt-4 border-t text-center" style={{ borderColor: 'var(--color-rule)' }}>
                    <Link
                      to="/inscription"
                      className="text-sm font-medium underline underline-offset-4"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      Créer un compte
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6" noValidate>
                    <Input
                      label="Email"
                      type="email"
                      placeholder="votre@email.tn"
                      error={errors.email?.message}
                      {...register('email')}
                      autoComplete="email"
                    />

                    <div className="relative">
                      <Input
                        label="Mot de passe"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        error={errors.password?.message}
                        {...register('password')}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-[38px] p-1 rounded"
                        style={{ color: 'var(--color-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        aria-expanded={showPassword}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <Button type="submit" className="w-full btn--primary" loading={isLoading} style={{ minHeight: '48px' }}>
                      {isLoading ? 'Connexion…' : 'Se connecter'}
                    </Button>
                  </form>

                  <div className="pt-4 border-t" style={{ borderColor: 'var(--color-rule)' }}>
                    <p className="text-xs font-medium mb-3" style={{ color: 'var(--color-muted)' }}>
                      Comptes de démonstration
                    </p>
                    <div className="grid grid-cols-2 gap-2" style={{ fontFamily: 'var(--font-outlier)', fontSize: 'var(--text-xs)' }}>
                      <span className="chip" style={{ cursor: 'default' }}>agri@test.tn / agri</span>
                      <span className="chip" style={{ cursor: 'default' }}>collecte@test.tn / collecte</span>
                      <span className="chip" style={{ cursor: 'default' }}>chef@test.tn / chef</span>
                      <span className="chip" style={{ cursor: 'default' }}>logistique@test.tn / log</span>
                      <span className="chip" style={{ cursor: 'default' }}>pressoir@test.tn / press</span>
                      <span className="chip" style={{ cursor: 'default' }}>admin@test.tn / admin</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <footer className="entry-foot mt-6 flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              <span style={{ fontFamily: 'var(--font-outlier)' }}>Sfax, Tunisie</span>
              <span>Coopérative oléicole</span>
            </footer>
          </div>
        </section>
      </div>

      {/* Bandeau de contexte mobile, sous le formulaire */}
      <section className="lg:hidden py-6 px-4 border-t" style={{ borderColor: 'var(--color-rule)', background: 'var(--color-paper-2)' }}>
        <h2 className="text-xs font-medium mb-3" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-display)' }}>Ce que gère OliveConnect</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '124 vergers', detail: 'suivis en temps réel' },
            { label: '48 tournées', detail: 'planifiées ce mois' },
            { label: 'Alertes terrain', detail: 'géolocalisées' },
            { label: 'Pressoirs', detail: 'réception et capacité' },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg text-center" style={{ background: 'var(--color-paper-3)', border: '1px solid', borderColor: 'var(--color-rule)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--color-ink)' }}>{item.label}</p>
              <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
