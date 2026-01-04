/**
 * Split-screen score display for 2-player Pacman.
 * Shows P1 score on left, P2 score on right, with lives and level in center.
 */

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
        <div className="score-display__score">{player2Score.toLocaleString()}</div>
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
