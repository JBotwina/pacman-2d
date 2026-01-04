/**
 * Test utilities for React Testing Library with Zustand store integration.
 * Provides custom render functions that reset game store between tests.
 */

import { render } from '@testing-library/react';
import { useGameStore } from '../store/gameStore.js';
import { createInitialState } from '../game/GameState.js';

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

/**
 * Resets the game store to initial state.
 * Call this in beforeEach to ensure clean state between tests.
 * @param {number} highScore - Optional high score to preserve
 */
export function resetGameStore(highScore = 0) {
  useGameStore.setState(createInitialState(highScore), true);
}

/**
 * Sets the game store to a specific state.
 * Useful for testing components in specific game states.
 * @param {object} partialState - Partial state to merge with current state
 */
export function setGameStoreState(partialState) {
  useGameStore.setState(partialState);
}

/**
 * Gets the current game store state.
 * @returns {object} Current store state
 */
export function getGameStoreState() {
  return useGameStore.getState();
}

/**
 * Custom render function that resets game store before rendering.
 * @param {React.ReactElement} ui - Component to render
 * @param {object} options - Render options
 * @param {object} options.initialState - Optional partial state to merge with initial state
 * @param {number} options.highScore - Optional high score for initial state
 * @returns {object} Render result from testing library
 */
function customRender(ui, { initialState, highScore = 0, ...renderOptions } = {}) {
  // Reset store to clean initial state
  const baseState = createInitialState(highScore);
  const finalState = initialState ? { ...baseState, ...initialState } : baseState;
  useGameStore.setState(finalState, true);

  return render(ui, renderOptions);
}

// Override render export
export { customRender as render };
