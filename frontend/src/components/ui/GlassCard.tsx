import type { FC, ReactNode, MouseEventHandler, KeyboardEvent } from 'react';

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  hoverEffect?: boolean;
}

/**
 * Reusable glassmorphism card container.
 * Features backdrop blur, subtle borders, and smooth hover state transitions.
 */
export const GlassCard: FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = true,
}) => {
  const isInteractive = Boolean(onClick);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      (onClick as unknown as () => void)();
    }
  };

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={`
        relative rounded-2xl p-6
        backdrop-blur-xl
        border transition-all duration-300 ease-out
        ${
          hoverEffect
            ? 'hover:border-[rgba(0,212,255,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_20px_rgba(0,212,255,0.08)] hover:-translate-y-0.5'
            : ''
        }
        ${isInteractive ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-[#00d4ff] focus-visible:outline-offset-2' : ''}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--bg-glass, rgba(15, 17, 37, 0.7))',
        borderColor: 'var(--border-subtle, rgba(255, 255, 255, 0.06))',
      }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
