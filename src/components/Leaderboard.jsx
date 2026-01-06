/**
 * Leaderboard display component showing top 10 high scores.
 */

import { getLeaderboard, formatDate } from '../utils/leaderboard';

export default function Leaderboard({ highlightRank = -1 }) {
  const entries = getLeaderboard();

  if (entries.length === 0) {
    return (
      <div className="leaderboard">
        <h3 className="leaderboard-title">HIGH SCORES</h3>
        <p className="leaderboard-empty">No scores yet!</p>
        <p className="leaderboard-empty-hint">Be the first to set a high score!</p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">HIGH SCORES</h3>

      <div className="leaderboard-header">
        <span className="lb-rank">RNK</span>
        <span className="lb-initials">NAME</span>
        <span className="lb-score">SCORE</span>
        <span className="lb-level">LVL</span>
      </div>

      <div className="leaderboard-entries">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const isHighlighted = rank === highlightRank;

          return (
            <div
              key={`${entry.initials}-${entry.date}-${index}`}
              className={`leaderboard-entry ${isHighlighted ? 'highlighted' : ''} ${rank <= 3 ? `top-${rank}` : ''}`}
            >
              <span className="lb-rank">{rank}</span>
              <span className="lb-initials">{entry.initials}</span>
              <span className="lb-score">{entry.score.toLocaleString()}</span>
              <span className="lb-level">{entry.level}</span>
            </div>
          );
        })}
      </div>

      {entries.length > 0 && (
        <div className="leaderboard-footer">
          <span className="lb-date">Latest: {formatDate(entries[0]?.date)}</span>
        </div>
      )}
    </div>
  );
}
