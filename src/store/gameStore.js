/**
 * Zustand game store for Pacman 2D.
 * Centralizes all game state and exposes actions that delegate to pure functions.
 */

import { create } from 'zustand';
import {
  createInitialState,
  startGame as startGamePure,
  pauseGame as pauseGamePure,
  resumeGame as resumeGamePure,
  resetGame as resetGamePure,
  setGameMode as setGameModePure,
  updatePlayerPosition as updatePlayerPositionPure,
  updatePlayer2Position as updatePlayer2PositionPure,
  updateGameState,
  updateDeathAnimation,
  nextLevel as nextLevelPure,
  GameStatus,
  MAX_LEVEL,
} from '../game/GameState.js';

// localStorage key for high score persistence
const HIGH_SCORE_KEY = 'pacman-high-score';

function loadHighScore() {
  try {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Creates the game store with initial state and actions.
 * Actions delegate to pure functions from GameState.js for testability.
 */
export const useGameStore = create((set) => ({
  // Initialize with default state and persisted high score
  ...createInitialState(loadHighScore()),

  // ============================================
  // Game Lifecycle Actions
  // ============================================

  /**
   * Starts or resumes the game from IDLE state.
   */
  startGame: () => set((state) => startGamePure(state)),

  /**
   * Pauses a running game.
   */
  pauseGame: () => set((state) => pauseGamePure(state)),

  /**
   * Resumes a paused game.
   */
  resumeGame: () => set((state) => resumeGamePure(state)),

  /**
   * Resets the game to initial state, preserving high score.
   */
  resetGame: () => set((state) => resetGamePure(state.highScore)),

  /**
   * Advances to the next level.
   * Resets maze/dots/ghosts/fruit while preserving score/lives/highScore.
   * If at MAX_LEVEL, sets status to GAME_COMPLETE.
   */
  nextLevel: () => set((state) => nextLevelPure(state)),

  // ============================================
  // Game Mode Actions
  // ============================================

  /**
   * Sets the game mode (1P or 2P) and transitions to IDLE.
   * @param {string} mode - GameMode.SINGLE_PLAYER or GameMode.TWO_PLAYER
   */
  setGameMode: (mode) => set((state) => setGameModePure(state, mode)),

  // ============================================
  // Player Position Actions
  // ============================================

  /**
   * Updates player 1 position and direction.
   * @param {number} x - New X position
   * @param {number} y - New Y position
   * @param {object} direction - Movement direction (optional)
   */
  updatePlayerPosition: (x, y, direction = null) =>
    set((state) => updatePlayerPositionPure(state, x, y, direction)),

  /**
   * Updates player 2 position and direction.
   * @param {number} x - New X position
   * @param {number} y - New Y position
   * @param {object} direction - Movement direction (optional)
   */
  updatePlayer2Position: (x, y, direction = null) =>
    set((state) => updatePlayer2PositionPure(state, x, y, direction)),

  // ============================================
  // Game Loop Actions
  // ============================================

  /**
   * Main tick action called by the game loop.
   * Updates all game state based on delta time.
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  tick: (deltaTime) =>
    set((state) => {
      // Handle death animation if dying
      if (state.status === GameStatus.DYING) {
        return updateDeathAnimation(state, deltaTime);
      }
      // Normal game state update
      return updateGameState(state, deltaTime);
    }),
}));

// Re-export constants for convenience
export { GameStatus, GameMode, MAX_LEVEL } from '../game/GameState.js';
