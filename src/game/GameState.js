/**
 * Game state management for Pacman 2D.
 * Handles game state updates, pause/resume, and state transitions.
 */

import {
  createDefaultMaze,
  createDotsFromMaze,
  collectDotsAtPosition,
  allDotsCollected,
  TILE_SIZE,
} from './Dots.js';
import {
  createAllGhosts,
  updateAllGhosts,
  setGhostMode,
  GhostMode,
  Direction,
} from './GhostAI.js';

export const GameStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  LEVEL_COMPLETE: 'level_complete',
};

// Frightened mode constants
export const FRIGHTENED_DURATION = 8000; // 8 seconds of frightened mode
export const FRIGHTENED_FLASH_TIME = 2000; // Flash for last 2 seconds
export const FRIGHTENED_SPEED_MULTIPLIER = 0.5; // Ghosts move at half speed when frightened
export const VULNERABILITY_DURATION = 10000; // Alias for compatibility

export function createInitialState() {
  const maze = createDefaultMaze();
  const dotsState = createDotsFromMaze(maze);

  return {
    status: GameStatus.IDLE,
    score: 0,
    lives: 3,
    level: 1,
    elapsedTime: 0,
    frameCount: 0,
    maze,
    dots: dotsState,
    // Player 1 starts at tile (1, 1) - first open space
    player: {
      x: TILE_SIZE * 1.5,
      y: TILE_SIZE * 1.5,
      direction: Direction.RIGHT,
    },
    // Player 2 starts at bottom-right area
    player2: {
      x: TILE_SIZE * 8.5,
      y: TILE_SIZE * 5.5,
    },
    // Ghosts with AI behaviors
    ghosts: createAllGhosts(),
    // Ghost frightened/vulnerable state
    ghostsVulnerable: false,
    vulnerabilityTimer: 0,
    ghostsEatenDuringFrightened: 0,
  };
}

/**
 * Updates game state based on delta time.
 * This is the main update function called by the game loop.
 *
 * @param {object} state - Current game state
 * @param {number} deltaTime - Time since last frame in milliseconds
 * @returns {object} - Updated game state
 */
export function updateGameState(state, deltaTime) {
  if (state.status !== GameStatus.RUNNING) {
    return state;
  }

  // Check for dot collection at player position
  const { newDotsState, totalPoints, powerPelletCollected } = collectDotsAtPosition(
    state.dots,
    state.player.x,
    state.player.y
  );

  const newScore = state.score + totalPoints;
  const newStatus = allDotsCollected(newDotsState)
    ? GameStatus.LEVEL_COMPLETE
    : state.status;

  // Handle ghost vulnerability
  let ghostsVulnerable = state.ghostsVulnerable;
  let vulnerabilityTimer = state.vulnerabilityTimer;
  let ghostsEatenDuringFrightened = state.ghostsEatenDuringFrightened;
  let updatedGhosts = state.ghosts;

  if (powerPelletCollected) {
    // Start or reset vulnerability timer
    ghostsVulnerable = true;
    vulnerabilityTimer = VULNERABILITY_DURATION;
    ghostsEatenDuringFrightened = 0;
    // Set all ghosts to frightened mode
    updatedGhosts = setGhostMode(state.ghosts, GhostMode.FRIGHTENED);
  } else if (ghostsVulnerable) {
    // Count down vulnerability timer
    vulnerabilityTimer = Math.max(0, vulnerabilityTimer - deltaTime);
    if (vulnerabilityTimer <= 0) {
      ghostsVulnerable = false;
      ghostsEatenDuringFrightened = 0;
      // Return ghosts to chase mode
      updatedGhosts = setGhostMode(state.ghosts, GhostMode.CHASE);
    }
  }

  // Update ghost positions and AI
  updatedGhosts = updateAllGhosts(
    updatedGhosts,
    state.maze,
    state.player,
    state.player.direction,
    deltaTime
  );

  return {
    ...state,
    elapsedTime: state.elapsedTime + deltaTime,
    frameCount: state.frameCount + 1,
    dots: newDotsState,
    score: newScore,
    status: newStatus,
    ghosts: updatedGhosts,
    ghostsVulnerable,
    vulnerabilityTimer,
    ghostsEatenDuringFrightened,
  };
}

/**
 * Updates player 1 position and direction.
 * @param {object} state - Current game state
 * @param {number} x - New X position
 * @param {number} y - New Y position
 * @param {object} direction - Movement direction (optional)
 * @returns {object} - Updated game state
 */
export function updatePlayerPosition(state, x, y, direction = null) {
  return {
    ...state,
    player: {
      x,
      y,
      direction: direction || state.player.direction,
    },
  };
}

/**
 * Updates player 2 position.
 * @param {object} state - Current game state
 * @param {number} x - New X position
 * @param {number} y - New Y position
 * @returns {object} - Updated game state
 */
export function updatePlayer2Position(state, x, y) {
  return {
    ...state,
    player2: { x, y },
  };
}

/**
 * Starts or resumes the game.
 */
export function startGame(state) {
  return {
    ...state,
    status: GameStatus.RUNNING,
  };
}

/**
 * Pauses the game.
 */
export function pauseGame(state) {
  if (state.status !== GameStatus.RUNNING) {
    return state;
  }
  return {
    ...state,
    status: GameStatus.PAUSED,
  };
}

/**
 * Resumes a paused game.
 */
export function resumeGame(state) {
  if (state.status !== GameStatus.PAUSED) {
    return state;
  }
  return {
    ...state,
    status: GameStatus.RUNNING,
  };
}

/**
 * Resets the game to initial state.
 */
export function resetGame() {
  return createInitialState();
}

/**
 * Gets the current ghost speed multiplier based on frightened state.
 * @param {object} state - Current game state
 * @returns {number} Speed multiplier (1.0 for normal, 0.5 for frightened)
 */
export function getGhostSpeedMultiplier(state) {
  return state.ghostsVulnerable ? FRIGHTENED_SPEED_MULTIPLIER : 1.0;
}

/**
 * Checks if ghosts are currently frightened.
 * @param {object} state - Current game state
 * @returns {boolean} True if ghosts are frightened
 */
export function areGhostsFrightened(state) {
  return state.ghostsVulnerable;
}

/**
 * Checks if ghosts are in the flashing warning state.
 * @param {object} state - Current game state
 * @returns {boolean} True if ghosts are flashing (last 2 seconds of vulnerability)
 */
export function areGhostsFlashing(state) {
  return state.ghostsVulnerable && state.vulnerabilityTimer <= FRIGHTENED_FLASH_TIME;
}

/**
 * Ghost point values for eating during frightened mode.
 * Points double for each successive ghost eaten: 200, 400, 800, 1600
 */
export const GHOST_EAT_POINTS = [200, 400, 800, 1600];

/**
 * Handles eating a ghost during frightened mode.
 * @param {object} state - Current game state
 * @returns {object} Updated game state with points added
 */
export function eatGhost(state) {
  if (!state.ghostsVulnerable) {
    return state;
  }

  const ghostIndex = Math.min(state.ghostsEatenDuringFrightened, GHOST_EAT_POINTS.length - 1);
  const points = GHOST_EAT_POINTS[ghostIndex];

  return {
    ...state,
    score: state.score + points,
    ghostsEatenDuringFrightened: state.ghostsEatenDuringFrightened + 1,
  };
}

// Re-export TILE_SIZE and Direction for components
export { TILE_SIZE, Direction };
