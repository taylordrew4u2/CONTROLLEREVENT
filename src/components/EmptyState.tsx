interface EmptyStateProps {
  message: string;
  hint?: string;
}

export default function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state-msg">{message}</p>
      {hint && <p className="empty-state-hint">{hint}</p>}
    </div>
  );
}
