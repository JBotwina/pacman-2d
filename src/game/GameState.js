/**
 * Game state management for Pacman 2D.
 * Handles game state updates, pause/resume, and state transitions.
 */

export const GameStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
};

export function createInitialState() {
  return {
    status: GameStatus.IDLE,
    score: 0,
    lives: 3,
    level: 1,
    elapsedTime: 0,
    frameCount: 0,
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

  return {
    ...state,
    elapsedTime: state.elapsedTime + deltaTime,
    frameCount: state.frameCount + 1,
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
