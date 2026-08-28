import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useMouseTrack, type MouseTrackOptions } from '@/hooks/useMouseTrack';

export type MouseTrackCardProps = MouseTrackOptions & {
  children: ReactNode;
  className?: string;
  /** Show a radial glow highlight that follows the cursor. Defaults to true. */
  glow?: boolean;
  onClick?: () => void;
};

/**
 * Frosted-glass card with mouse-tracking 3D tilt + radial glow.
 *
 * - Tilt is driven by spring-smoothed MotionValues for a fluid, weighty feel.
 * - Glow is a radial-gradient overlay positioned via CSS variables (`--mx`/`--my`)
 *   and fades in/out with `isHovered` — no fragile `group-hover` dependency.
 * - The glow layer is `pointer-events-none` so it never blocks clicks.
 */
export function MouseTrackCard({
  children,
  className = '',
  glow = true,
  tilt = true,
  maxTilt = 6,
  stiffness = 300,
  damping = 30,
  onClick,
}: MouseTrackCardProps) {
  const { ref, isHovered, rotateX, rotateY, handlers } = useMouseTrack({ tilt, maxTilt, stiffness, damping });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handlers.onMouseMove}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      onClick={onClick}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      className={`glass glass-hover rounded-2xl relative overflow-hidden ${className}`}
    >
      {glow && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(400px circle at var(--mx,50%) var(--my,50%), var(--accent-soft), transparent 50%)',
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}
