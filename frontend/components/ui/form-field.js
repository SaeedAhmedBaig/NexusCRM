export function FormField({ label, error, children, hint, required }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </span>
      {children}
      {hint && !error && <span className="text-meta">{hint}</span>}
      {error && (
        <span className="text-xs font-medium text-danger" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export const inputClass = 'input-base';

export const inputErrorClass = 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_var(--danger-light)]';
