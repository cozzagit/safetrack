import { CheckCircle2 } from 'lucide-react';

interface DeadlineStatusBadgeProps {
  dueDate: string;
  completedDate?: string | null;
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function DeadlineStatusBadge({ dueDate, completedDate }: DeadlineStatusBadgeProps) {
  if (completedDate) {
    return (
      <span
        className="badge inline-flex items-center gap-1"
        style={{
          backgroundColor: 'var(--color-accent-100)',
          color: 'var(--color-accent-dark)',
        }}
      >
        <CheckCircle2 className="w-3 h-3" />
        Completata
      </span>
    );
  }

  const days = getDaysUntil(dueDate);

  if (days < 0) {
    return (
      <span
        className="badge"
        style={{
          backgroundColor: 'var(--color-danger-100)',
          color: 'var(--color-danger)',
        }}
      >
        Scaduta ({Math.abs(days)}gg fa)
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span
        className="badge"
        style={{
          backgroundColor: '#fff3e0',
          color: '#e65100',
        }}
      >
        Urgente ({days}gg)
      </span>
    );
  }

  if (days <= 30) {
    return (
      <span
        className="badge"
        style={{
          backgroundColor: 'var(--color-warning-100)',
          color: 'var(--color-warning)',
        }}
      >
        In scadenza ({days}gg)
      </span>
    );
  }

  return (
    <span
      className="badge"
      style={{
        backgroundColor: 'var(--color-accent-100)',
        color: 'var(--color-accent-dark)',
      }}
    >
      In regola ({days}gg)
    </span>
  );
}
