'use client';

import React, { forwardRef } from 'react';

/**
 * Componentes globais de formulário. Todos usam a classe `.field-control`
 * (definida em src/styles/tailwind.css), o mesmo visual aplicado automaticamente
 * a qualquer <input>/<select>/<textarea> do sistema.
 */

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/* ---------- Field: rótulo + dica + erro ---------- */
interface FieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}
export function Field({ label, required, hint, error, className, children }: FieldProps) {
  return (
    <div className={cx('min-w-0', className)}>
      {label && (
        <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted block mb-2">
          {label}{required && ' *'}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] text-red-600 mt-1.5">{error}</p>
      ) : hint ? (
        <p className="text-[10px] text-muted mt-1.5">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---------- Input (com prefixo/sufixo opcionais) ---------- */
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: React.ReactNode;   // ex.: "R$"
  suffix?: React.ReactNode;   // ex.: "kg" ou um ícone
  invalid?: boolean;
  wrapperClassName?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { prefix, suffix, invalid, className, wrapperClassName, ...props }, ref
) {
  if (!prefix && !suffix) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cx('field-control w-full', className)} {...props} />;
  }
  return (
    <div className={cx('relative w-full', wrapperClassName)}>
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-bold pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx('field-control w-full', className)}
        style={{ paddingLeft: prefix ? '2.75rem' : undefined, paddingRight: suffix ? '2.75rem' : undefined, ...props.style }}
        {...props}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
});

/* ---------- Select ---------- */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, children, ...props }, ref
) {
  return (
    <select ref={ref} aria-invalid={invalid || undefined} className={cx('field-control w-full', className)} {...props}>
      {children}
    </select>
  );
});

/* ---------- Textarea ---------- */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, ...props }, ref
) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cx('field-control w-full', className)} {...props} />;
});
