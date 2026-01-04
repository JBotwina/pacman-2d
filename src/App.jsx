import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import { usePlayerMovement } from './hooks/usePlayerMovement';
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
  Direction,
  GhostMode,
  GHOST_EAT_POINTS,
} from './game/GameState';
import { MAZE_WIDTH, MAZE_HEIGHT } from './data/maze';
import { getUncollectedDots, DotType } from './game/Dots';
import { getFruitData, FRUIT_SPAWN_TILE } from './game/Fruit';
import Player from './components/Player';
import Ghost from './components/Ghost';
import ScoreDisplay from './components/ScoreDisplay';
import StartScreen from './components/StartScreen';
import PauseOverlay from './components/PauseOverlay';
import GameOverScreen from './components/GameOverScreen';
import LevelCompleteScreen from './components/LevelCompleteScreen';
import './App.css';
import './components/Menu.css';

// Note: Player and Ghost components not used directly in canvas-based rendering

// Canvas dimensions based on actual maze size
const CANVAS_WIDTH = MAZE_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = MAZE_HEIGHT * TILE_SIZE;
const PLAYER_SPEED = 6; // tiles per second for grid-based movement
const PLAYER_SIZE = TILE_SIZE - 4; // Player hitbox size (slightly smaller than tile)

// Neon colors for maze rendering
const WALL_COLOR = '#2121de';
const WALL_GLOW_COLOR = '#4a4aff';
const DOT_COLOR = '#ffb8ae';
const POWER_PELLET_COLOR = '#ffb8ae';
const FRIGHTENED_COLOR = '#2121de'; // Blue color for frightened ghosts

// Ghost colors
const GHOST_COLORS = {
  blinky: '#ff0000',
  pinky: '#ffb8ff',
  inky: '#00ffff',
  clyde: '#ffb852',
};

function App() {
  const [gameState, setGameState] = useState(createInitialState);
  const [playerDirection, setPlayerDirection] = useState('right');
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const playerMovement = usePlayerMovement({ speed: PLAYER_SPEED });

  // Initialize player position when game state is created
  useEffect(() => {
    playerMovement.setPosition(gameState.player.x, gameState.player.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - intentionally ignore dependencies

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key] = true;
      // Prevent default for arrow keys to avoid page scrolling
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
      }

      // Handle menu controls
      if (e.key === 'Escape') {
        setGameState((state) => {
          if (state.status === GameStatus.RUNNING) {
            return pauseGame(state);
          } else if (state.status === GameStatus.PAUSED) {
            return resumeGame(state);
          }
          return state;
        });
      }

      if (e.key === 'Enter') {
        setGameState((state) => {
          if (state.status === GameStatus.IDLE) {
            return startGame(state);
          } else if (state.status === GameStatus.PAUSED) {
            return resumeGame(state);
          } else if (state.status === GameStatus.GAME_OVER || state.status === GameStatus.LEVEL_COMPLETE) {
            const newState = resetGame();
            playerMovement.setPosition(newState.player.x, newState.player.y);
            playerMovement.setDirection('right');
            setPlayerDirection('right');
            return startGame(newState);
          }
          return state;
        });
      }
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
  }, [playerMovement]);

  // Get current input direction from keys
  const getInputDirection = useCallback(() => {
    const keys = keysRef.current;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) return 'up';
    if (keys['ArrowDown'] || keys['s'] || keys['S']) return 'down';
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) return 'left';
    if (keys['ArrowRight'] || keys['d'] || keys['D']) return 'right';
    return null;
  }, []);

  const handleUpdate = useCallback((deltaTime) => {
    setGameState((state) => {
      if (state.status !== GameStatus.RUNNING) {
        return state;
      }

      // Get input direction
      const inputDirection = getInputDirection();

      // Update player movement using the grid-based movement hook
      const playerState = playerMovement.update(state.maze, deltaTime, inputDirection);

      // Update player direction for rendering
      setPlayerDirection(playerState.direction);

      // Convert string direction to Direction object for ghost AI
      let directionObj = state.player.direction;
      switch (playerState.direction) {
        case 'up': directionObj = Direction.UP; break;
        case 'down': directionObj = Direction.DOWN; break;
        case 'left': directionObj = Direction.LEFT; break;
        case 'right': directionObj = Direction.RIGHT; break;
        default: break;
      }

      // Update player position in game state with direction for ghost AI
      state = updatePlayerPosition(state, playerState.x, playerState.y, directionObj);

      // Player 2 movement: I=up, J=left, K=down, L=right
      const keys = keysRef.current;
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
  }, [getInputDirection, playerMovement]);

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

    // Draw bonus fruit if active
    if (gameState.fruit.active) {
      const fruitData = getFruitData(gameState.fruit.type);
      if (fruitData) {
        const fruitX = gameState.fruit.x;
        const fruitY = gameState.fruit.y;

        // Draw fruit with glow effect
        ctx.shadowColor = fruitData.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = fruitData.color;
        ctx.beginPath();
        ctx.arc(fruitX, fruitY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw a smaller inner circle for visual interest
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(fruitX - 2, fruitY - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }
    }

    // Draw collected fruit points popup
    if (gameState.fruit.showPointsTimer > 0) {
      const fruitX = FRUIT_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2;
      const fruitY = FRUIT_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2;

      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 8;
      ctx.fillText(gameState.fruit.lastCollectedPoints.toString(), fruitX, fruitY - 10);
      ctx.shadowBlur = 0;
    }

    // Draw ghosts with neon glow
    for (const ghostType of Object.keys(gameState.ghosts)) {
      const ghost = gameState.ghosts[ghostType];

      // Skip eaten ghosts (they're respawning)
      if (ghost.mode === GhostMode.EATEN) {
        continue;
      }

      // Determine ghost color based on mode
      let color;
      if (ghost.mode === GhostMode.FRIGHTENED) {
        // Flash between white and blue in last 2 seconds
        const isFlashing = gameState.vulnerabilityTimer <= 2000;
        if (isFlashing && Math.floor(gameState.elapsedTime / 200) % 2 === 0) {
          color = '#ffffff';
        } else {
          color = FRIGHTENED_COLOR;
        }
      } else {
        color = GHOST_COLORS[ghostType] || GHOST_COLORS.blinky;
      }

      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;

      // Draw ghost body (rounded top, wavy bottom)
      const gx = ghost.x;
      const gy = ghost.y;
      const size = TILE_SIZE / 2 - 2;

      ctx.beginPath();
      // Top arc
      ctx.arc(gx, gy - size * 0.2, size, Math.PI, 0, false);
      // Right side
      ctx.lineTo(gx + size, gy + size * 0.6);
      // Wavy bottom
      const waveCount = 3;
      const waveWidth = (size * 2) / waveCount;
      for (let i = 0; i < waveCount; i++) {
        const x1 = gx + size - (i + 0.5) * waveWidth;
        const x2 = gx + size - (i + 1) * waveWidth;
        ctx.quadraticCurveTo(x1, gy + size * 0.3, x2, gy + size * 0.6);
      }
      // Left side
      ctx.lineTo(gx - size, gy - size * 0.2);
      ctx.fill();

      // Draw eyes (white) - only when not frightened
      ctx.shadowBlur = 0;
      if (ghost.mode !== GhostMode.FRIGHTENED) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(gx - size * 0.35, gy - size * 0.3, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(gx + size * 0.35, gy - size * 0.3, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw pupils (blue)
        ctx.fillStyle = '#1a1aff';
        ctx.beginPath();
        ctx.ellipse(gx - size * 0.3, gy - size * 0.25, size * 0.12, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(gx + size * 0.4, gy - size * 0.25, size * 0.12, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }


    // Draw Player 1 (Pacman) with yellow glow and mouth
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffff00';

    // Calculate mouth angle based on direction
    const mouthAngle = 0.25 * Math.PI; // 45 degree mouth opening
    let startAngle, endAngle;

    switch (playerDirection) {
      case 'right':
        startAngle = mouthAngle;
        endAngle = 2 * Math.PI - mouthAngle;
        break;
      case 'down':
        startAngle = Math.PI / 2 + mouthAngle;
        endAngle = Math.PI / 2 - mouthAngle + 2 * Math.PI;
        break;
      case 'left':
        startAngle = Math.PI + mouthAngle;
        endAngle = Math.PI - mouthAngle + 2 * Math.PI;
        break;
      case 'up':
        startAngle = 3 * Math.PI / 2 + mouthAngle;
        endAngle = 3 * Math.PI / 2 - mouthAngle + 2 * Math.PI;
        break;
      default:
        startAngle = mouthAngle;
        endAngle = 2 * Math.PI - mouthAngle;
    }

    ctx.beginPath();
    ctx.moveTo(gameState.player.x, gameState.player.y);
    ctx.arc(gameState.player.x, gameState.player.y, TILE_SIZE / 2 - 2, startAngle, endAngle);
    ctx.closePath();
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
  }, [gameState, playerDirection]);

  const isLoopRunning = gameState.status === GameStatus.RUNNING;
  useGameLoop(handleUpdate, isLoopRunning);

  const handleStart = () => {
    setGameState((state) => startGame(state));
  };

  const handleResume = () => {
    setGameState((state) => resumeGame(state));
  };

  const handleReset = () => {
    const newState = resetGame();
    setGameState(newState);
    // Reset player movement to initial position
    playerMovement.setPosition(newState.player.x, newState.player.y);
    playerMovement.setDirection('right');
    setPlayerDirection('right');
  };

  return (
    <div className="game-container">
      <h1 className="game-title">PAC-MAN</h1>

      {gameState.status !== GameStatus.IDLE && (
        <ScoreDisplay gameState={gameState} />
      )}

      <div className="game-area">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas"
          tabIndex={0}
        />

        {gameState.status === GameStatus.IDLE && (
          <StartScreen onStart={handleStart} />
        )}

        {gameState.status === GameStatus.PAUSED && (
          <PauseOverlay
            onResume={handleResume}
            onQuit={handleReset}
            score={gameState.score}
          />
        )}

        {gameState.status === GameStatus.GAME_OVER && (
          <GameOverScreen
            score={gameState.score}
            level={gameState.level}
            onRestart={handleReset}
          />
        )}

        {gameState.status === GameStatus.LEVEL_COMPLETE && (
          <LevelCompleteScreen
            score={gameState.score}
            level={gameState.level}
            onNextLevel={handleReset}
          />
        )}
      </div>

      {gameState.status === GameStatus.RUNNING && (
        <div className="game-instructions">
          P1: Arrow Keys or WASD | P2: IJKL | ESC: Pause
        </div>
      )}
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
