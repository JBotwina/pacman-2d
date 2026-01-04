/**
 * Split-screen score display for 2-player Pacman.
 * Shows P1 score on left, P2 score on right, with lives and level in center.
 */

import './ScoreDisplay.css';

function ScoreDisplay({ gameState }) {
  const {
    score,
    lives,
    player2Score,
    player2Lives,
    level,
  } = gameState;

  return (
    <div className="score-display">
      <div className="score-display__player score-display__player--p1">
        <div className="score-display__label">P1</div>
        <div className="score-display__score">{score.toLocaleString()}</div>
        <div className="score-display__lives">
          {Array.from({ length: lives }, (_, i) => (
            <span key={i} className="score-display__life score-display__life--p1">●</span>
          ))}
        </div>
      </div>

      <div className="score-display__center">
        <div className="score-display__level-label">LEVEL</div>
        <div className="score-display__level">{level}</div>
      </div>

      <div className="score-display__player score-display__player--p2">
        <div className="score-display__label">P2</div>
        <div className="score-display__score">{player2Score.toLocaleString()}</div>
        <div className="score-display__lives">
          {Array.from({ length: player2Lives }, (_, i) => (
            <span key={i} className="score-display__life score-display__life--p2">●</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScoreDisplay;
