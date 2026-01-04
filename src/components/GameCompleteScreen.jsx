/**
 * Game complete screen component for Pac-Man game.
 * Displayed when player beats all levels (congratulations screen).
 */

import { useGameStore } from '../store';

export default function GameCompleteScreen() {
  const score = useGameStore((state) => state.score);
  const highScore = useGameStore((state) => state.highScore);
  const resetGame = useGameStore((state) => state.resetGame);

  return (
    <div className="menu-overlay game-complete-screen">
      <h2 className="game-complete-title">CONGRATULATIONS!</h2>
      <h3 className="game-complete-subtitle">GAME COMPLETE</h3>

      <div className="final-stats">
        <div className="stat-row">
          <span className="stat-label">FINAL SCORE</span>
          <span className="stat-value score-value">{score}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">HIGH SCORE</span>
          <span className="stat-value high-score-value">{highScore}</span>
        </div>
      </div>

      <button className="menu-button play-again-button" onClick={resetGame}>
        PLAY AGAIN
      </button>

      <div className="game-complete-hint">Press ENTER to play again</div>
    </div>
  );
}
