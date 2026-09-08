import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

export function Field({
  label,
  error,
  hint,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        {...input}
        id={id}
        aria-invalid={!!error}
        aria-describedby={
          [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
        }
      />
      {hint && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  )
}
