/**
 * Start screen component for Pac-Man game.
 * Displays title, controls, and start prompt.
 */

export default function StartScreen({ onStart, gameMode }) {
  const isTwoPlayer = gameMode === '2P';

  return (
    <div className="menu-overlay start-screen">
      <h1 className="menu-title">PAC-MAN</h1>
      <div className="mode-indicator">{isTwoPlayer ? '2 PLAYER MODE' : '1 PLAYER MODE'}</div>

      <div className="controls-section">
        <h2 className="controls-header">CONTROLS</h2>

        <div className="controls-grid">
          <div className="player-controls">
            {isTwoPlayer && <span className="player-label">PLAYER 1</span>}
            <div className="key-group">
              <span className="key">W</span>
              <span className="key-desc">Up</span>
            </div>
            <div className="key-group">
              <span className="key">A</span>
              <span className="key-desc">Left</span>
            </div>
            <div className="key-group">
              <span className="key">S</span>
              <span className="key-desc">Down</span>
            </div>
            <div className="key-group">
              <span className="key">D</span>
              <span className="key-desc">Right</span>
            </div>
            <div className="key-alt">or Arrow Keys</div>
          </div>

          {isTwoPlayer && (
            <div className="player-controls">
              <span className="player-label">PLAYER 2</span>
              <div className="key-group">
                <span className="key">I</span>
                <span className="key-desc">Up</span>
              </div>
              <div className="key-group">
                <span className="key">J</span>
                <span className="key-desc">Left</span>
              </div>
              <div className="key-group">
                <span className="key">K</span>
                <span className="key-desc">Down</span>
              </div>
              <div className="key-group">
                <span className="key">L</span>
                <span className="key-desc">Right</span>
              </div>
            </div>
          )}
        </div>

        <div className="game-controls-info">
          <span className="key">ESC</span>
          <span className="key-desc">Pause Game</span>
        </div>
      </div>

      <button className="start-button" onClick={onStart}>
        START GAME
      </button>

      <div className="start-hint">Press ENTER or click to start</div>
    </div>
  );
}
