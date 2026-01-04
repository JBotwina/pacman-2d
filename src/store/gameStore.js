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
  GameStatus,
} from '../game/GameState.js';

/**
 * Creates the game store with initial state and actions.
 * Actions delegate to pure functions from GameState.js for testability.
 */
export const useGameStore = create((set) => ({
  // Initialize with default state
  ...createInitialState(),

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
export { GameStatus, GameMode } from '../game/GameState.js';
