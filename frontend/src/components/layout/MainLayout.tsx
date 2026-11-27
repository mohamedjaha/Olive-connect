import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Home, MapPin, TreePine, AlertTriangle, Truck, Factory, Settings, User, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '@/auth/SessionContext';
import { NotificationDropdown } from './NotificationDropdown';

const navigation = [
  { name: 'Accueil', href: '/', icon: Home, public: true },
  { name: 'Vergers', href: '/vergers', icon: TreePine, roles: ['AGRICULTEUR', 'RESPONSABLE_COLLECTE'] },
  { name: 'Récoltes', href: '/recoltes', icon: TreePine, roles: ['AGRICULTEUR', 'RESPONSABLE_COLLECTE'] },
  { name: 'Alertes', href: '/alertes', icon: AlertTriangle, roles: ['AGRICULTEUR', 'RESPONSABLE_COLLECTE'] },
  { name: 'Tournées', href: '/tournees', icon: Truck, roles: ['RESPONSABLE_COLLECTE', 'CHEF_EQUIPE'] },
  { name: 'Carte', href: '/carte', icon: MapPin, public: true },
  { name: 'Ressources', href: '/ressources', icon: Truck, roles: ['RESPONSABLE_LOGISTIQUE'] },
  { name: 'Pressoirs', href: '/pressoirs', icon: Factory, roles: ['RESPONSABLE_PRESSOIR'] },
  { name: 'Administration', href: '/admin', icon: Settings, roles: ['ADMINISTRATEUR'] },
];

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useSession();

  const userRole = user?.roles[0] ?? '';
  const userName = user?.nom ?? 'Utilisateur';

  const filteredNav = navigation.filter(item =>
    item.public || (item.roles && item.roles.includes(userRole))
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-paper)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-solid" style={{ borderColor: 'var(--color-rule)', background: 'var(--color-paper-2)' }}>
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <Link to="/" className="flex items-center gap-2" aria-label="OliveConnect - Accueil">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
                <TreePine className="w-5 h-5" style={{ color: 'var(--color-accent-ink)' }} />
              </div>
              <span className="text-xl font-bold hidden sm:block" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', letterSpacing: 'var(--tracking-display)' }}>OliveConnect</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Navigation principale">
              {filteredNav.map(item => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)]'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                    }`
                  }
                >
                  <span className="flex items-center gap-1.5">
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </span>
                </NavLink>
              ))}
            </nav>

            {/* Right side: notifications, user menu, mobile menu button */}
            <div className="flex items-center gap-3">
              <NotificationDropdown />

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="btn btn--ghost flex items-center gap-2"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-green-soft)', color: 'var(--color-green)' }}>
                    <User className="w-5 h-5" />
                  </div>
                  <span className="hidden md:block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{userName}</span>
                  <ChevronDown className="w-4 h-4 hidden md:block" style={{ color: 'var(--color-muted)' }} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 entry z-20">
                      <div className="px-4 py-2 border-b border-solid">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{userName}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{userRole.toLowerCase().replace('_', ' ')}</p>
                      </div>
                      <Link
                        to="/profil"
                        className="block px-4 py-2 text-sm hover:bg-[var(--color-paper-3)] transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                        style={{ color: 'var(--color-ink)' }}
                      >
                        Mon profil
                      </Link>
                      <Link
                        to="/aide"
                        className="block px-4 py-2 text-sm hover:bg-[var(--color-paper-3)] transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                        style={{ color: 'var(--color-ink)' }}
                      >
                        Aide
                      </Link>
                      <hr className="my-1 border-solid" style={{ borderColor: 'var(--color-rule)' }} />
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-paper-3)] transition-colors flex items-center gap-2"
                        onClick={handleLogout}
                        style={{ color: 'var(--color-error)' }}
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="btn btn--ghost p-2 md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div id="mobile-menu" className="md:hidden py-4 border-t border-solid animate-slide-down" style={{ borderColor: 'var(--color-rule)' }}>
              <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
                {filteredNav.map(item => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-ink)]'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                      }`
                    }
                  >
                    <span className="flex items-center gap-2">
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </span>
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full py-6">
        <div className="container">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-solid py-4" style={{ borderColor: 'var(--color-rule)', background: 'var(--color-paper-2)' }}>
        <div className="container text-center text-sm" style={{ color: 'var(--color-muted)' }}>
          OliveConnect : Coopérative oléicole de Sfax
        </div>
      </footer>
    </div>
  );
}