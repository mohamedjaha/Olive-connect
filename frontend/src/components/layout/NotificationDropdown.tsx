import { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Mock notifications - in real app, this would come from an API
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) {
    return (
      <button
        ref={buttonRef}
        className="btn btn--ghost p-2 relative"
        aria-label="Notifications"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium" 
                style={{ background: 'var(--color-error)', color: 'white' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        className="btn btn--ghost p-2 relative"
        aria-label="Notifications"
        onClick={toggleDropdown}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium" 
                style={{ background: 'var(--color-error)', color: 'white' }}>
            {notifications.filter(n => !n.read).length > 9 ? '9+' : notifications.filter(n => !n.read).length}
          </span>
        )}
      </button>

      <div
        ref={dropdownRef}
        className="absolute right-0 top-full mt-2 w-80 entry z-[100] animate-slide-down shadow-lg border border-solid"
        style={{ borderColor: 'var(--color-rule)' }}
        role="dialog"
        aria-label="Notifications"
      >
        <div className="flex items-center justify-between p-4 border-b border-solid" style={{ borderColor: 'var(--color-rule)' }}>
          <h3 className="font-medium" style={{ color: 'var(--color-ink)' }}>Notifications</h3>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.read) && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                Tout marquer lu
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="p-1">
              <X className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-muted)', opacity: 0.5 }}/>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Vous n’avez pas de notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-solid" style={{ borderColor: 'var(--color-rule)' }}>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-[var(--color-paper-3)] transition-colors"
                  style={{ background: notification.read ? 'transparent' : 'var(--color-accent-soft)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" 
                         style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
                      <Bell className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                        {notification.title}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                        {notification.message}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--color-muted)' }}>
                        {new Date(notification.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 text-xs"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Marquer lu
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}