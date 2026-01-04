/**
 * Player movement hook for grid-based Pac-Man movement.
 * Handles smooth tile-to-tile movement with wall collision and tunnel wrapping.
 */

import { useCallback, useRef } from 'react';
import { TILE_SIZE } from '../game/Dots.js';
import { isWalkableTile } from '../game/Collision.js';

// Movement directions as tile offsets
const DIRECTIONS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

/**
 * Converts pixel coordinates to tile coordinates.
 */
function pixelToTile(x, y) {
  return {
    tileX: Math.floor(x / TILE_SIZE),
    tileY: Math.floor(y / TILE_SIZE),
  };
}

/**
 * Converts tile coordinates to pixel coordinates (center of tile).
 */
function tileToPixel(tileX, tileY) {
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
  };
}

/**
 * Custom hook for grid-based player movement.
 * Provides smooth interpolation between tiles with wall collision.
 *
 * @param {object} options
 * @param {number} options.speed - Movement speed in tiles per second
 * @returns {object} Movement controller
 */
export function usePlayerMovement({ speed = 5 } = {}) {
  const stateRef = useRef({
    // Current pixel position
    x: TILE_SIZE * 1.5,
    y: TILE_SIZE * 1.5,
    // Current tile (where we're moving from or currently on)
    currentTileX: 1,
    currentTileY: 1,
    // Target tile (where we're moving to)
    targetTileX: 1,
    targetTileY: 1,
    // Current movement direction
    direction: 'right',
    // Queued direction (for pre-turn input)
    queuedDirection: null,
    // Whether we're currently moving between tiles
    isMoving: false,
    // Progress through current move (0 to 1)
    moveProgress: 0,
  });

  /**
   * Gets the opposite direction for tunnel wrapping.
   */
  const getOppositeEdge = useCallback((maze, tileX, tileY, direction) => {
    const mazeWidth = maze[0].length;
    const mazeHeight = maze.length;

    // Check for tunnel wrapping
    if (direction === 'left' && tileX < 0) {
      // Wrap to right edge
      const newTileX = mazeWidth - 1;
      if (isWalkableTile(maze, newTileX, tileY)) {
        return { tileX: newTileX, tileY, wrapped: true };
      }
    } else if (direction === 'right' && tileX >= mazeWidth) {
      // Wrap to left edge
      const newTileX = 0;
      if (isWalkableTile(maze, newTileX, tileY)) {
        return { tileX: newTileX, tileY, wrapped: true };
      }
    } else if (direction === 'up' && tileY < 0) {
      // Wrap to bottom edge
      const newTileY = mazeHeight - 1;
      if (isWalkableTile(maze, tileX, newTileY)) {
        return { tileX, tileY: newTileY, wrapped: true };
      }
    } else if (direction === 'down' && tileY >= mazeHeight) {
      // Wrap to top edge
      const newTileY = 0;
      if (isWalkableTile(maze, tileX, newTileY)) {
        return { tileX, tileY: newTileY, wrapped: true };
      }
    }

    return { tileX, tileY, wrapped: false };
  }, []);

  /**
   * Attempts to start moving in a direction.
   * Returns true if movement was initiated.
   */
  const tryMove = useCallback((maze, direction) => {
    const state = stateRef.current;
    const dir = DIRECTIONS[direction];
    if (!dir) return false;

    const newTileX = state.currentTileX + dir.dx;
    const newTileY = state.currentTileY + dir.dy;

    // Check for tunnel wrapping first
    const wrapped = getOppositeEdge(maze, newTileX, newTileY, direction);

    if (wrapped.wrapped) {
      // Tunnel wrap - teleport to opposite edge
      state.targetTileX = wrapped.tileX;
      state.targetTileY = wrapped.tileY;
      state.direction = direction;
      state.isMoving = true;
      state.moveProgress = 0;
      return true;
    }

    // Normal movement - check if target tile is walkable
    if (isWalkableTile(maze, newTileX, newTileY)) {
      state.targetTileX = newTileX;
      state.targetTileY = newTileY;
      state.direction = direction;
      state.isMoving = true;
      state.moveProgress = 0;
      return true;
    }

    return false;
  }, [getOppositeEdge]);

  /**
   * Updates player position based on delta time.
   * Returns the new position and direction.
   */
  const update = useCallback((maze, deltaTime, inputDirection) => {
    const state = stateRef.current;
    const moveSpeed = speed * TILE_SIZE; // Convert to pixels per second
    const moveAmount = (moveSpeed * deltaTime) / 1000; // Convert ms to seconds

    // Queue direction if provided
    if (inputDirection && DIRECTIONS[inputDirection]) {
      state.queuedDirection = inputDirection;
    }

    // If not moving, try to start moving
    if (!state.isMoving) {
      // First try queued direction
      if (state.queuedDirection) {
        if (tryMove(maze, state.queuedDirection)) {
          state.queuedDirection = null;
        }
      }
      // If no queued direction worked, try to continue in current direction
      if (!state.isMoving) {
        tryMove(maze, state.direction);
      }
    }

    // If moving, update position
    if (state.isMoving) {
      // Calculate movement progress
      state.moveProgress += moveAmount / TILE_SIZE;

      // Check if we can turn mid-movement (for responsive controls)
      if (state.queuedDirection && state.queuedDirection !== state.direction) {
        const dir = DIRECTIONS[state.queuedDirection];
        // Only allow perpendicular turns when close enough to tile center
        const isPerpendicularTurn =
          (state.direction === 'left' || state.direction === 'right') !==
          (state.queuedDirection === 'left' || state.queuedDirection === 'right');

        if (isPerpendicularTurn && state.moveProgress >= 0.5) {
          // We're past the midpoint, check if we can turn
          const nextTileX = state.targetTileX + dir.dx;
          const nextTileY = state.targetTileY + dir.dy;

          // Check for tunnel wrapping on turn
          const wrapped = getOppositeEdge(maze, nextTileX, nextTileY, state.queuedDirection);

          if (wrapped.wrapped || isWalkableTile(maze, nextTileX, nextTileY)) {
            // Complete current move instantly and start turn
            state.currentTileX = state.targetTileX;
            state.currentTileY = state.targetTileY;
            state.moveProgress = 0;

            if (wrapped.wrapped) {
              state.targetTileX = wrapped.tileX;
              state.targetTileY = wrapped.tileY;
            } else {
              state.targetTileX = nextTileX;
              state.targetTileY = nextTileY;
            }
            state.direction = state.queuedDirection;
            state.queuedDirection = null;
          }
        }
      }

      // If movement is complete
      if (state.moveProgress >= 1) {
        state.currentTileX = state.targetTileX;
        state.currentTileY = state.targetTileY;
        state.moveProgress = 0;
        state.isMoving = false;

        // Update pixel position to exact tile center
        const center = tileToPixel(state.currentTileX, state.currentTileY);
        state.x = center.x;
        state.y = center.y;

        // Immediately try to continue moving or turn
        if (state.queuedDirection) {
          if (tryMove(maze, state.queuedDirection)) {
            state.queuedDirection = null;
          } else {
            // Try current direction if queued direction failed
            tryMove(maze, state.direction);
          }
        } else {
          // Continue in current direction
          tryMove(maze, state.direction);
        }
      } else {
        // Interpolate position between tiles
        const startPos = tileToPixel(state.currentTileX, state.currentTileY);
        const endPos = tileToPixel(state.targetTileX, state.targetTileY);

        // Handle tunnel wrapping interpolation
        const mazeWidth = maze[0].length;
        const mazeHeight = maze.length;
        let dx = endPos.x - startPos.x;
        let dy = endPos.y - startPos.y;

        // If wrapped horizontally, adjust interpolation
        if (Math.abs(state.targetTileX - state.currentTileX) > 1) {
          if (state.direction === 'left') {
            dx = -(TILE_SIZE + startPos.x + (mazeWidth * TILE_SIZE - endPos.x));
          } else if (state.direction === 'right') {
            dx = TILE_SIZE + (mazeWidth * TILE_SIZE - startPos.x) + endPos.x;
          }
        }

        // If wrapped vertically, adjust interpolation
        if (Math.abs(state.targetTileY - state.currentTileY) > 1) {
          if (state.direction === 'up') {
            dy = -(TILE_SIZE + startPos.y + (mazeHeight * TILE_SIZE - endPos.y));
          } else if (state.direction === 'down') {
            dy = TILE_SIZE + (mazeHeight * TILE_SIZE - startPos.y) + endPos.y;
          }
        }

        state.x = startPos.x + dx * state.moveProgress;
        state.y = startPos.y + dy * state.moveProgress;

        // Wrap position for rendering
        const pixelWidth = mazeWidth * TILE_SIZE;
        const pixelHeight = mazeHeight * TILE_SIZE;

        if (state.x < 0) state.x += pixelWidth;
        if (state.x >= pixelWidth) state.x -= pixelWidth;
        if (state.y < 0) state.y += pixelHeight;
        if (state.y >= pixelHeight) state.y -= pixelHeight;
      }
    }

    return {
      x: state.x,
      y: state.y,
      direction: state.direction,
      tileX: state.currentTileX,
      tileY: state.currentTileY,
      isMoving: state.isMoving,
    };
  }, [speed, tryMove, getOppositeEdge]);

  /**
   * Sets the player position (for initialization or respawn).
   */
  const setPosition = useCallback((x, y) => {
    const state = stateRef.current;
    const tile = pixelToTile(x, y);

    state.x = x;
    state.y = y;
    state.currentTileX = tile.tileX;
    state.currentTileY = tile.tileY;
    state.targetTileX = tile.tileX;
    state.targetTileY = tile.tileY;
    state.isMoving = false;
    state.moveProgress = 0;
  }, []);

  /**
   * Gets the current position.
   */
  const getPosition = useCallback(() => {
    const state = stateRef.current;
    return {
      x: state.x,
      y: state.y,
      direction: state.direction,
      tileX: state.currentTileX,
      tileY: state.currentTileY,
    };
  }, []);

  /**
   * Sets the direction (for initialization).
   */
  const setDirection = useCallback((direction) => {
    if (DIRECTIONS[direction]) {
      stateRef.current.direction = direction;
    }
  }, []);

  return {
    update,
    setPosition,
    getPosition,
    setDirection,
  };
}

export default usePlayerMovement;
