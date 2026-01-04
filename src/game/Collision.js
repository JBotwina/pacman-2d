/**
 * Tile-based collision detection system for Pacman 2D.
 * Handles collisions between entities and maze walls, dots, and power pellets.
 */

import { TILE_SIZE } from './Dots.js';

/**
 * Tile types that block movement.
 */
const BLOCKING_TILES = new Set([1]); // 1 = wall

/**
 * Converts pixel coordinates to tile coordinates.
 * @param {number} pixelX - X position in pixels
 * @param {number} pixelY - Y position in pixels
 * @returns {{ tileX: number, tileY: number }} Tile coordinates
 */
export function pixelToTile(pixelX, pixelY) {
  return {
    tileX: Math.floor(pixelX / TILE_SIZE),
    tileY: Math.floor(pixelY / TILE_SIZE),
  };
}

/**
 * Converts tile coordinates to pixel coordinates (center of tile).
 * @param {number} tileX - Tile X coordinate
 * @param {number} tileY - Tile Y coordinate
 * @returns {{ x: number, y: number }} Pixel coordinates at tile center
 */
export function tileToPixel(tileX, tileY) {
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
  };
}

/**
 * Checks if a tile is walkable (not a wall).
 * @param {number[][]} maze - 2D array of tile types
 * @param {number} tileX - Tile X coordinate
 * @param {number} tileY - Tile Y coordinate
 * @returns {boolean} True if the tile is walkable
 */
export function isWalkableTile(maze, tileX, tileY) {
  // Out of bounds is not walkable
  if (tileY < 0 || tileY >= maze.length) {
    return false;
  }
  if (tileX < 0 || tileX >= maze[0].length) {
    return false;
  }

  const tileType = maze[tileY][tileX];
  return !BLOCKING_TILES.has(tileType);
}

/**
 * Checks if a tile is a wall.
 * @param {number[][]} maze - 2D array of tile types
 * @param {number} tileX - Tile X coordinate
 * @param {number} tileY - Tile Y coordinate
 * @returns {boolean} True if the tile is a wall
 */
export function isWallTile(maze, tileX, tileY) {
  if (tileY < 0 || tileY >= maze.length) {
    return true; // Treat out of bounds as wall
  }
  if (tileX < 0 || tileX >= maze[0].length) {
    return true;
  }

  return maze[tileY][tileX] === 1;
}

/**
 * Gets the bounding box of an entity.
 * @param {number} x - Entity center X position
 * @param {number} y - Entity center Y position
 * @param {number} size - Entity size (width and height)
 * @returns {{ left: number, right: number, top: number, bottom: number }} Bounding box
 */
export function getEntityBounds(x, y, size) {
  const halfSize = size / 2;
  return {
    left: x - halfSize,
    right: x + halfSize,
    top: y - halfSize,
    bottom: y + halfSize,
  };
}

/**
 * Checks if an entity at a given position would collide with any walls.
 * Uses AABB collision with all tiles the entity overlaps.
 * @param {number[][]} maze - 2D array of tile types
 * @param {number} x - Entity center X position in pixels
 * @param {number} y - Entity center Y position in pixels
 * @param {number} entitySize - Entity size (width and height)
 * @returns {boolean} True if collision with wall detected
 */
export function checkWallCollision(maze, x, y, entitySize) {
  const bounds = getEntityBounds(x, y, entitySize);

  // Get all tiles the entity overlaps
  const startTileX = Math.floor(bounds.left / TILE_SIZE);
  const endTileX = Math.floor(bounds.right / TILE_SIZE);
  const startTileY = Math.floor(bounds.top / TILE_SIZE);
  const endTileY = Math.floor(bounds.bottom / TILE_SIZE);

  // Check each overlapped tile
  for (let tileY = startTileY; tileY <= endTileY; tileY++) {
    for (let tileX = startTileX; tileX <= endTileX; tileX++) {
      if (isWallTile(maze, tileX, tileY)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if an entity can move to a new position without colliding with walls.
 * @param {number[][]} maze - 2D array of tile types
 * @param {number} newX - Target X position in pixels
 * @param {number} newY - Target Y position in pixels
 * @param {number} entitySize - Entity size (width and height)
 * @returns {boolean} True if the move is valid
 */
export function canMoveTo(maze, newX, newY, entitySize) {
  return !checkWallCollision(maze, newX, newY, entitySize);
}

/**
 * Attempts to move an entity to a new position, sliding along walls if needed.
 * Returns the valid position after collision resolution.
 * @param {number[][]} maze - 2D array of tile types
 * @param {number} currentX - Current X position
 * @param {number} currentY - Current Y position
 * @param {number} targetX - Target X position
 * @param {number} targetY - Target Y position
 * @param {number} entitySize - Entity size
 * @returns {{ x: number, y: number }} Valid position after collision resolution
 */
export function resolveMovement(maze, currentX, currentY, targetX, targetY, entitySize) {
  // Try full movement first
  if (canMoveTo(maze, targetX, targetY, entitySize)) {
    return { x: targetX, y: targetY };
  }

  // Try horizontal movement only
  if (canMoveTo(maze, targetX, currentY, entitySize)) {
    return { x: targetX, y: currentY };
  }

  // Try vertical movement only
  if (canMoveTo(maze, currentX, targetY, entitySize)) {
    return { x: currentX, y: targetY };
  }

  // No movement possible, stay in place
  return { x: currentX, y: currentY };
}

/**
 * Checks collision between two entities using AABB.
 * @param {number} x1 - Entity 1 center X
 * @param {number} y1 - Entity 1 center Y
 * @param {number} size1 - Entity 1 size
 * @param {number} x2 - Entity 2 center X
 * @param {number} y2 - Entity 2 center Y
 * @param {number} size2 - Entity 2 size
 * @returns {boolean} True if entities are colliding
 */
export function checkEntityCollision(x1, y1, size1, x2, y2, size2) {
  const bounds1 = getEntityBounds(x1, y1, size1);
  const bounds2 = getEntityBounds(x2, y2, size2);

  return (
    bounds1.left < bounds2.right &&
    bounds1.right > bounds2.left &&
    bounds1.top < bounds2.bottom &&
    bounds1.bottom > bounds2.top
  );
}

/**
 * Checks if an entity at a position is in the same tile as a dot.
 * Uses tile-based collision for dot collection.
 * @param {number} entityX - Entity X position in pixels
 * @param {number} entityY - Entity Y position in pixels
 * @param {object} dot - Dot object with tileX and tileY
 * @returns {boolean} True if entity is in the same tile as the dot
 */
export function checkDotCollision(entityX, entityY, dot) {
  if (dot.collected) {
    return false;
  }

  const { tileX: entityTileX, tileY: entityTileY } = pixelToTile(entityX, entityY);
  return entityTileX === dot.tileX && entityTileY === dot.tileY;
}

/**
 * Gets all dots at a given position.
 * @param {object} dotsState - Dots state object
 * @param {number} x - Entity X position in pixels
 * @param {number} y - Entity Y position in pixels
 * @returns {object[]} Array of dots at the position
 */
export function getDotsAtPosition(dotsState, x, y) {
  const collidingDots = [];

  for (const dotId in dotsState.dots) {
    const dot = dotsState.dots[dotId];
    if (checkDotCollision(x, y, dot)) {
      collidingDots.push(dot);
    }
  }

  return collidingDots;
}

/**
 * Clamps a position within the maze bounds.
 * @param {number[][]} maze - 2D array of tile types
 * @param {number} x - X position in pixels
 * @param {number} y - Y position in pixels
 * @param {number} entitySize - Entity size
 * @returns {{ x: number, y: number }} Clamped position
 */
export function clampToMazeBounds(maze, x, y, entitySize) {
  const halfSize = entitySize / 2;
  const mazeWidth = maze[0].length * TILE_SIZE;
  const mazeHeight = maze.length * TILE_SIZE;

  return {
    x: Math.max(halfSize, Math.min(mazeWidth - halfSize, x)),
    y: Math.max(halfSize, Math.min(mazeHeight - halfSize, y)),
  };
}

// Re-export TILE_SIZE for convenience
export { TILE_SIZE };
