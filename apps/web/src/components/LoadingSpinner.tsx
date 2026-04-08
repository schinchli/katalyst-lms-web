interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

/**
 * Vuexy-standard loading spinner.
 * Uses CSS classes from globals.css: .spinner, .spinner-sm, .spinner-lg, .page-loading
 */
export default function LoadingSpinner({ size = 'md', label = 'Loading…', className }: LoadingSpinnerProps) {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : '';
  return (
    <div className={`page-loading ${className ?? ''}`} role="status" aria-label={label}>
      <div className={`spinner ${sizeClass}`} aria-hidden="true" />
      {label && <span className="u-caption">{label}</span>}
    </div>
  );
}
