/**
 * Level complete screen component for Pac-Man game.
 * Displays level completion message and score.
 */

import { useGameStore } from '../store';

export default function LevelCompleteScreen() {
  const score = useGameStore((state) => state.score);
  const level = useGameStore((state) => state.level);
  const resetGame = useGameStore((state) => state.resetGame);

  return (
    <div className="menu-overlay level-complete-screen">
      <h2 className="level-complete-title">LEVEL {level} COMPLETE!</h2>

      <div className="level-stats">
        <div className="stat-row">
          <span className="stat-label">SCORE</span>
          <span className="stat-value score-value">{score}</span>
        </div>
      </div>

      <button className="menu-button next-level-button" onClick={resetGame}>
        NEXT LEVEL
      </button>

      <div className="level-complete-hint">Press ENTER to continue</div>
    </div>
  );
}
