/**
 * Dot system for Pacman 2D.
 * Handles dot placement, collection tracking, and scoring.
 */

export const TILE_SIZE = 20;
export const DOT_POINTS = 10;

/**
 * Dot types - regular dots and power pellets.
 */
export const DotType = {
  REGULAR: 'regular',
  POWER: 'power',
};

/**
 * Creates a single dot at the specified tile position.
 * @param {number} tileX - Tile X coordinate
 * @param {number} tileY - Tile Y coordinate
 * @param {string} type - Dot type (regular or power)
 * @returns {object} Dot object
 */
export function createDot(tileX, tileY, type = DotType.REGULAR) {
  return {
    id: `dot-${tileX}-${tileY}`,
    tileX,
    tileY,
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
    type,
    collected: false,
  };
}

/**
 * Creates the initial dot state for a level.
 * Dots are placed on all empty tiles in the maze.
 * @param {number[][]} maze - 2D array where 0 = empty (place dot), 1 = wall
 * @returns {object} Dots state
 */
export function createDotsFromMaze(maze) {
  const dots = {};
  let totalDots = 0;

  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      if (maze[y][x] === 0) {
        const dot = createDot(x, y, DotType.REGULAR);
        dots[dot.id] = dot;
        totalDots++;
      }
    }
  }

  return {
    dots,
    totalDots,
    collectedDots: 0,
  };
}

/**
 * Creates a default maze layout for testing.
 * 0 = empty (dot placement), 1 = wall
 * @returns {number[][]} Default maze layout
 */
export function createDefaultMaze() {
  // 20x15 tile maze (400x300 pixels with 20px tiles)
  return [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];
}

/**
 * Checks if a position collides with a dot.
 * Uses tile-based collision - if entity is in same tile as dot, it's collected.
 * @param {number} x - Entity X position (pixels)
 * @param {number} y - Entity Y position (pixels)
 * @param {object} dot - Dot object
 * @returns {boolean} True if collision detected
 */
export function checkDotCollision(x, y, dot) {
  if (dot.collected) {
    return false;
  }

  const entityTileX = Math.floor(x / TILE_SIZE);
  const entityTileY = Math.floor(y / TILE_SIZE);

  return entityTileX === dot.tileX && entityTileY === dot.tileY;
}

/**
 * Collects a dot and returns the points earned.
 * @param {object} dotsState - Current dots state
 * @param {string} dotId - ID of dot to collect
 * @returns {object} { newDotsState, points } - Updated state and points earned
 */
export function collectDot(dotsState, dotId) {
  const dot = dotsState.dots[dotId];
  if (!dot || dot.collected) {
    return { newDotsState: dotsState, points: 0 };
  }

  const newDots = {
    ...dotsState.dots,
    [dotId]: { ...dot, collected: true },
  };

  return {
    newDotsState: {
      ...dotsState,
      dots: newDots,
      collectedDots: dotsState.collectedDots + 1,
    },
    points: DOT_POINTS,
  };
}

/**
 * Checks and collects any dots at the given position.
 * @param {object} dotsState - Current dots state
 * @param {number} x - Entity X position (pixels)
 * @param {number} y - Entity Y position (pixels)
 * @returns {object} { newDotsState, totalPoints } - Updated state and total points earned
 */
export function collectDotsAtPosition(dotsState, x, y) {
  let totalPoints = 0;
  let currentState = dotsState;

  for (const dotId in dotsState.dots) {
    const dot = dotsState.dots[dotId];
    if (checkDotCollision(x, y, dot)) {
      const { newDotsState, points } = collectDot(currentState, dotId);
      currentState = newDotsState;
      totalPoints += points;
    }
  }

  return { newDotsState: currentState, totalPoints };
}

/**
 * Checks if all dots have been collected.
 * @param {object} dotsState - Current dots state
 * @returns {boolean} True if all dots collected
 */
export function allDotsCollected(dotsState) {
  return dotsState.collectedDots >= dotsState.totalDots;
}

/**
 * Gets all uncollected dots for rendering.
 * @param {object} dotsState - Current dots state
 * @returns {object[]} Array of uncollected dot objects
 */
export function getUncollectedDots(dotsState) {
  return Object.values(dotsState.dots).filter((dot) => !dot.collected);
}
