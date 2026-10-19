interface DotLineSparklineProps {
  color?: string;
  height?: number;
  className?: string;
}

export default function DotLineSparkline({
  color = '#818cf8',
  height = 42,
  className = '',
}: DotLineSparklineProps) {
  // Sample points matching the subtle dip and rise in Card 4 of screenshot
  const points: [number, number][] = [
    [0, 10],
    [30, 18],
    [65, 26],
    [100, 32],
    [140, 36],
    [180, 32],
    [220, 24],
    [260, 28],
    [300, 18],
  ];

  const polylineStr = points.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height }}>
      <svg
        viewBox="0 0 300 45"
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <filter id="dotLineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Connecting line */}
        <polyline
          points={polylineStr}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="3 3"
          opacity={0.8}
        />

        {/* Highlighted Nodes */}
        {points.map(([x, y], idx) => (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r={idx === points.length - 1 || idx === 0 ? 3.5 : 2.5}
            fill={color}
            filter="url(#dotLineGlow)"
          />
        ))}
      </svg>
    </div>
  );
}

