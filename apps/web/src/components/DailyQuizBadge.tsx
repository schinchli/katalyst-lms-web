interface Props {
  label: string;
  completed: boolean;
  compact?: boolean;
}

export function DailyQuizBadge({ label, completed, compact = true }: Props) {
  if (compact) {
    return (
      <span
        className="dc-chip"
        style={{
          background: completed ? 'rgba(81, 207, 102, 0.16)' : 'rgba(255, 216, 77, 0.16)',
          color: completed ? 'var(--platform-success-accent)' : '#ffd84d',
        }}
      >
        {completed ? `✓ ${label} Complete` : label}
      </span>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderRadius: 999,
        background: completed ? 'rgba(81, 207, 102, 0.16)' : 'rgba(255, 216, 77, 0.16)',
        color: completed ? 'var(--platform-success-accent)' : '#ffd84d',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {completed ? `✓ ${label} Complete` : `${label} — Ready today`}
    </div>
  );
}
