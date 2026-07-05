export default function LoadingSpinner({ label = 'Chargement' }: { label?: string }) {
  return (
    <span className="loading-state" role="status" aria-live="polite">
      <span className="loader-ring" aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
