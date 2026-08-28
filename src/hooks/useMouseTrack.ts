import { useCallback, useRef, useState, type MouseEvent } from 'react';
import { useSpring } from 'framer-motion';

export type MouseTrackOptions = {
  /** Enable 3D tilt toward the mouse pointer. */
  tilt?: boolean;
  /** Maximum tilt angle in degrees. */
  maxTilt?: number;
  /** Spring stiffness for the tilt animation. */
  stiffness?: number;
  /** Spring damping for the tilt animation. */
  damping?: number;
};

export type MouseTrackResult = {
  ref: React.RefObject<HTMLDivElement>;
  isHovered: boolean;
  /** Spring-smoothed rotation around the X axis (degrees). */
  rotateX: ReturnType<typeof useSpring>;
  /** Spring-smoothed rotation around the Y axis (degrees). */
  rotateY: ReturnType<typeof useSpring>;
  handlers: {
    onMouseMove: (e: MouseEvent<HTMLDivElement>) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
};

/**
 * Tracks the mouse position relative to an element and produces:
 * - CSS variables `--mx` / `--my` (percentage 0–100) for a radial glow overlay.
 * - Spring-smoothed `rotateX` / `rotateY` MotionValues for a 3D tilt effect.
 *
 * Mouse-move updates write CSS variables directly to the DOM node (no React
 * re-render per frame). Only `isHovered` toggles state, so the component
 * re-renders just twice — on enter and on leave.
 */
export function useMouseTrack({
  tilt = true,
  maxTilt = 6,
  stiffness = 300,
  damping = 30,
}: MouseTrackOptions = {}): MouseTrackResult {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useSpring(0, { stiffness, damping });
  const rotateY = useSpring(0, { stiffness, damping });

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;

      el.style.setProperty('--mx', `${px}%`);
      el.style.setProperty('--my', `${py}%`);

      if (tilt) {
        rotateX.set(((y / rect.height) - 0.5) * -maxTilt);
        rotateY.set(((x / rect.width) - 0.5) * maxTilt);
      }
    },
    [tilt, maxTilt, rotateX, rotateY],
  );

  const onMouseEnter = useCallback(() => setIsHovered(true), []);

  const onMouseLeave = useCallback(() => {
    setIsHovered(false);
    const el = ref.current;
    if (el) {
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '50%');
    }
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return { ref, isHovered, rotateX, rotateY, handlers: { onMouseMove, onMouseEnter, onMouseLeave } };
}
