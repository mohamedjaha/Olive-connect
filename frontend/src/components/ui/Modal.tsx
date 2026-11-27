import { Fragment, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, description, children, size = 'md', showClose = true }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousActiveElement.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    const overlay = overlayRef.current;
    const content = contentRef.current;
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') trapFocus(e, content);
    };
    const handleOverlayClick = (e: MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    overlay?.addEventListener('click', handleOverlayClick);
    content?.focus();
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      overlay?.removeEventListener('click', handleOverlayClick);
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  const trapFocus = (e: globalThis.KeyboardEvent, container: HTMLElement | null) => {
    if (!container) return;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <Fragment>
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-desc' : undefined}
      >
        <div
          ref={contentRef}
          tabIndex={-1}
          className={`
            w-full ${sizeClasses[size]} entry animate-slide-up max-h-[90vh] overflow-y-auto
          `}
        >
          {(title || showClose) && (
            <div className="flex items-start justify-between p-6 border-b border-solid sticky top-0 entry-head z-10">
              <div>
                {title && <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>}
                {description && <p id="modal-desc" className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>{description}</p>}
              </div>
              {showClose && (
                <button
                  onClick={onClose}
                  className="btn btn--ghost p-1.5"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </Fragment>,
    document.body
  );
}