import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import {
  createInitialState,
  updateGameState,
  updatePlayerPosition,
  updatePlayer2Position,
  startGame,
  pauseGame,
  resumeGame,
  resetGame,
  GameStatus,
  TILE_SIZE,
} from './game/GameState';
import { getUncollectedDots, DotType } from './game/Dots';
import {
  resolveMovement,
  clampToMazeBounds,
} from './game/Collision';
import Player from './components/Player';
import Ghost from './components/Ghost';
import './App.css';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;
const PLAYER_SPEED = 0.15; // pixels per ms
const PLAYER_SIZE = TILE_SIZE - 4; // Player hitbox size (slightly smaller than tile)

// Neon colors for maze rendering
const WALL_COLOR = '#2121de';
const WALL_GLOW_COLOR = '#4a4aff';
const DOT_COLOR = '#ffb8ae';
const POWER_PELLET_COLOR = '#ffb8ae';

function App() {
  const [gameState, setGameState] = useState(createInitialState);
  const canvasRef = useRef(null);
  const keysRef = useRef({});

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;
    };
    const handleKeyUp = (e) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleUpdate = useCallback((deltaTime) => {
    setGameState((state) => {
      if (state.status !== GameStatus.RUNNING) {
        return state;
      }

      // Calculate movement based on keys pressed
      let dx = 0;
      let dy = 0;
      const keys = keysRef.current;

      if (keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
      if (keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;

      // Apply movement for Player 1 with collision detection
      if (dx !== 0 || dy !== 0) {
        const speed = PLAYER_SPEED * deltaTime;
        const targetX = state.player.x + dx * speed;
        const targetY = state.player.y + dy * speed;

        // Resolve movement with wall collision (handles sliding along walls)
        const resolved = resolveMovement(
          state.maze,
          state.player.x,
          state.player.y,
          targetX,
          targetY,
          PLAYER_SIZE
        );

        // Clamp to maze bounds
        const clamped = clampToMazeBounds(state.maze, resolved.x, resolved.y, PLAYER_SIZE);

        state = updatePlayerPosition(state, clamped.x, clamped.y);
      }

      // Player 2 movement: I=up, J=left, K=down, L=right
      let dx2 = 0;
      let dy2 = 0;

      if (keys['i'] || keys['I']) dy2 -= 1;
      if (keys['k'] || keys['K']) dy2 += 1;
      if (keys['j'] || keys['J']) dx2 -= 1;
      if (keys['l'] || keys['L']) dx2 += 1;

      // Apply movement for Player 2
      if (dx2 !== 0 || dy2 !== 0) {
        const speed = PLAYER_SPEED * deltaTime;
        let newX2 = state.player2.x + dx2 * speed;
        let newY2 = state.player2.y + dy2 * speed;

        // Clamp to canvas bounds
        newX2 = Math.max(TILE_SIZE, Math.min(CANVAS_WIDTH - TILE_SIZE, newX2));
        newY2 = Math.max(TILE_SIZE, Math.min(CANVAS_HEIGHT - TILE_SIZE, newY2));

        // Check wall collision
        const tileX2 = Math.floor(newX2 / TILE_SIZE);
        const tileY2 = Math.floor(newY2 / TILE_SIZE);

        if (
          tileY2 >= 0 &&
          tileY2 < state.maze.length &&
          tileX2 >= 0 &&
          tileX2 < state.maze[0].length &&
          state.maze[tileY2][tileX2] !== 1
        ) {
          state = updatePlayer2Position(state, newX2, newY2);
        }
      }

      return updateGameState(state, deltaTime);
    });
  }, []);

  // Render game with neon glow effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw maze walls with neon glow
    for (let y = 0; y < gameState.maze.length; y++) {
      for (let x = 0; x < gameState.maze[y].length; x++) {
        if (gameState.maze[y][x] === 1) {
          drawWallTile(ctx, x, y, gameState.maze);
        }
      }
    }

    // Draw dots with subtle glow
    const uncollectedDots = getUncollectedDots(gameState.dots);
    for (const dot of uncollectedDots) {
      if (dot.type === DotType.POWER) {
        // Power pellet with glow
        ctx.shadowColor = POWER_PELLET_COLOR;
        ctx.shadowBlur = 10;
        ctx.fillStyle = POWER_PELLET_COLOR;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Regular dot
        ctx.fillStyle = DOT_COLOR;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Player 1 (Pacman) with yellow glow
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Player 2 with cyan glow
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(gameState.player2.x, gameState.player2.y, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [gameState]);

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

  const fps =
    gameState.elapsedTime > 0
      ? Math.round((gameState.frameCount / gameState.elapsedTime) * 1000)
      : 0;

  const dotsRemaining = gameState.dots.totalDots - gameState.dots.collectedDots;

  return (
    <div className="game-container">
      <h1 className="game-title">PAC-MAN</h1>

      <div className="game-stats">
        <div>Status: {gameState.status}</div>
        <div>Score: {gameState.score}</div>
        <div>Lives: {gameState.lives}</div>
        <div>Level: {gameState.level}</div>
        <div>Dots: {dotsRemaining} / {gameState.dots.totalDots}</div>
        {gameState.ghostsVulnerable && (
          <div style={{ color: '#2121de' }}>
            POWER: {Math.ceil(gameState.vulnerabilityTimer / 1000)}s
          </div>
        )}
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
        {gameState.status === GameStatus.LEVEL_COMPLETE && (
          <div className="level-complete">Level Complete!</div>
        )}
        <button onClick={handleReset}>Reset</button>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
        tabIndex={0}
      />

      <div className="game-instructions">
        P1: Arrow Keys or WASD | P2: IJKL
      </div>
    </div>
  );
}

// Draw wall tile with neon glow effect
function drawWallTile(ctx, col, row, maze) {
  const x = col * TILE_SIZE;
  const y = row * TILE_SIZE;
  const halfTile = TILE_SIZE / 2;
  const centerX = x + halfTile;
  const centerY = y + halfTile;

  // Check adjacent tiles
  const top = row > 0 && maze[row - 1][col] === 1;
  const bottom = row < maze.length - 1 && maze[row + 1][col] === 1;
  const left = col > 0 && maze[row][col - 1] === 1;
  const right = col < maze[0].length - 1 && maze[row][col + 1] === 1;

  // Set neon glow effect
  ctx.shadowColor = WALL_GLOW_COLOR;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = 2;

  ctx.beginPath();

  // Draw connecting lines based on adjacent walls
  if (top) {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, y);
  }
  if (bottom) {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, y + TILE_SIZE);
  }
  if (left) {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, centerY);
  }
  if (right) {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x + TILE_SIZE, centerY);
  }

  // If isolated wall, draw a small square
  if (!top && !bottom && !left && !right) {
    ctx.rect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  }

  ctx.stroke();
  ctx.shadowBlur = 0;
}

export default App;
