/**
 * Bonus fruit system for Pacman 2D.
 * Handles fruit spawning, collection, and point values per level.
 */

import { TILE_SIZE } from './Dots.js';

// Fruit spawn position (center of maze)
// For a 20x15 tile maze, center is approximately tile (9, 7) or (10, 7)
export const FRUIT_SPAWN_TILE = { x: 9, y: 7 };

// Dot thresholds for fruit spawning (adjusted for smaller maze with ~116 dots)
// First fruit at ~25% of dots, second at ~60%
export const FRUIT_SPAWN_THRESHOLDS = [30, 70];

// How long fruit stays visible before disappearing (in milliseconds)
export const FRUIT_DURATION = 10000; // 10 seconds

/**
 * Fruit types with their properties.
 * Point values increase with level.
 */
export const FruitType = {
  CHERRY: 'cherry',
  STRAWBERRY: 'strawberry',
  ORANGE: 'orange',
  APPLE: 'apple',
  GRAPES: 'grapes',
  GALAXIAN: 'galaxian',
  BELL: 'bell',
  KEY: 'key',
};

/**
 * Fruit data by type: points, color, and emoji for rendering.
 */
export const FRUIT_DATA = {
  [FruitType.CHERRY]: { points: 100, color: '#ff0000', emoji: '🍒' },
  [FruitType.STRAWBERRY]: { points: 300, color: '#ff6b6b', emoji: '🍓' },
  [FruitType.ORANGE]: { points: 500, color: '#ffa500', emoji: '🍊' },
  [FruitType.APPLE]: { points: 700, color: '#ff4444', emoji: '🍎' },
  [FruitType.GRAPES]: { points: 1000, color: '#9b59b6', emoji: '🍇' },
  [FruitType.GALAXIAN]: { points: 2000, color: '#3498db', emoji: '🚀' },
  [FruitType.BELL]: { points: 3000, color: '#f1c40f', emoji: '🔔' },
  [FruitType.KEY]: { points: 5000, color: '#00ffff', emoji: '🔑' },
};

/**
 * Maps level number to fruit type.
 * Levels 1-2: Cherry
 * Level 3-4: Strawberry
 * Levels 5-6: Orange
 * Levels 7-8: Apple
 * Levels 9-10: Grapes
 * Levels 11-12: Galaxian
 * Levels 13-14: Bell
 * Levels 15+: Key
 */
export function getFruitForLevel(level) {
  if (level <= 2) return FruitType.CHERRY;
  if (level <= 4) return FruitType.STRAWBERRY;
  if (level <= 6) return FruitType.ORANGE;
  if (level <= 8) return FruitType.APPLE;
  if (level <= 10) return FruitType.GRAPES;
  if (level <= 12) return FruitType.GALAXIAN;
  if (level <= 14) return FruitType.BELL;
  return FruitType.KEY;
}

/**
 * Gets the point value for a fruit type.
 * @param {string} fruitType - The fruit type
 * @returns {number} Point value
 */
export function getFruitPoints(fruitType) {
  return FRUIT_DATA[fruitType]?.points || 0;
}

/**
 * Gets the fruit data for rendering.
 * @param {string} fruitType - The fruit type
 * @returns {object} Fruit data with points, color, and emoji
 */
export function getFruitData(fruitType) {
  return FRUIT_DATA[fruitType] || null;
}

/**
 * Creates the initial fruit state.
 * @returns {object} Initial fruit state
 */
export function createInitialFruitState() {
  return {
    active: false,
    type: null,
    x: FRUIT_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2,
    y: FRUIT_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2,
    timer: 0,
    spawnCount: 0, // How many fruits have spawned this level (max 2)
    lastCollectedPoints: 0, // For displaying score popup
    showPointsTimer: 0, // Timer for showing collected points
  };
}

/**
 * Checks if a fruit should spawn based on dots collected.
 * @param {number} dotsCollected - Number of dots collected
 * @param {number} spawnCount - How many fruits have spawned this level
 * @returns {boolean} True if fruit should spawn
 */
export function shouldSpawnFruit(dotsCollected, spawnCount) {
  if (spawnCount >= FRUIT_SPAWN_THRESHOLDS.length) {
    return false; // Already spawned max fruits for this level
  }
  return dotsCollected >= FRUIT_SPAWN_THRESHOLDS[spawnCount];
}

/**
 * Spawns a fruit for the current level.
 * @param {object} fruitState - Current fruit state
 * @param {number} level - Current game level
 * @returns {object} Updated fruit state with active fruit
 */
export function spawnFruit(fruitState, level) {
  const fruitType = getFruitForLevel(level);
  return {
    ...fruitState,
    active: true,
    type: fruitType,
    timer: FRUIT_DURATION,
    spawnCount: fruitState.spawnCount + 1,
  };
}

/**
 * Updates fruit timer and handles expiration.
 * @param {object} fruitState - Current fruit state
 * @param {number} deltaTime - Time elapsed in milliseconds
 * @returns {object} Updated fruit state
 */
export function updateFruitTimer(fruitState, deltaTime) {
  if (!fruitState.active) {
    // Update points display timer if showing
    if (fruitState.showPointsTimer > 0) {
      return {
        ...fruitState,
        showPointsTimer: Math.max(0, fruitState.showPointsTimer - deltaTime),
      };
    }
    return fruitState;
  }

  const newTimer = fruitState.timer - deltaTime;

  if (newTimer <= 0) {
    // Fruit expired, remove it
    return {
      ...fruitState,
      active: false,
      type: null,
      timer: 0,
    };
  }

  return {
    ...fruitState,
    timer: newTimer,
  };
}

/**
 * Checks if player is colliding with the fruit.
 * Uses tile-based collision.
 * @param {number} playerX - Player X position in pixels
 * @param {number} playerY - Player Y position in pixels
 * @param {object} fruitState - Current fruit state
 * @returns {boolean} True if collision detected
 */
export function checkFruitCollision(playerX, playerY, fruitState) {
  if (!fruitState.active) {
    return false;
  }

  const playerTileX = Math.floor(playerX / TILE_SIZE);
  const playerTileY = Math.floor(playerY / TILE_SIZE);

  return playerTileX === FRUIT_SPAWN_TILE.x && playerTileY === FRUIT_SPAWN_TILE.y;
}

/**
 * Collects the fruit and returns points earned.
 * @param {object} fruitState - Current fruit state
 * @returns {object} { newFruitState, points } - Updated state and points earned
 */
export function collectFruit(fruitState) {
  if (!fruitState.active) {
    return { newFruitState: fruitState, points: 0 };
  }

  const points = getFruitPoints(fruitState.type);

  return {
    newFruitState: {
      ...fruitState,
      active: false,
      type: null,
      timer: 0,
      lastCollectedPoints: points,
      showPointsTimer: 2000, // Show points for 2 seconds
    },
    points,
  };
}

/**
 * Resets fruit state for a new level.
 * @returns {object} Fresh fruit state for new level
 */
export function resetFruitForLevel() {
  return createInitialFruitState();
}
