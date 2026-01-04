/**
 * Split-screen score display for 2-player Pacman.
 * Shows P1 score on left, P2 score on right, with lives and level in center.
 * Features animated score counter that ticks up when points are earned.
 */

import { useState, useEffect, useRef } from 'react';
import './ScoreDisplay.css';

/**
 * PacManLife - Small Pac-Man icon for lives display.
 * Uses SVG to render a classic Pac-Man shape with mouth.
 */
function PacManLife({ playerNumber }) {
  const className = playerNumber === 1
    ? 'score-display__life score-display__life--p1'
    : 'score-display__life score-display__life--p2';

  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
    >
      <path
        d="M 10 10 L 18 5 A 10 10 0 1 0 18 15 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Custom hook that animates a score value, ticking up toward the target.
 * Uses requestAnimationFrame for smooth animation that ticks up when points are earned.
 * @param {number} targetScore - The actual score to animate toward
 * @returns {{ displayedScore: number, isAnimating: boolean }}
 */
function useAnimatedScore(targetScore) {
  const [displayedScore, setDisplayedScore] = useState(targetScore);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Derive isAnimating from comparing displayed to target
  const isAnimating = displayedScore < targetScore;

  useEffect(() => {
    // Handle reset case - if target went down (new game), snap to it
    if (targetScore < displayedScore) {
      // Use callback form to avoid lint warning about sync setState
      const timeoutId = setTimeout(() => setDisplayedScore(targetScore), 0);
      return () => clearTimeout(timeoutId);
    }

    // If displayed matches target, nothing to animate
    if (displayedScore >= targetScore) {
      return;
    }

    const animate = (currentTime) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      setDisplayedScore((current) => {
        if (current >= targetScore) {
          return targetScore;
        }

        // Calculate increment based on difference - faster for larger gaps
        // Base rate: ~50 points per 16ms (60fps), scales up with difference
        const difference = targetScore - current;
        const baseRate = 50;
        const scaleFactor = Math.max(1, Math.floor(difference / 100));
        const increment = Math.ceil(baseRate * scaleFactor * (deltaTime / 16));

        const newScore = Math.min(current + increment, targetScore);
        return newScore;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [targetScore, displayedScore]);

  return { displayedScore, isAnimating };
}

function ScoreDisplay({ gameState }) {
  const {
    score,
    lives,
    player2Score,
    player2Lives,
    level,
  } = gameState;

  const { displayedScore: p1DisplayedScore, isAnimating: p1Animating } = useAnimatedScore(score);
  const { displayedScore: p2DisplayedScore, isAnimating: p2Animating } = useAnimatedScore(player2Score);

  return (
    <div className="score-display">
      <div className="score-display__player score-display__player--p1">
        <div className="score-display__label">P1</div>
        <div className={`score-display__score ${p1Animating ? 'score-display__score--animating' : ''}`}>
          {p1DisplayedScore.toLocaleString()}
        </div>
        <div className="score-display__lives">
          {Array.from({ length: lives }, (_, i) => (
            <PacManLife key={i} playerNumber={1} />
          ))}
        </div>
      </div>

      <div className="score-display__center">
        <div className="score-display__level-label">LEVEL</div>
        <div className="score-display__level">{level}</div>
      </div>

      <div className="score-display__player score-display__player--p2">
        <div className="score-display__label">P2</div>
        <div className={`score-display__score ${p2Animating ? 'score-display__score--animating' : ''}`}>
          {p2DisplayedScore.toLocaleString()}
        </div>
        <div className="score-display__lives">
          {Array.from({ length: player2Lives }, (_, i) => (
            <PacManLife key={i} playerNumber={2} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScoreDisplay;
