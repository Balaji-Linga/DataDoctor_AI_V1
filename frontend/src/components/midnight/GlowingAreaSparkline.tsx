interface GlowingAreaSparklineProps {
  color?: string;
  fillColorStart?: string;
  fillColorEnd?: string;
  height?: number;
  className?: string;
}

export default function GlowingAreaSparkline({
  color = '#10b981',
  fillColorStart = 'rgba(16, 185, 129, 0.35)',
  fillColorEnd = 'rgba(16, 185, 129, 0.0)',
  height = 42,
  className = '',
}: GlowingAreaSparklineProps) {
  // Smooth cubic spline wave matching Card 3 in screenshot
  const pathD = 'M 0 32 Q 40 10, 80 28 T 160 16 T 240 22 T 300 12';
  const areaD = `${pathD} L 300 45 L 0 45 Z`;

  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height }}>
      <svg
        viewBox="0 0 300 45"
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="glowAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColorStart} />
            <stop offset="100%" stopColor={fillColorEnd} />
          </linearGradient>
          <filter id="waveGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Gradient Area Fill */}
        <path d={areaD} fill="url(#glowAreaGrad)" />

        {/* Glowing Edge Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#waveGlow)"
        />
      </svg>
    </div>
  );
}

