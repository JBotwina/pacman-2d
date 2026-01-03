import { useEffect, useRef } from 'react';

/**
 * Custom hook for running a game loop with requestAnimationFrame.
 * Provides smooth 60fps updates with delta time for frame-independent logic.
 *
 * @param {function} onUpdate - Callback called each frame with (deltaTime, timestamp)
 * @param {boolean} isRunning - Whether the game loop should be active
 */
export function useGameLoop(onUpdate, isRunning = true) {
  const requestRef = useRef(null);
  const previousTimeRef = useRef(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep callback ref updated to avoid stale closures
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    previousTimeRef.current = null;

    const animate = (timestamp) => {
      if (previousTimeRef.current === null) {
        previousTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - previousTimeRef.current;
      previousTimeRef.current = timestamp;

      // Call update with delta time (in ms) and raw timestamp
      onUpdateRef.current(deltaTime, timestamp);

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isRunning]);
}

export default useGameLoop;
