import type { InputHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helperText?: string;
}

/**
 * Case à cocher avec libellé, aide et erreur — même contrat que `Input` et `Select`.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `checkbox-${generatedId}`;

    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-solid"
          style={{ accentColor: 'var(--color-accent)', borderColor: 'var(--color-rule)' }}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        <div>
          <label
            htmlFor={inputId}
            className="text-sm font-medium cursor-pointer"
            style={{ color: 'var(--color-ink)' }}
          >
            {label}
          </label>
          {error && (
            <p
              id={`${inputId}-error`}
              className="mt-1 text-sm"
              style={{ color: 'var(--color-error)' }}
              role="alert"
            >
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={`${inputId}-helper`} className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
              {helperText}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';
