type RiskLevel = 'basso' | 'medio' | 'alto';

const CONFIG: Record<RiskLevel, { label: string; bg: string; color: string }> = {
  basso: {
    label: 'Rischio Basso',
    bg: 'var(--color-accent-100)',
    color: 'var(--color-accent-dark)',
  },
  medio: {
    label: 'Rischio Medio',
    bg: 'var(--color-warning-100)',
    color: 'var(--color-warning)',
  },
  alto: {
    label: 'Rischio Alto',
    bg: 'var(--color-danger-100)',
    color: 'var(--color-danger)',
  },
};

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

export function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const config = CONFIG[level];
  return (
    <span
      className="badge"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        fontSize: size === 'sm' ? '0.6875rem' : undefined,
      }}
    >
      {config.label}
    </span>
  );
}
