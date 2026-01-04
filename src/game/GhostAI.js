/**
 * Ghost AI system for Pacman 2D.
 * Implements classic Pac-Man ghost behaviors:
 * - Blinky (Red): Direct chase - targets Pac-Man's current position
 * - Pinky (Pink): Ambush - targets 4 tiles ahead of Pac-Man
 * - Inky (Cyan): Flanking - uses Blinky's position for complex targeting
 * - Clyde (Orange): Shy - chases when far, scatters when close
 */

import { TILE_SIZE } from './Dots.js';
import { isWalkableTile, pixelToTile } from './Collision.js';

/**
 * Ghost names and their properties.
 */
export const GhostType = {
  BLINKY: 'blinky',
  PINKY: 'pinky',
  INKY: 'inky',
  CLYDE: 'clyde',
};

/**
 * Ghost behavior modes.
 */
export const GhostMode = {
  CHASE: 'chase',
  SCATTER: 'scatter',
  FRIGHTENED: 'frightened',
  EATEN: 'eaten',
  IN_HOUSE: 'in_house',
};

/**
 * Direction vectors for ghost movement.
 */
export const Direction = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
  NONE: { dx: 0, dy: 0 },
};

/**
 * Scatter corner targets for each ghost (tile coordinates).
 * These are the corners ghosts retreat to in scatter mode.
 * For the 20x15 maze: corners are at row 1 and row 13.
 */
const SCATTER_TARGETS = {
  [GhostType.BLINKY]: { tileX: 18, tileY: 1 },   // Top-right
  [GhostType.PINKY]: { tileX: 1, tileY: 1 },     // Top-left
  [GhostType.INKY]: { tileX: 18, tileY: 13 },    // Bottom-right
  [GhostType.CLYDE]: { tileX: 1, tileY: 13 },    // Bottom-left
};

/**
 * Starting positions for ghosts (pixel coordinates).
 * Ghost house is near the center of the 20x15 maze.
 * Ghosts spawn inside the ghost pen and bounce around before release.
 */
export const GHOST_START_POSITIONS = {
  [GhostType.BLINKY]: { x: TILE_SIZE * 10, y: TILE_SIZE * 7.5 },    // Center-ish of ghost house
  [GhostType.PINKY]: { x: TILE_SIZE * 10, y: TILE_SIZE * 7.5 },     // Same position (Blinky exits first)
  [GhostType.INKY]: { x: TILE_SIZE * 9, y: TILE_SIZE * 7.5 },       // Left side
  [GhostType.CLYDE]: { x: TILE_SIZE * 11, y: TILE_SIZE * 7.5 },     // Right side
};

/**
 * Ghost house boundaries for bouncing behavior.
 * Expanded ghost pen (pixel bounds) so ghosts have more room before release.
 */
const GHOST_HOUSE_BOUNDS = {
  minX: TILE_SIZE * 6.5,
  maxX: TILE_SIZE * 13.5,
  minY: TILE_SIZE * 6.5,
  maxY: TILE_SIZE * 8.5,
};

/**
 * Ghost house location and exit point.
 * Exit is above the ghost house area.
 */
const GHOST_HOUSE_CENTER = { tileX: 11, tileY: 7.5 };
const GHOST_HOUSE_EXIT = { tileX: 11, tileY: 6 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getNormalizedDirection(dx, dy) {
  const length = Math.hypot(dx, dy);
  if (length <= 0) {
    return { dx: 0, dy: 0 };
  }
  return { dx: dx / length, dy: dy / length };
}

/**
 * Release delays for each ghost (ms after game start).
 */
const GHOST_RELEASE_DELAYS = {
  [GhostType.BLINKY]: 0,      // Blinky starts immediately
  [GhostType.PINKY]: 2000,    // 2 seconds
  [GhostType.INKY]: 4000,     // 4 seconds
  [GhostType.CLYDE]: 6000,    // 6 seconds
};

/**
 * Mode timing constants (milliseconds).
 * More aggressive: shorter scatter, longer chase
 */
export const MODE_TIMINGS = {
  scatter: 2000,    // 2 seconds of scatter (short breathing room)
  chase: 30000,     // 30 seconds of chase (aggressive hunting)
};

/**
 * Ghost speed in pixels per millisecond.
 * Slightly faster for more aggressive gameplay.
 */
const GHOST_SPEED = 0.14;
const FRIGHTENED_SPEED = 0.08;
const EATEN_SPEED = 0.25;

/**
 * Speed for bouncing in ghost house (slower than normal movement).
 */
const IN_HOUSE_SPEED = 0.06;

/**
 * Creates a ghost with initial state.
 * @param {string} type - Ghost type (blinky, pinky, inky, clyde)
 * @returns {object} Ghost state object
 */
export function createGhost(type) {
  const startPos = GHOST_START_POSITIONS[type] || GHOST_START_POSITIONS[GhostType.BLINKY];
  const releaseDelay = GHOST_RELEASE_DELAYS[type] || 0;

  // Each ghost starts bouncing in a different direction for visual variety
  const bounceDirections = {
    [GhostType.BLINKY]: { dx: 1, dy: -1 },
    [GhostType.PINKY]: { dx: -1, dy: 1 },
    [GhostType.INKY]: { dx: -1, dy: -1 },
    [GhostType.CLYDE]: { dx: 1, dy: 1 },
  };

  return {
    type,
    x: startPos.x,
    y: startPos.y,
    direction: Direction.UP, // Initial direction when released
    bounceDirection: bounceDirections[type] || { dx: 0, dy: -1 }, // Direction for bouncing in house
    mode: GhostMode.IN_HOUSE,
    previousMode: GhostMode.SCATTER,
    targetTile: { tileX: 0, tileY: 0 },
    speed: GHOST_SPEED,
    timeInHouse: 0,
    releaseDelay,
    isExiting: false, // True when ghost is moving toward exit
  };
}

/**
 * Creates all four ghosts.
 * @returns {object} Object with all ghost states keyed by type
 */
export function createAllGhosts() {
  return {
    [GhostType.BLINKY]: createGhost(GhostType.BLINKY),
    [GhostType.PINKY]: createGhost(GhostType.PINKY),
    [GhostType.INKY]: createGhost(GhostType.INKY),
    [GhostType.CLYDE]: createGhost(GhostType.CLYDE),
  };
}

/**
 * Calculates the squared distance between two tile positions.
 * @param {number} x1 - First tile X
 * @param {number} y1 - First tile Y
 * @param {number} x2 - Second tile X
 * @param {number} y2 - Second tile Y
 * @returns {number} Squared distance
 */
function distanceSquared(x1, y1, x2, y2) {
  return (x2 - x1) ** 2 + (y2 - y1) ** 2;
}

/**
 * Gets the opposite direction.
 * @param {object} dir - Direction object
 * @returns {object} Opposite direction
 */
function getOppositeDirection(dir) {
  if (dir === Direction.UP) return Direction.DOWN;
  if (dir === Direction.DOWN) return Direction.UP;
  if (dir === Direction.LEFT) return Direction.RIGHT;
  if (dir === Direction.RIGHT) return Direction.LEFT;
  return Direction.NONE;
}

/**
 * Gets all possible directions from current tile.
 * @param {number[][]} maze - The maze grid
 * @param {number} tileX - Current tile X
 * @param {number} tileY - Current tile Y
 * @param {object} currentDir - Current direction (to exclude reverse)
 * @returns {object[]} Array of valid directions
 */
function getValidDirections(maze, tileX, tileY, currentDir) {
  const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
  const opposite = getOppositeDirection(currentDir);

  return directions.filter(dir => {
    // Ghosts cannot reverse direction
    if (dir.dx === opposite.dx && dir.dy === opposite.dy) {
      return false;
    }

    const nextTileX = tileX + dir.dx;
    const nextTileY = tileY + dir.dy;

    return isWalkableTile(maze, nextTileX, nextTileY);
  });
}

/**
 * Calculates Blinky's target tile (direct chase).
 * Blinky always targets Pac-Man's current tile.
 * @param {object} playerPos - Player position {x, y}
 * @returns {object} Target tile {tileX, tileY}
 */
export function calculateBlinkyTarget(playerPos) {
  return pixelToTile(playerPos.x, playerPos.y);
}

/**
 * Calculates Pinky's target tile (ambush).
 * Pinky targets 4 tiles ahead of Pac-Man in their current direction.
 * @param {object} playerPos - Player position {x, y}
 * @param {object} playerDir - Player direction {dx, dy}
 * @returns {object} Target tile {tileX, tileY}
 */
export function calculatePinkyTarget(playerPos, playerDir) {
  const playerTile = pixelToTile(playerPos.x, playerPos.y);

  // Target 4 tiles ahead of Pac-Man
  return {
    tileX: playerTile.tileX + playerDir.dx * 4,
    tileY: playerTile.tileY + playerDir.dy * 4,
  };
}

/**
 * Calculates Inky's target tile (flanking).
 * Inky uses a complex targeting: draws a vector from Blinky to 2 tiles ahead
 * of Pac-Man, then doubles that vector.
 * @param {object} playerPos - Player position {x, y}
 * @param {object} playerDir - Player direction {dx, dy}
 * @param {object} blinkyPos - Blinky's position {x, y}
 * @returns {object} Target tile {tileX, tileY}
 */
export function calculateInkyTarget(playerPos, playerDir, blinkyPos) {
  const playerTile = pixelToTile(playerPos.x, playerPos.y);
  const blinkyTile = pixelToTile(blinkyPos.x, blinkyPos.y);

  // Get position 2 tiles ahead of Pac-Man
  const aheadX = playerTile.tileX + playerDir.dx * 2;
  const aheadY = playerTile.tileY + playerDir.dy * 2;

  // Double the vector from Blinky to that position
  const vectorX = aheadX - blinkyTile.tileX;
  const vectorY = aheadY - blinkyTile.tileY;

  return {
    tileX: blinkyTile.tileX + vectorX * 2,
    tileY: blinkyTile.tileY + vectorY * 2,
  };
}

/**
 * Calculates Clyde's target tile (shy/wandering).
 * Clyde chases Pac-Man when more than 8 tiles away,
 * but retreats to his scatter corner when closer.
 * @param {object} playerPos - Player position {x, y}
 * @param {object} clydePos - Clyde's position {x, y}
 * @returns {object} Target tile {tileX, tileY}
 */
export function calculateClydeTarget(playerPos, clydePos) {
  const playerTile = pixelToTile(playerPos.x, playerPos.y);
  const clydeTile = pixelToTile(clydePos.x, clydePos.y);

  const distance = Math.sqrt(distanceSquared(
    clydeTile.tileX, clydeTile.tileY,
    playerTile.tileX, playerTile.tileY
  ));

  // If more than 5 tiles away, chase directly (reduced from 8 for more aggression)
  if (distance > 5) {
    return playerTile;
  }

  // Otherwise, retreat to scatter corner
  return SCATTER_TARGETS[GhostType.CLYDE];
}

/**
 * Chooses the nearest player to target.
 * @param {object} ghost - Ghost state object
 * @param {object} player1Pos - Player 1 position {x, y}
 * @param {object} player2Pos - Player 2 position {x, y} (can be null)
 * @returns {object} The nearest player position
 */
function getNearestPlayer(ghost, player1Pos, player2Pos) {
  if (!player2Pos) {
    return player1Pos;
  }

  const dist1 = distanceSquared(ghost.x, ghost.y, player1Pos.x, player1Pos.y);
  const dist2 = distanceSquared(ghost.x, ghost.y, player2Pos.x, player2Pos.y);

  return dist1 <= dist2 ? player1Pos : player2Pos;
}

/**
 * Gets the target tile for a ghost based on its type and current mode.
 * Ghosts will target the nearest player in 2-player mode.
 * @param {object} ghost - Ghost state object
 * @param {object} player1Pos - Player 1 position {x, y}
 * @param {object} player1Dir - Player 1 direction {dx, dy}
 * @param {object} player2Pos - Player 2 position {x, y} (can be null)
 * @param {object} player2Dir - Player 2 direction {dx, dy} (can be null)
 * @param {object} ghosts - All ghost states (needed for Inky)
 * @returns {object} Target tile {tileX, tileY}
 */
export function getGhostTarget(ghost, player1Pos, player1Dir, player2Pos, player2Dir, ghosts) {
  // In scatter mode, return scatter corner
  if (ghost.mode === GhostMode.SCATTER) {
    return SCATTER_TARGETS[ghost.type];
  }

  // In frightened mode, target is random (handled by movement logic)
  if (ghost.mode === GhostMode.FRIGHTENED) {
    return { tileX: 0, tileY: 0 }; // Ignored in frightened mode
  }

  // Eaten ghosts return to ghost house
  if (ghost.mode === GhostMode.EATEN) {
    return GHOST_HOUSE_CENTER;
  }

  // Determine which player to target (nearest in 2P mode)
  const targetPlayer = getNearestPlayer(ghost, player1Pos, player2Pos);
  const targetDir = (targetPlayer === player2Pos && player2Dir) ? player2Dir : player1Dir;

  // Chase mode - use unique targeting for each ghost
  switch (ghost.type) {
    case GhostType.BLINKY:
      return calculateBlinkyTarget(targetPlayer);

    case GhostType.PINKY:
      return calculatePinkyTarget(targetPlayer, targetDir);

    case GhostType.INKY: {
      const blinky = ghosts[GhostType.BLINKY];
      return calculateInkyTarget(targetPlayer, targetDir, blinky);
    }

    case GhostType.CLYDE:
      return calculateClydeTarget(targetPlayer, ghost);

    default:
      return calculateBlinkyTarget(targetPlayer);
  }
}

/**
 * Chooses the best direction for a ghost to move toward its target.
 * Ghosts choose the direction that minimizes distance to target.
 * @param {object} ghost - Ghost state
 * @param {number[][]} maze - The maze grid
 * @param {object} targetTile - Target tile {tileX, tileY}
 * @returns {object} Best direction to move
 */
export function chooseBestDirection(ghost, maze, targetTile) {
  const currentTile = pixelToTile(ghost.x, ghost.y);
  const validDirs = getValidDirections(maze, currentTile.tileX, currentTile.tileY, ghost.direction);

  // If no valid directions, ghost is stuck
  if (validDirs.length === 0) {
    return ghost.direction;
  }

  // If only one direction, take it
  if (validDirs.length === 1) {
    return validDirs[0];
  }

  // In frightened mode, choose randomly
  if (ghost.mode === GhostMode.FRIGHTENED) {
    return validDirs[Math.floor(Math.random() * validDirs.length)];
  }

  // Find direction that minimizes distance to target
  let bestDir = validDirs[0];
  let bestDist = Infinity;

  for (const dir of validDirs) {
    const nextTileX = currentTile.tileX + dir.dx;
    const nextTileY = currentTile.tileY + dir.dy;
    const dist = distanceSquared(nextTileX, nextTileY, targetTile.tileX, targetTile.tileY);

    if (dist < bestDist) {
      bestDist = dist;
      bestDir = dir;
    }
  }

  return bestDir;
}

/**
 * Checks if a ghost is at the center of a tile (intersection decision point).
 * @param {number} x - Ghost X position in pixels
 * @param {number} y - Ghost Y position in pixels
 * @param {number} threshold - Threshold for center detection (default 2 pixels)
 * @returns {boolean} True if ghost is at tile center
 */
function isAtTileCenter(x, y, threshold = 2) {
  const offsetX = x % TILE_SIZE;
  const offsetY = y % TILE_SIZE;
  const centerOffset = TILE_SIZE / 2;

  return Math.abs(offsetX - centerOffset) < threshold &&
         Math.abs(offsetY - centerOffset) < threshold;
}

/**
 * Updates a single ghost's position and direction.
 * @param {object} ghost - Ghost state
 * @param {number[][]} maze - The maze grid
 * @param {object} player1Pos - Player 1 position
 * @param {object} player1Dir - Player 1 direction
 * @param {object} player2Pos - Player 2 position (can be null)
 * @param {object} player2Dir - Player 2 direction (can be null)
 * @param {object} ghosts - All ghost states
 * @param {number} deltaTime - Time since last update in ms
 * @param {string} globalMode - Current global mode (SCATTER or CHASE)
 * @returns {object} Updated ghost state
 */
export function updateGhost(ghost, maze, player1Pos, player1Dir, player2Pos, player2Dir, ghosts, deltaTime, globalMode) {
  let updatedGhost = { ...ghost };

  // Handle ghost house behavior
  if (updatedGhost.mode === GhostMode.IN_HOUSE) {
    updatedGhost.timeInHouse += deltaTime;

    if (updatedGhost.timeInHouse >= updatedGhost.releaseDelay) {
      // Time to exit - start moving toward the exit
      if (!updatedGhost.isExiting) {
        updatedGhost.isExiting = true;
      }

      // Move toward center X first, then up to exit
      // Exit position is at tile CENTER (add TILE_SIZE/2)
      const exitX = GHOST_HOUSE_EXIT.tileX * TILE_SIZE + TILE_SIZE / 2;
      const exitY = GHOST_HOUSE_EXIT.tileY * TILE_SIZE + TILE_SIZE / 2;
      const moveAmount = IN_HOUSE_SPEED * deltaTime * 2; // Faster exit movement

      // First, align to center X
      const xDiff = exitX - updatedGhost.x;
      if (Math.abs(xDiff) > 2) {
        updatedGhost.x += Math.sign(xDiff) * Math.min(Math.abs(xDiff), moveAmount);
        return updatedGhost;
      }

      // Then move up toward exit
      const yDiff = exitY - updatedGhost.y;
      if (Math.abs(yDiff) > 2) {
        updatedGhost.y += Math.sign(yDiff) * Math.min(Math.abs(yDiff), moveAmount);
        return updatedGhost;
      }

      // Reached exit - release ghost
      updatedGhost.mode = globalMode;
      updatedGhost.x = exitX;
      updatedGhost.y = exitY;
      updatedGhost.direction = Direction.UP; // Start moving up out of the gate
      updatedGhost.isExiting = false;
    } else {
      // Still waiting - bounce around inside the house (both X and Y) for a larger pen feel
      const moveAmount = IN_HOUSE_SPEED * deltaTime;
      const normalized = getNormalizedDirection(
        updatedGhost.bounceDirection.dx ?? 0,
        updatedGhost.bounceDirection.dy ?? 0
      );

      let newX = updatedGhost.x + normalized.dx * moveAmount;
      let newY = updatedGhost.y + normalized.dy * moveAmount;

      if (newX <= GHOST_HOUSE_BOUNDS.minX) {
        newX = GHOST_HOUSE_BOUNDS.minX;
        updatedGhost.bounceDirection.dx = Math.abs(updatedGhost.bounceDirection.dx ?? 1);
      } else if (newX >= GHOST_HOUSE_BOUNDS.maxX) {
        newX = GHOST_HOUSE_BOUNDS.maxX;
        updatedGhost.bounceDirection.dx = -Math.abs(updatedGhost.bounceDirection.dx ?? 1);
      }

      if (newY <= GHOST_HOUSE_BOUNDS.minY) {
        newY = GHOST_HOUSE_BOUNDS.minY;
        updatedGhost.bounceDirection.dy = Math.abs(updatedGhost.bounceDirection.dy ?? 1);
      } else if (newY >= GHOST_HOUSE_BOUNDS.maxY) {
        newY = GHOST_HOUSE_BOUNDS.maxY;
        updatedGhost.bounceDirection.dy = -Math.abs(updatedGhost.bounceDirection.dy ?? 1);
      }

      updatedGhost.x = clamp(newX, GHOST_HOUSE_BOUNDS.minX, GHOST_HOUSE_BOUNDS.maxX);
      updatedGhost.y = clamp(newY, GHOST_HOUSE_BOUNDS.minY, GHOST_HOUSE_BOUNDS.maxY);
      return updatedGhost;
    }
  }

  // Handle eaten ghost returning to house
  if (updatedGhost.mode === GhostMode.EATEN) {
    const ghostHouseCenterX = GHOST_HOUSE_CENTER.tileX * TILE_SIZE + TILE_SIZE / 2;
    const ghostHouseCenterY = GHOST_HOUSE_CENTER.tileY * TILE_SIZE;
    const distToCenter = Math.abs(updatedGhost.x - ghostHouseCenterX) + Math.abs(updatedGhost.y - ghostHouseCenterY);

    if (distToCenter < TILE_SIZE) {
      // Reached house, respawn after short delay
      updatedGhost.mode = GhostMode.IN_HOUSE;
      updatedGhost.x = ghostHouseCenterX;
      updatedGhost.y = GHOST_HOUSE_CENTER.tileY * TILE_SIZE; // Center Y of ghost house
      updatedGhost.timeInHouse = updatedGhost.releaseDelay - 1000; // Quick respawn
      updatedGhost.bounceDirection = { dx: 1, dy: -1 };
      updatedGhost.isExiting = false;
      return updatedGhost;
    }
  }

  // Determine speed based on mode
  let speed = updatedGhost.speed;
  if (updatedGhost.mode === GhostMode.FRIGHTENED) {
    speed = FRIGHTENED_SPEED;
  } else if (updatedGhost.mode === GhostMode.EATEN) {
    speed = EATEN_SPEED;
  }

  // Check if at tile center (decision point)
  if (isAtTileCenter(updatedGhost.x, updatedGhost.y)) {
    // Calculate target and choose direction
    const targetTile = getGhostTarget(updatedGhost, player1Pos, player1Dir, player2Pos, player2Dir, ghosts);
    const newDirection = chooseBestDirection(updatedGhost, maze, targetTile);

    updatedGhost.direction = newDirection;
    updatedGhost.targetTile = targetTile;
  }

  // Move in current direction
  const moveAmount = speed * deltaTime;
  let newX = updatedGhost.x + updatedGhost.direction.dx * moveAmount;
  let newY = updatedGhost.y + updatedGhost.direction.dy * moveAmount;

  // Check if new position would hit a wall
  const newTile = pixelToTile(newX, newY);
  if (isWalkableTile(maze, newTile.tileX, newTile.tileY)) {
    updatedGhost.x = newX;
    updatedGhost.y = newY;
  }

  return updatedGhost;
}

/**
 * Updates all ghosts.
 * @param {object} ghosts - All ghost states
 * @param {number[][]} maze - The maze grid
 * @param {object} player1Pos - Player 1 position
 * @param {object} player1Dir - Player 1 direction
 * @param {object} player2Pos - Player 2 position (can be null)
 * @param {object} player2Dir - Player 2 direction (can be null)
 * @param {number} deltaTime - Time since last update in ms
 * @param {string} globalMode - Current global mode (SCATTER or CHASE)
 * @returns {object} Updated ghost states
 */
export function updateAllGhosts(ghosts, maze, player1Pos, player1Dir, player2Pos, player2Dir, deltaTime, globalMode = GhostMode.SCATTER) {
  const updatedGhosts = {};

  for (const type of Object.keys(ghosts)) {
    updatedGhosts[type] = updateGhost(
      ghosts[type],
      maze,
      player1Pos,
      player1Dir,
      player2Pos,
      player2Dir,
      ghosts,
      deltaTime,
      globalMode
    );
  }

  return updatedGhosts;
}

/**
 * Sets the mode for all ghosts (chase, scatter, frightened).
 * Ghosts in house or eaten are not affected.
 * @param {object} ghosts - All ghost states
 * @param {string} mode - New mode
 * @param {boolean} reverse - Whether ghosts should reverse direction
 * @returns {object} Updated ghost states
 */
export function setGhostMode(ghosts, mode, reverse = false) {
  const updatedGhosts = {};

  for (const type of Object.keys(ghosts)) {
    const ghost = ghosts[type];

    // Don't change mode of ghosts in house or eaten
    if (ghost.mode === GhostMode.IN_HOUSE || ghost.mode === GhostMode.EATEN) {
      updatedGhosts[type] = ghost;
      continue;
    }

    updatedGhosts[type] = {
      ...ghost,
      previousMode: ghost.mode,
      mode,
      speed: mode === GhostMode.FRIGHTENED ? FRIGHTENED_SPEED : GHOST_SPEED,
      direction: reverse ? getOppositeDirection(ghost.direction) : ghost.direction,
    };
  }

  return updatedGhosts;
}

/**
 * Marks a specific ghost as eaten.
 * @param {object} ghosts - All ghost states
 * @param {string} ghostType - Type of ghost to mark as eaten
 * @returns {object} Updated ghost states
 */
export function markGhostEaten(ghosts, ghostType) {
  const ghost = ghosts[ghostType];
  if (!ghost || ghost.mode !== GhostMode.FRIGHTENED) {
    return ghosts;
  }

  return {
    ...ghosts,
    [ghostType]: {
      ...ghost,
      mode: GhostMode.EATEN,
    },
  };
}

/**
 * Ends frightened mode for all ghosts, returning them to their previous mode.
 * @param {object} ghosts - All ghost states
 * @returns {object} Updated ghost states
 */
export function endFrightenedMode(ghosts) {
  const updatedGhosts = {};

  for (const type of Object.keys(ghosts)) {
    const ghost = ghosts[type];

    if (ghost.mode === GhostMode.FRIGHTENED) {
      updatedGhosts[type] = {
        ...ghost,
        mode: ghost.previousMode || GhostMode.CHASE,
        speed: GHOST_SPEED,
      };
    } else {
      updatedGhosts[type] = ghost;
    }
  }

  return updatedGhosts;
}

/**
 * Resets all ghosts to their starting positions.
 * @returns {object} Fresh ghost states
 */
export function resetGhosts() {
  return createAllGhosts();
}

/**
 * Checks for collision between player and any ghost.
 * @param {object} ghosts - All ghost states
 * @param {number} playerX - Player X position
 * @param {number} playerY - Player Y position
 * @param {number} collisionRadius - Collision detection radius (default ~60% of tile)
 * @returns {object} { collision: boolean, ghostType: string|null, canEat: boolean }
 */
export function checkGhostCollision(ghosts, playerX, playerY, collisionRadius = TILE_SIZE * 0.6) {
  for (const type of Object.keys(ghosts)) {
    const ghost = ghosts[type];

    // Skip ghosts in house or already eaten
    if (ghost.mode === GhostMode.IN_HOUSE || ghost.mode === GhostMode.EATEN) {
      continue;
    }

    const dx = ghost.x - playerX;
    const dy = ghost.y - playerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < collisionRadius) {
      return {
        collision: true,
        ghostType: type,
        canEat: ghost.mode === GhostMode.FRIGHTENED,
      };
    }
  }

  return { collision: false, ghostType: null, canEat: false };
}
