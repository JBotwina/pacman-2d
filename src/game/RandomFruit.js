/**
 * Random fruit spawning system for Pacman 2D.
 * Spawns bonus fruits at random valid locations that appear and disappear over time.
 */

import { TILE_SIZE } from './Dots.js';
import { isWalkableTile } from './Collision.js';
import { FruitType, FRUIT_DATA } from './Fruit.js';

// Configuration for random fruit spawning
export const RANDOM_FRUIT_CONFIG = {
  // Minimum time between spawns (in ms)
  MIN_SPAWN_INTERVAL: 8000, // 8 seconds
  // Maximum time between spawns (in ms)
  MAX_SPAWN_INTERVAL: 15000, // 15 seconds
  // How long a random fruit stays before disappearing (in ms)
  FRUIT_LIFETIME: 7000, // 7 seconds
  // Maximum number of random fruits on screen at once
  MAX_ACTIVE_FRUITS: 2,
  // Time to show collected points popup (in ms)
  POINTS_DISPLAY_TIME: 1500,
  // Minimum distance from player to spawn (in tiles)
  MIN_SPAWN_DISTANCE: 3,
};

/**
 * All available random fruit types with their point values.
 * These are bonus items that randomly spawn and despawn.
 */
export const RANDOM_FRUIT_TYPES = [
  { type: FruitType.CHERRY, weight: 30 },      // Most common
  { type: FruitType.STRAWBERRY, weight: 25 },
  { type: FruitType.ORANGE, weight: 20 },
  { type: FruitType.APPLE, weight: 15 },
  { type: FruitType.GRAPES, weight: 7 },       // Rare
  { type: FruitType.GALAXIAN, weight: 2 },     // Very rare
  { type: FruitType.BELL, weight: 1 },         // Ultra rare
];

/**
 * Creates the initial random fruit state.
 * @returns {object} Initial random fruit state
 */
export function createInitialRandomFruitState() {
  return {
    activeFruits: [],
    nextSpawnTimer: getRandomSpawnInterval(),
    pointsPopups: [],
    nextFruitId: 1,
    lastSpawnTime: 0,
  };
}

/**
 * Gets a random spawn interval within the configured range.
 * @returns {number} Random interval in milliseconds
 */
export function getRandomSpawnInterval() {
  const { MIN_SPAWN_INTERVAL, MAX_SPAWN_INTERVAL } = RANDOM_FRUIT_CONFIG;
  return MIN_SPAWN_INTERVAL + Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);
}

/**
 * Selects a random fruit type based on weighted probabilities.
 * @param {number} level - Current game level (affects fruit selection)
 * @returns {string} Selected fruit type
 */
export function selectRandomFruitType(level) {
  const levelBonus = Math.min(level - 1, 5);
  let totalWeight = 0;
  const weightedTypes = RANDOM_FRUIT_TYPES.map(({ type, weight }) => {
    const adjustedWeight = weight + (weight < 10 ? levelBonus : 0);
    totalWeight += adjustedWeight;
    return { type, weight: adjustedWeight, cumulative: totalWeight };
  });

  const roll = Math.random() * totalWeight;
  for (const { type, cumulative } of weightedTypes) {
    if (roll <= cumulative) {
      return type;
    }
  }
  return FruitType.CHERRY;
}

/**
 * Finds all valid spawn positions on the maze.
 */
export function getValidSpawnPositions(maze, dotsState, activeFruits, playerPos, player2Pos = null) {
  const validPositions = [];
  const { MIN_SPAWN_DISTANCE } = RANDOM_FRUIT_CONFIG;

  const playerTileX = Math.floor(playerPos.x / TILE_SIZE);
  const playerTileY = Math.floor(playerPos.y / TILE_SIZE);

  let player2TileX = -100, player2TileY = -100;
  if (player2Pos) {
    player2TileX = Math.floor(player2Pos.x / TILE_SIZE);
    player2TileY = Math.floor(player2Pos.y / TILE_SIZE);
  }

  const fruitTiles = new Set(activeFruits.map(f => f.tileX + ',' + f.tileY));

  const dotTiles = new Set();
  if (dotsState && dotsState.dots) {
    for (const dotId in dotsState.dots) {
      const dot = dotsState.dots[dotId];
      if (!dot.collected) {
        dotTiles.add(dot.tileX + ',' + dot.tileY);
      }
    }
  }

  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (!isWalkableTile(maze, x, y)) continue;

      const tileKey = x + ',' + y;
      if (fruitTiles.has(tileKey)) continue;
      if (dotTiles.has(tileKey)) continue;

      const distToPlayer1 = Math.abs(x - playerTileX) + Math.abs(y - playerTileY);
      if (distToPlayer1 < MIN_SPAWN_DISTANCE) continue;

      if (player2Pos) {
        const distToPlayer2 = Math.abs(x - player2TileX) + Math.abs(y - player2TileY);
        if (distToPlayer2 < MIN_SPAWN_DISTANCE) continue;
      }

      validPositions.push({ tileX: x, tileY: y });
    }
  }

  return validPositions;
}

/**
 * Creates a new random fruit at the specified tile position.
 */
export function createRandomFruit(id, tileX, tileY, type) {
  return {
    id,
    tileX,
    tileY,
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
    type,
    lifetime: RANDOM_FRUIT_CONFIG.FRUIT_LIFETIME,
    spawnTime: Date.now(),
    fadeIn: 500,
  };
}

/**
 * Attempts to spawn a new random fruit.
 */
export function trySpawnRandomFruit(state, maze, dotsState, playerPos, player2Pos, level) {
  if (state.activeFruits.length >= RANDOM_FRUIT_CONFIG.MAX_ACTIVE_FRUITS) {
    return state;
  }

  const validPositions = getValidSpawnPositions(maze, dotsState, state.activeFruits, playerPos, player2Pos);
  if (validPositions.length === 0) return state;

  const randomIndex = Math.floor(Math.random() * validPositions.length);
  const { tileX, tileY } = validPositions[randomIndex];
  const fruitType = selectRandomFruitType(level);
  const newFruit = createRandomFruit(state.nextFruitId, tileX, tileY, fruitType);

  return {
    ...state,
    activeFruits: [...state.activeFruits, newFruit],
    nextFruitId: state.nextFruitId + 1,
    lastSpawnTime: Date.now(),
  };
}

/**
 * Updates all random fruit timers and handles expiration.
 */
export function updateRandomFruitTimers(state, deltaTime) {
  let nextSpawnTimer = state.nextSpawnTimer - deltaTime;
  let shouldTrySpawn = false;

  if (nextSpawnTimer <= 0) {
    shouldTrySpawn = true;
    nextSpawnTimer = getRandomSpawnInterval();
  }

  const activeFruits = state.activeFruits
    .map(fruit => ({
      ...fruit,
      lifetime: fruit.lifetime - deltaTime,
      fadeIn: Math.max(0, fruit.fadeIn - deltaTime),
    }))
    .filter(fruit => fruit.lifetime > 0);

  const pointsPopups = state.pointsPopups
    .map(popup => ({ ...popup, timer: popup.timer - deltaTime }))
    .filter(popup => popup.timer > 0);

  return { ...state, nextSpawnTimer, activeFruits, pointsPopups, shouldTrySpawn };
}

/**
 * Checks if player is colliding with any random fruit.
 */
export function checkRandomFruitCollision(playerX, playerY, activeFruits) {
  const playerTileX = Math.floor(playerX / TILE_SIZE);
  const playerTileY = Math.floor(playerY / TILE_SIZE);

  for (const fruit of activeFruits) {
    if (fruit.tileX === playerTileX && fruit.tileY === playerTileY) {
      return fruit;
    }
  }
  return null;
}

/**
 * Collects a random fruit and returns the updated state with points.
 */
export function collectRandomFruit(state, fruit) {
  const fruitData = FRUIT_DATA[fruit.type];
  const points = fruitData ? fruitData.points : 0;

  const activeFruits = state.activeFruits.filter(f => f.id !== fruit.id);
  const pointsPopup = {
    id: fruit.id,
    x: fruit.x,
    y: fruit.y,
    points,
    timer: RANDOM_FRUIT_CONFIG.POINTS_DISPLAY_TIME,
  };

  return {
    newState: { ...state, activeFruits, pointsPopups: [...state.pointsPopups, pointsPopup] },
    points,
  };
}

/**
 * Main update function for the random fruit system.
 */
export function updateRandomFruits(state, deltaTime, maze, dotsState, playerPos, player2Pos, level) {
  let updatedState = updateRandomFruitTimers(state, deltaTime);
  let collectedPoints = 0;

  const fruit1 = checkRandomFruitCollision(playerPos.x, playerPos.y, updatedState.activeFruits);
  if (fruit1) {
    const { newState, points } = collectRandomFruit(updatedState, fruit1);
    updatedState = newState;
    collectedPoints += points;
  }

  if (player2Pos) {
    const fruit2 = checkRandomFruitCollision(player2Pos.x, player2Pos.y, updatedState.activeFruits);
    if (fruit2) {
      const { newState, points } = collectRandomFruit(updatedState, fruit2);
      updatedState = newState;
      collectedPoints += points;
    }
  }

  if (updatedState.shouldTrySpawn) {
    updatedState = trySpawnRandomFruit(updatedState, maze, dotsState, playerPos, player2Pos, level);
    delete updatedState.shouldTrySpawn;
  }

  return { newState: updatedState, collectedPoints };
}

/**
 * Resets random fruit state for a new level.
 */
export function resetRandomFruits() {
  return createInitialRandomFruitState();
}

/**
 * Gets the visual data for a random fruit (for rendering).
 */
export function getRandomFruitVisualData(fruit) {
  const fruitData = FRUIT_DATA[fruit.type];
  const fadeInProgress = 1 - (fruit.fadeIn / 500);
  const fadeOutStart = 2000;
  let fadeOutOpacity = 1;
  
  if (fruit.lifetime < fadeOutStart) {
    const blinkRate = 200;
    const blinkPhase = Math.floor(fruit.lifetime / blinkRate) % 2;
    fadeOutOpacity = blinkPhase === 0 ? 0.3 : 1;
  }

  return {
    x: fruit.x,
    y: fruit.y,
    type: fruit.type,
    color: fruitData ? fruitData.color : '#ffffff',
    emoji: fruitData ? fruitData.emoji : '?',
    opacity: Math.min(fadeInProgress, fadeOutOpacity),
    isBlinking: fruit.lifetime < fadeOutStart,
  };
}
