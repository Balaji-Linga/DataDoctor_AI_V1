import { AlertTriangle, AlertCircle, Info, Sparkles, Hash } from 'lucide-react';
import type { QualityIssue } from '../../types/dataset';

interface QualityIssueCardProps {
  issue: QualityIssue;
  className?: string;
}

export default function QualityIssueCard({ issue, className = '' }: QualityIssueCardProps) {
  const severityConfig = {
    high: {
      color: '#ef4444',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      bg: 'rgba(239, 68, 68, 0.05)',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      badgeText: '#fca5a5',
      label: 'HIGH',
      icon: AlertTriangle,
      iconColor: 'text-red-400',
    },
    medium: {
      color: '#f59e0b',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      bg: 'rgba(245, 158, 11, 0.05)',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeText: '#fcd34d',
      label: 'MEDIUM',
      icon: AlertCircle,
      iconColor: 'text-amber-400',
    },
    low: {
      color: '#3b82f6',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      bg: 'rgba(59, 130, 246, 0.05)',
      badgeBg: 'rgba(59, 130, 246, 0.15)',
      badgeText: '#93c5fd',
      label: 'LOW',
      icon: Info,
      iconColor: 'text-blue-400',
    },
  };

  const config = severityConfig[issue.severity] || severityConfig.low;
  const IconComponent = config.icon;

  const formattedType = issue.type
    ? issue.type
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'Unknown Issue';

  return (
    <div
      className={`rounded-xl p-4 transition-all duration-200 backdrop-blur-md border ${className}`}
      style={{
        background: config.bg,
        borderColor: config.borderColor,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className="p-1.5 rounded-lg shrink-0 mt-0.5"
            style={{ background: config.badgeBg }}
          >
            <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className="font-semibold text-sm tracking-tight truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {formattedType}
              </h4>

              {issue.column ? (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md border"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--accent-cyan)',
                  }}
                >
                  <Hash className="w-3 h-3 opacity-60" />
                  {issue.column}
                </span>
              ) : (
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded-md border"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Entire Dataset
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-8 sm:pl-0">
          {typeof issue.count === 'number' && (
            <span
              className="text-xs font-mono font-medium px-2 py-0.5 rounded border"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {issue.count.toLocaleString()} {issue.count === 1 ? 'row' : 'rows'}
              {issue.percentage !== undefined && (
                <span className="ml-1 opacity-70">
                  ({issue.percentage.toFixed(1)}%)
                </span>
              )}
            </span>
          )}

          <span
            className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase"
            style={{
              background: config.badgeBg,
              color: config.badgeText,
            }}
          >
            {config.label}
          </span>
        </div>
      </div>

      <p
        className="text-xs sm:text-sm leading-relaxed pl-8"
        style={{ color: 'var(--text-secondary)' }}
      >
        {issue.message}
      </p>

      {issue.recommendation && (
        <div
          className="mt-3 ml-8 p-2.5 rounded-lg border flex items-start gap-2 text-xs"
          style={{
            background: 'rgba(15, 17, 37, 0.8)',
            borderColor: 'rgba(0, 212, 255, 0.15)',
          }}
        >
          <Sparkles
            className="w-3.5 h-3.5 shrink-0 mt-0.5"
            style={{ color: 'var(--accent-cyan)' }}
          />
          <div className="leading-relaxed">
            <span
              className="font-semibold uppercase tracking-wider text-[10px] block mb-0.5"
              style={{ color: 'var(--accent-cyan)' }}
            >
              Recommendation
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              {issue.recommendation}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
