import { useState, useEffect, useCallback, useRef } from 'react';

// Minimum distance (in pixels) for a swipe to be recognized
const SWIPE_THRESHOLD = 30;
// Maximum time (in ms) for a swipe gesture
const SWIPE_TIMEOUT = 300;

/**
 * Custom hook for touch-based game controls
 * Supports both swipe gestures and virtual D-pad input
 *
 * @param {Object} options
 * @param {React.RefObject} options.containerRef - Reference to the touch target element
 * @param {boolean} options.enabled - Whether touch controls are active
 * @returns {Object} Touch control state and handlers
 */
export function useTouchControls({ containerRef, enabled = true }) {
  const [direction, setDirection] = useState(null);
  const [isTouching, setIsTouching] = useState(false);

  // Touch tracking refs
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const lastDirectionRef = useRef(null);

  // Handle swipe gesture detection
  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsTouching(true);
  }, [enabled]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || !isTouching) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const timeDelta = Date.now() - touchStartRef.current.time;

    // Only process if within timeout and exceeds threshold
    if (timeDelta > SWIPE_TIMEOUT) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Check if movement exceeds threshold
    if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD) {
      let newDirection;

      // Determine direction based on dominant axis
      if (absX > absY) {
        newDirection = deltaX > 0 ? 'right' : 'left';
      } else {
        newDirection = deltaY > 0 ? 'down' : 'up';
      }

      // Only update if direction changed
      if (newDirection !== lastDirectionRef.current) {
        lastDirectionRef.current = newDirection;
        setDirection(newDirection);
      }

      // Prevent page scrolling during swipe
      e.preventDefault();
    }
  }, [enabled, isTouching]);

  const handleTouchEnd = useCallback(() => {
    setIsTouching(false);
    // Keep the last direction active until a new one is set
    // This allows for continuous movement after swipe
  }, []);

  // D-pad button handlers
  const handleDpadPress = useCallback((dir) => {
    if (!enabled) return;
    lastDirectionRef.current = dir;
    setDirection(dir);
  }, [enabled]);

  const handleDpadRelease = useCallback(() => {
    // Keep direction active for smooth gameplay
    // Direction is only cleared when new direction is set
  }, []);

  // Clear direction (useful for menu screens)
  const clearDirection = useCallback(() => {
    setDirection(null);
    lastDirectionRef.current = null;
  }, []);

  // Attach touch events to container
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || !enabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [containerRef, enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    direction,
    isTouching,
    handleDpadPress,
    handleDpadRelease,
    clearDirection,
  };
}

/**
 * Detect if the device supports touch
 * @returns {boolean}
 */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Detect if the device is mobile based on screen size and touch support
 * @returns {boolean}
 */
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return isTouchDevice() && window.innerWidth <= 768;
}

export default useTouchControls;
