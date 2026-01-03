import { useState, useCallback } from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import {
  createInitialState,
  updateGameState,
  startGame,
  pauseGame,
  resumeGame,
  resetGame,
  GameStatus,
} from './game/GameState';
import './App.css';

function App() {
  const [gameState, setGameState] = useState(createInitialState);

  const handleUpdate = useCallback((deltaTime) => {
    setGameState((state) => updateGameState(state, deltaTime));
  }, []);

  const isLoopRunning = gameState.status === GameStatus.RUNNING;
  useGameLoop(handleUpdate, isLoopRunning);

  const handleStart = () => {
    setGameState((state) => startGame(state));
  };

  const handlePause = () => {
    setGameState((state) => pauseGame(state));
  };

  const handleResume = () => {
    setGameState((state) => resumeGame(state));
  };

  const handleReset = () => {
    setGameState(resetGame());
  };

  const fps = gameState.elapsedTime > 0
    ? Math.round((gameState.frameCount / gameState.elapsedTime) * 1000)
    : 0;

  return (
    <div className="game-container">
      <h1>Pacman 2D</h1>

      <div className="game-stats">
        <div>Status: {gameState.status}</div>
        <div>Score: {gameState.score}</div>
        <div>Lives: {gameState.lives}</div>
        <div>Level: {gameState.level}</div>
        <div>Time: {(gameState.elapsedTime / 1000).toFixed(1)}s</div>
        <div>Frames: {gameState.frameCount}</div>
        <div>FPS: {fps}</div>
      </div>

      <div className="game-controls">
        {gameState.status === GameStatus.IDLE && (
          <button onClick={handleStart}>Start Game</button>
        )}
        {gameState.status === GameStatus.RUNNING && (
          <button onClick={handlePause}>Pause</button>
        )}
        {gameState.status === GameStatus.PAUSED && (
          <button onClick={handleResume}>Resume</button>
        )}
        <button onClick={handleReset}>Reset</button>
      </div>

      <div className="game-canvas-placeholder">
        {/* Canvas for game rendering will go here */}
        <p>Game canvas placeholder</p>
      </div>
    </div>
  );
}

export default App;
