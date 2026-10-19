interface DotMatrixGridProps {
  cols?: number;
  rows?: number;
  activeDensity?: number; // 0 to 1
  className?: string;
}

export default function DotMatrixGrid({
  cols = 20,
  rows = 4,
  activeDensity = 0.65,
  className = '',
}: DotMatrixGridProps) {
  return (
    <div className={`flex flex-col gap-1.5 py-1 select-none ${className}`}>
      {Array.from({ length: rows }).map((_, r) => {
        const rowThreshold = r / rows;
        return (
          <div key={r} className="flex items-center justify-between gap-1 w-full">
            {Array.from({ length: cols }).map((_, c) => {
              // Bottom rows have higher glow probability matching screenshot
              const isGlow = rowThreshold > (1 - activeDensity) && ((c + r * 2) % 3 !== 0 || r === rows - 1);
              const isCyan = (c + r) % 2 === 0;

              return (
                <span
                  key={c}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: '3.5px',
                    height: '3.5px',
                    backgroundColor: isGlow
                      ? isCyan
                        ? '#00f0ff'
                        : '#3b82f6'
                      : 'rgba(255, 255, 255, 0.18)',
                    boxShadow: isGlow
                      ? isCyan
                        ? '0 0 6px rgba(0, 240, 255, 0.7)'
                        : '0 0 6px rgba(59, 130, 246, 0.7)'
                      : 'none',
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

