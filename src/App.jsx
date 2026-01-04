import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useGameStore, GameStatus, GameMode } from './store';
import {
  TILE_SIZE,
  Direction,
  GhostMode,
  DEATH_ANIMATION_DURATION,
} from './game/GameState';
import { getUncollectedDots, DotType } from './game/Dots';
import { getFruitData, FRUIT_SPAWN_TILE } from './game/Fruit';
import ScoreDisplay from './components/ScoreDisplay';
import ModeSelectScreen from './components/ModeSelectScreen';
import StartScreen from './components/StartScreen';
import PauseOverlay from './components/PauseOverlay';
import GameOverScreen from './components/GameOverScreen';
import LevelCompleteScreen from './components/LevelCompleteScreen';
import './App.css';
import './components/Menu.css';

const PLAYER_SPEED = 4; // tiles per second for grid-based movement

function getMazePixelSize(maze) {
  const rows = maze?.length ?? 0;
  const cols = maze?.[0]?.length ?? 0;

  return {
    width: cols * TILE_SIZE,
    height: rows * TILE_SIZE,
  };
}

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

// localStorage key for high score
const HIGH_SCORE_KEY = 'pacman-high-score';

function saveHighScore(score) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
  } catch {
    // Ignore localStorage errors
  }
}

function App() {
  // Get state and actions from store
  const gameState = useGameStore();
  const {
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    setGameMode,
    updatePlayerPosition,
    updatePlayer2Position,
    tick,
  } = useGameStore();

  const [playerDirection, setPlayerDirection] = useState('right');
  const [player2Direction, setPlayer2Direction] = useState('left');
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const playerMovement = usePlayerMovement({ speed: PLAYER_SPEED });
  const player2Movement = usePlayerMovement({ speed: PLAYER_SPEED });

  // Initialize player positions when game state is created
  useEffect(() => {
    playerMovement.setPosition(gameState.player.x, gameState.player.y);
    player2Movement.setPosition(gameState.player2.x, gameState.player2.y);
    player2Movement.setDirection('left');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - intentionally ignore dependencies

  // Save high score to localStorage when it changes
  useEffect(() => {
    if (gameState.highScore > 0) {
      saveHighScore(gameState.highScore);
    }
  }, [gameState.highScore]);

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
        const state = useGameStore.getState();
        if (state.status === GameStatus.RUNNING) {
          pauseGame();
        } else if (state.status === GameStatus.PAUSED) {
          resumeGame();
        }
      }

      if (e.key === 'Enter') {
        const state = useGameStore.getState();
        if (state.status === GameStatus.IDLE) {
          startGame();
        } else if (state.status === GameStatus.PAUSED) {
          resumeGame();
        } else if (state.status === GameStatus.GAME_OVER || state.status === GameStatus.LEVEL_COMPLETE) {
          resetGame();
          const newState = useGameStore.getState();
          playerMovement.setPosition(newState.player.x, newState.player.y);
          playerMovement.setDirection('right');
          setPlayerDirection('right');
          player2Movement.setPosition(newState.player2.x, newState.player2.y);
          player2Movement.setDirection('left');
          setPlayer2Direction('left');
          startGame();
        }
      }

      // Mode selection with 1/2 keys
      if (e.key === '1') {
        const state = useGameStore.getState();
        if (state.status === GameStatus.MODE_SELECT) {
          setGameMode(GameMode.SINGLE_PLAYER);
        }
      }
      if (e.key === '2') {
        const state = useGameStore.getState();
        if (state.status === GameStatus.MODE_SELECT) {
          setGameMode(GameMode.TWO_PLAYER);
        }
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
  }, [playerMovement, player2Movement, pauseGame, resumeGame, startGame, resetGame, setGameMode]);

  // Get current input direction from S/D/F/E keys for Player 1
  const getInputDirection = useCallback(() => {
    const keys = keysRef.current;
    if (keys['e'] || keys['E']) return 'up';
    if (keys['d'] || keys['D']) return 'down';
    if (keys['s'] || keys['S']) return 'left';
    if (keys['f'] || keys['F']) return 'right';
    return null;
  }, []);

  // Get current input direction from IJKL keys for Player 2
  const getPlayer2InputDirection = useCallback(() => {
    const keys = keysRef.current;
    if (keys['i'] || keys['I']) return 'up';
    if (keys['k'] || keys['K']) return 'down';
    if (keys['j'] || keys['J']) return 'left';
    if (keys['l'] || keys['L']) return 'right';
    return null;
  }, []);

  const handleUpdate = useCallback((deltaTime) => {
    const state = useGameStore.getState();

    // Handle death animation
    if (state.status === GameStatus.DYING) {
      tick(deltaTime);
      // Check if respawned (status changed from DYING to RUNNING)
      const newState = useGameStore.getState();
      if (newState.status === GameStatus.RUNNING) {
        playerMovement.setPosition(newState.player.x, newState.player.y);
        playerMovement.setDirection('right');
        setPlayerDirection('right');
      }
      return;
    }

    if (state.status !== GameStatus.RUNNING) {
      return;
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
    updatePlayerPosition(playerState.x, playerState.y, directionObj);

    // Player 2 movement using grid-based movement (IJKL keys) - only in 2P mode
    if (state.gameMode === GameMode.TWO_PLAYER) {
      const player2Input = getPlayer2InputDirection();
      const player2State = player2Movement.update(state.maze, deltaTime, player2Input);

      // Update Player 2 direction for rendering
      setPlayer2Direction(player2State.direction);

      // Convert string direction to Direction object for Player 2
      let direction2Obj = state.player2.direction;
      switch (player2State.direction) {
        case 'up': direction2Obj = Direction.UP; break;
        case 'down': direction2Obj = Direction.DOWN; break;
        case 'left': direction2Obj = Direction.LEFT; break;
        case 'right': direction2Obj = Direction.RIGHT; break;
        default: break;
      }

      // Update Player 2 position in game state
      updatePlayer2Position(player2State.x, player2State.y, direction2Obj);
    }

    tick(deltaTime);
  }, [getInputDirection, getPlayer2InputDirection, playerMovement, player2Movement, tick, updatePlayerPosition, updatePlayer2Position]);

  // Render game with neon glow effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width: canvasWidth, height: canvasHeight } = getMazePixelSize(gameState.maze);

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

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

    // Draw ghosts with neon glow (hide during death animation)
    if (gameState.status !== GameStatus.DYING) {
      for (const ghostType of Object.keys(gameState.ghosts)) {
        const ghost = gameState.ghosts[ghostType];
        const gx = ghost.x;
        const gy = ghost.y;
        const size = TILE_SIZE / 2 - 2;

      // Draw only eyes for eaten ghosts (returning to ghost house)
      if (ghost.mode === GhostMode.EATEN) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(gx - size * 0.35, gy - size * 0.3, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(gx + size * 0.35, gy - size * 0.3, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1aff';
        ctx.beginPath();
        ctx.ellipse(gx - size * 0.3, gy - size * 0.25, size * 0.12, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(gx + size * 0.4, gy - size * 0.25, size * 0.12, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      // Determine color based on mode
      let color = GHOST_COLORS[ghostType] || GHOST_COLORS.blinky;
      if (ghost.mode === GhostMode.FRIGHTENED) {
        // Flash white/blue in last 2 seconds
        const flashing = gameState.vulnerabilityTimer < 2000;
        if (flashing && Math.floor(gameState.elapsedTime / 200) % 2 === 0) {
          color = '#ffffff';
        } else {
          color = FRIGHTENED_COLOR;
        }
      }

      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;

      // Draw ghost body (rounded top, wavy bottom)
      ctx.beginPath();
      ctx.arc(gx, gy - size * 0.2, size, Math.PI, 0, false);
      ctx.lineTo(gx + size, gy + size * 0.6);
      const waveCount = 3;
      const waveWidth = (size * 2) / waveCount;
      for (let i = 0; i < waveCount; i++) {
        const x1 = gx + size - (i + 0.5) * waveWidth;
        const x2 = gx + size - (i + 1) * waveWidth;
        ctx.quadraticCurveTo(x1, gy + size * 0.3, x2, gy + size * 0.6);
      }
      ctx.lineTo(gx - size, gy - size * 0.2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw eyes - normal or frightened face
      if (ghost.mode !== GhostMode.FRIGHTENED) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(gx - size * 0.35, gy - size * 0.3, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(gx + size * 0.35, gy - size * 0.3, size * 0.25, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1aff';
        ctx.beginPath();
        ctx.ellipse(gx - size * 0.3, gy - size * 0.25, size * 0.12, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(gx + size * 0.4, gy - size * 0.25, size * 0.12, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Frightened face - eyes and wavy mouth
        ctx.fillStyle = '#fff';
        // Draw larger eyes for better visibility
        ctx.beginPath();
        ctx.arc(gx - size * 0.3, gy - size * 0.2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(gx + size * 0.3, gy - size * 0.2, 3, 0, Math.PI * 2);
        ctx.fill();
        // Draw wavy mouth
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const mouthY = gy + size * 0.15;
        const mouthWidth = size * 0.7;
        const waveHeight = size * 0.12;
        ctx.moveTo(gx - mouthWidth / 2, mouthY);
        // Draw 3 waves
        for (let i = 0; i < 3; i++) {
          const segmentWidth = mouthWidth / 3;
          const x1 = gx - mouthWidth / 2 + segmentWidth * i + segmentWidth / 2;
          const x2 = gx - mouthWidth / 2 + segmentWidth * (i + 1);
          const y1 = i % 2 === 0 ? mouthY - waveHeight : mouthY + waveHeight;
          ctx.quadraticCurveTo(x1, y1, x2, mouthY);
        }
        ctx.stroke();
      }
      }
    }


    // Draw Player 1 (Pacman) with yellow glow and mouth
    // During death animation, show shrinking/deflating effect
    if (gameState.status === GameStatus.DYING) {
      // Calculate animation progress (0 = just died, 1 = animation complete)
      const progress = 1 - (gameState.deathAnimationTimer / DEATH_ANIMATION_DURATION);

      // Death animation: Pac-Man opens mouth wide and shrinks
      const deathMouthAngle = Math.PI * progress; // Mouth opens to 180 degrees
      const deathRadius = (TILE_SIZE / 2 - 2) * (1 - progress * 0.8); // Shrink to 20% size

      if (deathRadius > 1) {
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15 * (1 - progress);
        ctx.fillStyle = '#ffff00';
        ctx.globalAlpha = 1 - progress * 0.5; // Fade slightly

        ctx.beginPath();
        ctx.moveTo(gameState.player.x, gameState.player.y);
        // Death animation rotates upward as it shrinks
        const deathStartAngle = -Math.PI / 2 + deathMouthAngle;
        const deathEndAngle = -Math.PI / 2 - deathMouthAngle + 2 * Math.PI;
        ctx.arc(gameState.player.x, gameState.player.y, deathRadius, deathStartAngle, deathEndAngle);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }
    } else {
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
    }

    // Draw Player 2 (Pac-Man) with cyan glow and mouth - only in 2P mode (hide during death animation)
    if (gameState.gameMode === GameMode.TWO_PLAYER && gameState.status !== GameStatus.DYING) {
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00ffff';

      // Calculate mouth angle based on Player 2 direction
      const mouthAngle2 = 0.25 * Math.PI;
      let startAngle2, endAngle2;
      switch (player2Direction) {
        case 'right':
          startAngle2 = mouthAngle2;
          endAngle2 = 2 * Math.PI - mouthAngle2;
          break;
        case 'down':
          startAngle2 = Math.PI / 2 + mouthAngle2;
          endAngle2 = Math.PI / 2 - mouthAngle2 + 2 * Math.PI;
          break;
        case 'left':
          startAngle2 = Math.PI + mouthAngle2;
          endAngle2 = Math.PI - mouthAngle2 + 2 * Math.PI;
          break;
        case 'up':
          startAngle2 = 3 * Math.PI / 2 + mouthAngle2;
          endAngle2 = 3 * Math.PI / 2 - mouthAngle2 + 2 * Math.PI;
          break;
        default:
          startAngle2 = mouthAngle2;
          endAngle2 = 2 * Math.PI - mouthAngle2;
      }

      ctx.beginPath();
      ctx.moveTo(gameState.player2.x, gameState.player2.y);
      ctx.arc(gameState.player2.x, gameState.player2.y, TILE_SIZE / 2 - 2, startAngle2, endAngle2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [gameState, playerDirection, player2Direction]);

  const isLoopRunning = gameState.status === GameStatus.RUNNING || gameState.status === GameStatus.DYING;
  useGameLoop(handleUpdate, isLoopRunning);


  const { width: canvasWidth, height: canvasHeight } = getMazePixelSize(gameState.maze);

  return (
    <div className="game-container">
      <h1 className="game-title">PAC-MAN</h1>

      {gameState.status !== GameStatus.IDLE && gameState.status !== GameStatus.MODE_SELECT && (
        <ScoreDisplay />
      )}

      <div className="game-area">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="game-canvas"
          tabIndex={0}
        />

        {gameState.status === GameStatus.MODE_SELECT && (
          <ModeSelectScreen />
        )}

        {gameState.status === GameStatus.IDLE && (
          <StartScreen />
        )}

        {gameState.status === GameStatus.PAUSED && (
          <PauseOverlay />
        )}

        {gameState.status === GameStatus.GAME_OVER && (
          <GameOverScreen />
        )}

        {gameState.status === GameStatus.LEVEL_COMPLETE && (
          <LevelCompleteScreen />
        )}
      </div>

      {gameState.status === GameStatus.RUNNING && (
        <div className="game-instructions">
          {gameState.gameMode === GameMode.TWO_PLAYER
            ? 'P1: SDFE | P2: IJKL | ESC: Pause'
            : 'SDFE to move | ESC: Pause'}
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
