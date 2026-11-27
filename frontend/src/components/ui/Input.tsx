import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, type = 'text', placeholder, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || `input-${Math.random().toString(36).slice(2)}`;
    return (
      <div className={`field ${className}`}>
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder || ' '}
          className={error ? 'border-red-500' : ''}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {label && <label htmlFor={inputId}>{label}</label>}
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm" style={{ color: 'var(--color-error)' }} role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, placeholder, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || `textarea-${Math.random().toString(36).slice(2)}`;
    return (
      <div className={`field ${className}`}>
        <textarea
          ref={ref}
          id={inputId}
          placeholder={placeholder || ' '}
          className={error ? 'border-red-500' : ''}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {label && <label htmlFor={inputId}>{label}</label>}
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm" style={{ color: 'var(--color-error)' }} role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';