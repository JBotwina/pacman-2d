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

export const GameStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  LEVEL_COMPLETE: 'level_complete',
};

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
    // Player starts at tile (1, 1) - first open space
    player: {
      x: TILE_SIZE * 1.5,
      y: TILE_SIZE * 1.5,
    },
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
  const { newDotsState, totalPoints } = collectDotsAtPosition(
    state.dots,
    state.player.x,
    state.player.y
  );

  const newScore = state.score + totalPoints;
  const newStatus = allDotsCollected(newDotsState)
    ? GameStatus.LEVEL_COMPLETE
    : state.status;

  return {
    ...state,
    elapsedTime: state.elapsedTime + deltaTime,
    frameCount: state.frameCount + 1,
    dots: newDotsState,
    score: newScore,
    status: newStatus,
  };
}

/**
 * Updates player position.
 * @param {object} state - Current game state
 * @param {number} x - New X position
 * @param {number} y - New Y position
 * @returns {object} - Updated game state
 */
export function updatePlayerPosition(state, x, y) {
  return {
    ...state,
    player: { x, y },
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

// Re-export TILE_SIZE for components
export { TILE_SIZE };
