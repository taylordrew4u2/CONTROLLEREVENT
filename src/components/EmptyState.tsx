interface EmptyStateProps {
  message: string;
  hint?: string;
}

export default function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">○</div>
      <p className="empty-state-msg">{message}</p>
      {hint && <p className="empty-state-hint">{hint}</p>}
    </div>
  );
}
