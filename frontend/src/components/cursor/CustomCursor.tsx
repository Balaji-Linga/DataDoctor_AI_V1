import { useEffect, useRef, useState, type FC } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const INTERACTIVE_SELECTOR =
  'button, a, [role="button"], input, select, textarea, canvas, [data-cursor-hover], label';

/**
 * Premium custom cursor for desktop experiences.
 * - Dot follows mouse immediately.
 * - Follower ring lerps with smooth easing.
 * - Scales when hovering over interactive elements.
 * - Automatically disabled on touch devices or if reduced motion is requested.
 */
export const CustomCursor: FC = () => {
  const reducedMotion = useReducedMotion();
  const [isTouchDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      'ontouchstart' in window
    );
  });

  const dotRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (reducedMotion || isTouchDevice || typeof window === 'undefined') {
      return;
    }

    const dotEl = dotRef.current;
    const followerEl = followerRef.current;
    if (!dotEl || !followerEl) return;

    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'none';

    let mouseX = -100;
    let mouseY = -100;
    let followerX = -100;
    let followerY = -100;
    let currentScale = 1;
    let targetScale = 1;
    let isVisible = false;
    let rafId: number;

    const setVisibility = (visible: boolean) => {
      const opacity = visible ? '1' : '0';
      dotEl.style.opacity = opacity;
      followerEl.style.opacity = opacity;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        followerX = mouseX;
        followerY = mouseY;
        setVisibility(true);
      }

      // Detect hover on interactive elements
      const target = e.target as Element | null;
      const isInteractive = Boolean(target?.closest(INTERACTIVE_SELECTOR));
      targetScale = isInteractive ? 1.6 : 1.0;

      // Update instant dot position
      dotEl.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0)`;
    };

    const handleMouseLeave = () => {
      isVisible = false;
      setVisibility(false);
    };

    const handleMouseEnter = () => {
      isVisible = true;
      setVisibility(true);
    };

    const renderLoop = () => {
      if (isVisible) {
        // Lerp follower position with 0.15 factor
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        currentScale += (targetScale - currentScale) * 0.15;

        followerEl.style.transform = `translate3d(${followerX - 18}px, ${followerY - 18}px, 0) scale(${currentScale.toFixed(3)})`;
      }

      rafId = requestAnimationFrame(renderLoop);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      document.body.style.cursor = originalCursor;
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [reducedMotion, isTouchDevice]);

  if (reducedMotion || isTouchDevice) {
    return null;
  }

  return (
    <>
      {/* 6px cyan instant dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-[99999] rounded-full transition-opacity duration-150"
        style={{
          width: '6px',
          height: '6px',
          backgroundColor: 'var(--accent-cyan, #00d4ff)',
          boxShadow: '0 0 8px var(--accent-cyan, #00d4ff)',
          opacity: 0,
          willChange: 'transform',
        }}
      />

      {/* 36px follower ring */}
      <div
        ref={followerRef}
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-[99998] rounded-full transition-opacity duration-200"
        style={{
          width: '36px',
          height: '36px',
          border: '1.5px solid var(--accent-cyan, #00d4ff)',
          backgroundColor: 'transparent',
          boxShadow: '0 0 14px rgba(0, 212, 255, 0.18)',
          opacity: 0,
          willChange: 'transform',
        }}
      />
    </>
  );
};

export default CustomCursor;
