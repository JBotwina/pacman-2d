/**
 * Game over screen component for Pac-Man game.
 * Displays final score and options to play again.
 */

import { useGameStore } from '../store';

export default function GameOverScreen() {
  const score = useGameStore((state) => state.score);
  const level = useGameStore((state) => state.level);
  const resetGame = useGameStore((state) => state.resetGame);

  return (
    <div className="menu-overlay game-over-screen">
      <h2 className="game-over-title">GAME OVER</h2>

      <div className="final-stats">
        <div className="stat-row">
          <span className="stat-label">FINAL SCORE</span>
          <span className="stat-value score-value">{score}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">LEVEL REACHED</span>
          <span className="stat-value">{level}</span>
        </div>
      </div>

      <button className="menu-button restart-button" onClick={resetGame}>
        PLAY AGAIN
      </button>

      <div className="game-over-hint">Press ENTER to play again</div>
    </div>
  );
}
