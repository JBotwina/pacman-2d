/**
 * Pause overlay component for Pac-Man game.
 * Displays pause message and options to resume or quit.
 */

export default function PauseOverlay({ onResume, onQuit, score }) {
  return (
    <div className="menu-overlay pause-overlay">
      <h2 className="pause-title">PAUSED</h2>

      <div className="pause-score">
        Current Score: <span className="score-value">{score}</span>
      </div>

      <div className="pause-buttons">
        <button className="menu-button resume-button" onClick={onResume}>
          RESUME
        </button>
        <button className="menu-button quit-button" onClick={onQuit}>
          QUIT
        </button>
      </div>

      <div className="pause-hint">Press ESC or ENTER to resume</div>
    </div>
  );
}
