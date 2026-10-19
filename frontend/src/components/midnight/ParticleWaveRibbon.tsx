import { useEffect, useRef } from 'react';

interface ParticleWaveRibbonProps {
  height?: number;
  className?: string;
}

export default function ParticleWaveRibbon({ height = 54, className = '' }: ParticleWaveRibbonProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = height);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      h = canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    const cols = 55;
    const rows = 9;
    let step = 0;

    const render = () => {
      step += 0.035;
      ctx.clearRect(0, 0, width, h);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const u = c / (cols - 1);
          const v = (r - rows / 2) / (rows / 2);

          const x = u * width;
          // Sine wave formula creating the twisted ribbon effect
          const wave1 = Math.sin(u * 5 - step + r * 0.25) * (h * 0.28);
          const wave2 = Math.cos(u * 3 + step * 0.8 + r * 0.15) * (h * 0.12);
          const y = h * 0.55 + wave1 + wave2 + v * (h * 0.18);

          // Alpha & Size
          const depthAlpha = 0.25 + 0.7 * (1 - Math.abs(v));
          const size = 1.2 + 0.8 * (1 - Math.abs(v));

          // Color: Electric Blue (#2563eb) to Cyan (#00f0ff) gradient along ribbon
          const colorRatio = (u + Math.sin(step * 0.5) * 0.2 + 0.2);
          const isCyan = colorRatio > 0.5;

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = isCyan
            ? `rgba(0, 240, 255, ${depthAlpha * 0.85})`
            : `rgba(37, 99, 235, ${depthAlpha * 0.95})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = isCyan ? 'rgba(0, 240, 255, 0.4)' : 'rgba(37, 99, 235, 0.5)';
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [height]);

  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

