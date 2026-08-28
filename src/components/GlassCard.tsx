import { type ReactNode } from 'react';
import { MouseTrackCard, type MouseTrackCardProps } from '@/components/MouseTrackCard';

export type GlassCardProps = {
  children: ReactNode;
  className?: string;
  /** Enable 3D tilt toward the mouse pointer. */
  tilt?: boolean;
  /** Enable a radial light glow that follows the mouse. */
  glow?: boolean;
  onClick?: () => void;
};

/**
 * Frosted-glass card with optional mouse-tracking tilt + radial glow.
 * Delegates to MouseTrackCard (built on the useMouseTrack hook) so every card
 * in the app shares the same spring-smoothed motion + glow behavior.
 */
export function GlassCard({ children, className, tilt = false, glow = false, onClick }: GlassCardProps) {
  const props: MouseTrackCardProps = { children, className, tilt, glow, onClick };
  return <MouseTrackCard {...props} />;
}
