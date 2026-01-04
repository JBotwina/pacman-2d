/**
 * Mode selection screen for Pac-Man game.
 * Allows player to choose between 1-player and 2-player mode.
 */

import { useGameStore } from '../store';

export default function ModeSelectScreen() {
  const setGameMode = useGameStore((state) => state.setGameMode);

  return (
    <div className="menu-overlay mode-select-screen">
      <h1 className="menu-title">PAC-MAN</h1>

      <div className="mode-select-container">
        <h2 className="mode-select-header">SELECT MODE</h2>

        <div className="mode-buttons">
          <button
            className="mode-button mode-1p"
            onClick={() => setGameMode('1P')}
          >
            <span className="mode-icon">🟡</span>
            <span className="mode-label">1 PLAYER</span>
            <span className="mode-desc">Classic solo adventure</span>
          </button>

          <button
            className="mode-button mode-2p"
            onClick={() => setGameMode('2P')}
          >
            <span className="mode-icon">🟡🔵</span>
            <span className="mode-label">2 PLAYERS</span>
            <span className="mode-desc">Co-op with a friend</span>
          </button>
        </div>
      </div>

      <div className="mode-select-hint">Press 1 or 2 to select mode</div>
    </div>
  );
}
