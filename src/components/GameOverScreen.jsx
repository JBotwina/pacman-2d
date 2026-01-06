/**
 * Game over screen component for Pac-Man game.
 * Displays final score, handles high score entry, and shows leaderboard.
 */

import { useState, useCallback } from 'react';
import { useGameStore } from '../store';
import { isHighScore, saveScore } from '../utils/leaderboard';
import InitialsInput from './InitialsInput';
import Leaderboard from './Leaderboard';

// Screen states for the game over flow
const GameOverState = {
  CHECKING: 'checking',      // Initial check for high score
  ENTERING_INITIALS: 'entering', // Player entering initials
  SHOWING_RESULT: 'result',  // Showing where they placed
  SHOWING_LEADERBOARD: 'leaderboard', // Showing full leaderboard
};

export default function GameOverScreen() {
  const score = useGameStore((state) => state.score);
  const level = useGameStore((state) => state.level);
  const resetGame = useGameStore((state) => state.resetGame);

  // Compute initial screen state based on whether score qualifies for leaderboard
  const qualifiesForHighScore = isHighScore(score);
  const [screenState, setScreenState] = useState(
    qualifiesForHighScore ? GameOverState.ENTERING_INITIALS : GameOverState.SHOWING_LEADERBOARD
  );
  const [achievedRank, setAchievedRank] = useState(-1);

  // Handle initials submission
  const handleInitialsSubmit = useCallback((initials) => {
    const rank = saveScore(initials, score, level);
    setAchievedRank(rank);
    setScreenState(GameOverState.SHOWING_RESULT);

    // Auto-transition to leaderboard after showing result
    setTimeout(() => {
      setScreenState(GameOverState.SHOWING_LEADERBOARD);
    }, 2000);
  }, [score, level]);

  // Handle skipping initials entry
  const handleInitialsCancel = useCallback(() => {
    setScreenState(GameOverState.SHOWING_LEADERBOARD);
  }, []);

  // Render based on current state
  const renderContent = () => {
    switch (screenState) {
      case GameOverState.CHECKING:
        return null; // Brief loading state

      case GameOverState.ENTERING_INITIALS:
        return (
          <>
            <div className="final-stats compact">
              <div className="stat-row">
                <span className="stat-label">SCORE</span>
                <span className="stat-value score-value">{score.toLocaleString()}</span>
              </div>
            </div>
            <InitialsInput
              onSubmit={handleInitialsSubmit}
              onCancel={handleInitialsCancel}
            />
          </>
        );

      case GameOverState.SHOWING_RESULT:
        return (
          <div className="high-score-result">
            <h3 className="result-title">CONGRATULATIONS!</h3>
            <p className="result-rank">
              You ranked <span className="rank-number">#{achievedRank}</span>
            </p>
            <p className="result-score">{score.toLocaleString()} points</p>
          </div>
        );

      case GameOverState.SHOWING_LEADERBOARD:
      default:
        return (
          <>
            <div className="final-stats">
              <div className="stat-row">
                <span className="stat-label">FINAL SCORE</span>
                <span className="stat-value score-value">{score.toLocaleString()}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">LEVEL REACHED</span>
                <span className="stat-value">{level}</span>
              </div>
            </div>

            <Leaderboard highlightRank={achievedRank} />

            <button className="menu-button restart-button" onClick={resetGame}>
              PLAY AGAIN
            </button>

            <div className="game-over-hint">Press ENTER to play again</div>
          </>
        );
    }
  };

  return (
    <div className="menu-overlay game-over-screen">
      <h2 className="game-over-title">GAME OVER</h2>
      {renderContent()}
    </div>
  );
}
