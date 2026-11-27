import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-') || `select-${Math.random().toString(36).slice(2)}`;
    return (
      <div className={`field ${className}`}>
        <select
          ref={ref}
          id={selectId}
          className={`${error ? 'border-red-500' : ''}`}
          style={{ textAlign: 'left', height: '100%', padding: '0 0.75rem', boxSizing: 'border-box' }}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {label && <label htmlFor={selectId}>{label}</label>}
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm" style={{ color: 'var(--color-error)' }} role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="mt-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';