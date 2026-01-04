/**
 * Pause overlay component for Pac-Man game.
 * Displays pause message and options to resume or quit.
 */

import { useGameStore } from '../store';

export default function PauseOverlay() {
  const score = useGameStore((state) => state.score);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const resetGame = useGameStore((state) => state.resetGame);

  return (
    <div className="menu-overlay pause-overlay">
      <h2 className="pause-title">PAUSED</h2>

      <div className="pause-score">
        Current Score: <span className="score-value">{score}</span>
      </div>

      <div className="pause-buttons">
        <button className="menu-button resume-button" onClick={resumeGame}>
          RESUME
        </button>
        <button className="menu-button quit-button" onClick={resetGame}>
          QUIT
        </button>
      </div>

      <div className="pause-hint">Press ESC or ENTER to resume</div>
    </div>
  );
}
