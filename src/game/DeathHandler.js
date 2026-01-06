/**
 * Death handling module for Pacman 2D.
 * Modular functions for player death, respawn, and invincibility management.
 */

import { GhostMode, GHOST_START_POSITIONS } from './GhostAI.js';
import { TILE_SIZE } from './Dots.js';
import { Direction } from './GhostAI.js';

// Invincibility duration after respawn (in ms)
export const INVINCIBILITY_DURATION = 2500; // 2.5 seconds

// Safe spawn positions for each player (away from ghost house)
export const PLAYER_SPAWN_POSITIONS = {
  1: { x: TILE_SIZE * 2.5, y: TILE_SIZE * 4.5, direction: Direction.RIGHT },
  2: { x: TILE_SIZE * 2.5, y: TILE_SIZE * 10.5, direction: Direction.LEFT },
};

/**
 * Checks if a player can die (not currently invincible).
 * @param {object} state - Current game state
 * @param {number} playerNum - Player number (1 or 2)
 * @returns {boolean} True if the player can die
 */
export function canPlayerDie(state, playerNum) {
  if (playerNum === 1) {
    return !state.player1Invincible;
  } else if (playerNum === 2) {
    return !state.player2Invincible;
  }
  return true;
}

/**
 * Checks if a player is currently invincible.
 * @param {object} state - Current game state
 * @param {number} playerNum - Player number (1 or 2)
 * @returns {boolean} True if the player is invincible
 */
export function isPlayerInvincible(state, playerNum) {
  if (playerNum === 1) {
    return state.player1Invincible === true;
  } else if (playerNum === 2) {
    return state.player2Invincible === true;
  }
  return false;
}

/**
 * Resets EATEN ghosts back to the ghost house with IN_HOUSE mode.
 * This prevents immediate re-collision after player respawn.
 * @param {object} ghosts - Current ghosts state
 * @returns {object} Updated ghosts with EATEN ghosts reset to IN_HOUSE
 */
export function resetEatenGhosts(ghosts) {
  const updatedGhosts = {};

  for (const [ghostType, ghost] of Object.entries(ghosts)) {
    if (ghost.mode === GhostMode.EATEN) {
      // Reset to ghost house position with IN_HOUSE mode
      const startPos = GHOST_START_POSITIONS[ghostType];
      updatedGhosts[ghostType] = {
        ...ghost,
        x: startPos.x,
        y: startPos.y,
        mode: GhostMode.IN_HOUSE,
      };
    } else {
      updatedGhosts[ghostType] = ghost;
    }
  }

  return updatedGhosts;
}

/**
 * Respawns a player at their safe spawn position with invincibility.
 * Also resets EATEN ghosts to the ghost house to prevent immediate collision.
 * @param {object} state - Current game state
 * @param {number} playerNum - Player number (1 or 2)
 * @returns {object} Updated game state with respawned player
 */
export function respawnPlayer(state, playerNum) {
  const spawnPos = PLAYER_SPAWN_POSITIONS[playerNum];
  const updatedGhosts = resetEatenGhosts(state.ghosts);

  if (playerNum === 1) {
    return {
      ...state,
      player: {
        x: spawnPos.x,
        y: spawnPos.y,
        direction: spawnPos.direction,
      },
      player1Invincible: true,
      player1InvincibilityTimer: INVINCIBILITY_DURATION,
      ghosts: updatedGhosts,
      ghostsVulnerable: false,
      vulnerabilityTimer: 0,
    };
  } else if (playerNum === 2) {
    return {
      ...state,
      player2: {
        x: spawnPos.x,
        y: spawnPos.y,
        direction: spawnPos.direction,
      },
      player2Invincible: true,
      player2InvincibilityTimer: INVINCIBILITY_DURATION,
      ghosts: updatedGhosts,
      ghostsVulnerable: false,
      vulnerabilityTimer: 0,
    };
  }

  return state;
}

/**
 * Updates invincibility timers for both players.
 * @param {object} state - Current game state
 * @param {number} deltaTime - Time since last frame in milliseconds
 * @returns {object} Updated game state with countdown timers
 */
export function updateInvincibility(state, deltaTime) {
  let player1Invincible = state.player1Invincible;
  let player1InvincibilityTimer = state.player1InvincibilityTimer || 0;
  let player2Invincible = state.player2Invincible;
  let player2InvincibilityTimer = state.player2InvincibilityTimer || 0;

  // Update Player 1 invincibility
  if (player1Invincible) {
    player1InvincibilityTimer = Math.max(0, player1InvincibilityTimer - deltaTime);
    if (player1InvincibilityTimer <= 0) {
      player1Invincible = false;
    }
  }

  // Update Player 2 invincibility
  if (player2Invincible) {
    player2InvincibilityTimer = Math.max(0, player2InvincibilityTimer - deltaTime);
    if (player2InvincibilityTimer <= 0) {
      player2Invincible = false;
    }
  }

  return {
    ...state,
    player1Invincible,
    player1InvincibilityTimer,
    player2Invincible,
    player2InvincibilityTimer,
  };
}

/**
 * Gets the spawn position for a player.
 * @param {number} playerNum - Player number (1 or 2)
 * @returns {object} Spawn position with x, y, and direction
 */
export function getPlayerSpawnPosition(playerNum) {
  return PLAYER_SPAWN_POSITIONS[playerNum] || PLAYER_SPAWN_POSITIONS[1];
}
