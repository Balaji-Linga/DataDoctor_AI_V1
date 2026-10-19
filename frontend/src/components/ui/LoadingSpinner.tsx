import type { FC } from 'react';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Centered loading spinner with rotating cyan ring and optional status text.
 */
export const LoadingSpinner: FC<LoadingSpinnerProps> = ({
  message,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const glowSizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-6 gap-4 text-center ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Ambient cyan glow */}
        <div
          className={`absolute rounded-full blur-md opacity-35 pointer-events-none ${glowSizeMap[size]}`}
          style={{ backgroundColor: 'var(--accent-cyan, #00d4ff)' }}
        />

        {/* Spinning ring */}
        <div
          className={`${sizeMap[size]} rounded-full animate-spin`}
          style={{
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderTopColor: 'var(--accent-cyan, #00d4ff)',
            borderRightColor: 'var(--accent-cyan, #00d4ff)',
          }}
        />
      </div>

      {message && (
        <p
          className="text-sm font-medium tracking-wide animate-pulse"
          style={{ color: 'var(--text-secondary, #6b7280)' }}
        >
          {message}
        </p>
      )}

      <span className="sr-only">{message || 'Loading...'}</span>
    </div>
  );
};

export default LoadingSpinner;
