/**
 * Tests for Collision detection system.
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import {
  pixelToTile,
  tileToPixel,
  isWalkableTile,
  isWallTile,
  getEntityBounds,
  checkWallCollision,
  canMoveTo,
  resolveMovement,
  checkEntityCollision,
  checkDotCollision,
  getDotsAtPosition,
  clampToMazeBounds,
  TILE_SIZE,
} from './Collision.js';

// Simple 5x5 test maze
// 0 = empty (walkable), 1 = wall
const testMaze = [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
];

describe('Collision', () => {
  describe('TILE_SIZE', () => {
    it('exports TILE_SIZE constant', () => {
      expect(TILE_SIZE).toBeDefined();
      expect(typeof TILE_SIZE).toBe('number');
      expect(TILE_SIZE).toBeGreaterThan(0);
    });
  });

  describe('pixelToTile', () => {
    it('converts pixel coordinates to tile coordinates', () => {
      const result = pixelToTile(25, 45);
      expect(result).toEqual({
        tileX: Math.floor(25 / TILE_SIZE),
        tileY: Math.floor(45 / TILE_SIZE),
      });
    });

    it('returns tile 0,0 for origin', () => {
      const result = pixelToTile(0, 0);
      expect(result).toEqual({ tileX: 0, tileY: 0 });
    });

    it('handles exact tile boundaries', () => {
      const result = pixelToTile(TILE_SIZE, TILE_SIZE * 2);
      expect(result).toEqual({ tileX: 1, tileY: 2 });
    });

    it('handles pixel just before tile boundary', () => {
      const result = pixelToTile(TILE_SIZE - 1, TILE_SIZE - 1);
      expect(result).toEqual({ tileX: 0, tileY: 0 });
    });

    it('handles center of tile', () => {
      const result = pixelToTile(TILE_SIZE * 1.5, TILE_SIZE * 2.5);
      expect(result).toEqual({ tileX: 1, tileY: 2 });
    });
  });

  describe('tileToPixel', () => {
    it('converts tile coordinates to pixel center', () => {
      const result = tileToPixel(0, 0);
      expect(result).toEqual({
        x: TILE_SIZE / 2,
        y: TILE_SIZE / 2,
      });
    });

    it('returns center of tile 1,2', () => {
      const result = tileToPixel(1, 2);
      expect(result).toEqual({
        x: TILE_SIZE + TILE_SIZE / 2,
        y: TILE_SIZE * 2 + TILE_SIZE / 2,
      });
    });

    it('round-trips with pixelToTile', () => {
      const pixel = tileToPixel(3, 4);
      const tile = pixelToTile(pixel.x, pixel.y);
      expect(tile).toEqual({ tileX: 3, tileY: 4 });
    });
  });

  describe('isWalkableTile', () => {
    it('returns true for empty tile', () => {
      expect(isWalkableTile(testMaze, 1, 1)).toBe(true);
    });

    it('returns false for wall tile', () => {
      expect(isWalkableTile(testMaze, 0, 0)).toBe(false);
    });

    it('returns false for center wall', () => {
      expect(isWalkableTile(testMaze, 2, 2)).toBe(false);
    });

    it('returns false for negative X', () => {
      expect(isWalkableTile(testMaze, -1, 1)).toBe(false);
    });

    it('returns false for negative Y', () => {
      expect(isWalkableTile(testMaze, 1, -1)).toBe(false);
    });

    it('returns false for X beyond maze width', () => {
      expect(isWalkableTile(testMaze, 5, 1)).toBe(false);
    });

    it('returns false for Y beyond maze height', () => {
      expect(isWalkableTile(testMaze, 1, 5)).toBe(false);
    });
  });

  describe('isWallTile', () => {
    it('returns true for wall tile', () => {
      expect(isWallTile(testMaze, 0, 0)).toBe(true);
    });

    it('returns false for empty tile', () => {
      expect(isWallTile(testMaze, 1, 1)).toBe(false);
    });

    it('returns true for center wall', () => {
      expect(isWallTile(testMaze, 2, 2)).toBe(true);
    });

    it('returns true for negative X (out of bounds)', () => {
      expect(isWallTile(testMaze, -1, 1)).toBe(true);
    });

    it('returns true for negative Y (out of bounds)', () => {
      expect(isWallTile(testMaze, 1, -1)).toBe(true);
    });

    it('returns true for X beyond maze width', () => {
      expect(isWallTile(testMaze, 5, 1)).toBe(true);
    });

    it('returns true for Y beyond maze height', () => {
      expect(isWallTile(testMaze, 1, 5)).toBe(true);
    });
  });

  describe('getEntityBounds', () => {
    it('calculates bounds for entity at origin', () => {
      const bounds = getEntityBounds(10, 10, 4);
      expect(bounds).toEqual({
        left: 8,
        right: 12,
        top: 8,
        bottom: 12,
      });
    });

    it('handles odd-sized entity', () => {
      const bounds = getEntityBounds(50, 50, 10);
      expect(bounds.left).toBe(45);
      expect(bounds.right).toBe(55);
      expect(bounds.top).toBe(45);
      expect(bounds.bottom).toBe(55);
    });

    it('handles zero size', () => {
      const bounds = getEntityBounds(30, 40, 0);
      expect(bounds).toEqual({
        left: 30,
        right: 30,
        top: 40,
        bottom: 40,
      });
    });

    it('width equals size', () => {
      const size = 16;
      const bounds = getEntityBounds(100, 100, size);
      expect(bounds.right - bounds.left).toBe(size);
      expect(bounds.bottom - bounds.top).toBe(size);
    });
  });

  describe('checkWallCollision', () => {
    it('returns false for entity in empty area', () => {
      // Center of tile (1,1) which is empty
      const x = TILE_SIZE * 1.5;
      const y = TILE_SIZE * 1.5;
      expect(checkWallCollision(testMaze, x, y, 8)).toBe(false);
    });

    it('returns true for entity in wall', () => {
      // Center of tile (0,0) which is a wall
      const x = TILE_SIZE / 2;
      const y = TILE_SIZE / 2;
      expect(checkWallCollision(testMaze, x, y, 8)).toBe(true);
    });

    it('returns true for entity overlapping wall', () => {
      // Entity at edge of walkable area, large enough to overlap wall
      const x = TILE_SIZE * 1.1;
      const y = TILE_SIZE * 1.5;
      expect(checkWallCollision(testMaze, x, y, TILE_SIZE)).toBe(true);
    });

    it('returns false for small entity in corridor center', () => {
      // Small entity in center of corridor
      const x = TILE_SIZE * 1.5;
      const y = TILE_SIZE * 3.5;
      expect(checkWallCollision(testMaze, x, y, 4)).toBe(false);
    });

    it('returns true when entity overlaps center wall', () => {
      // Entity near center wall (2,2)
      const x = TILE_SIZE * 2.1;
      const y = TILE_SIZE * 2.1;
      expect(checkWallCollision(testMaze, x, y, TILE_SIZE * 0.5)).toBe(true);
    });
  });

  describe('canMoveTo', () => {
    it('returns true for valid position', () => {
      const x = TILE_SIZE * 1.5;
      const y = TILE_SIZE * 1.5;
      expect(canMoveTo(testMaze, x, y, 8)).toBe(true);
    });

    it('returns false for wall position', () => {
      const x = TILE_SIZE / 2;
      const y = TILE_SIZE / 2;
      expect(canMoveTo(testMaze, x, y, 8)).toBe(false);
    });

    it('is inverse of checkWallCollision', () => {
      const x = TILE_SIZE * 1.5;
      const y = TILE_SIZE * 1.5;
      const size = 10;
      expect(canMoveTo(testMaze, x, y, size)).toBe(!checkWallCollision(testMaze, x, y, size));
    });
  });

  describe('resolveMovement', () => {
    it('returns target position if no collision', () => {
      const currentX = TILE_SIZE * 1.5;
      const currentY = TILE_SIZE * 1.5;
      const targetX = TILE_SIZE * 1.5;
      const targetY = TILE_SIZE * 2;
      const result = resolveMovement(testMaze, currentX, currentY, targetX, targetY, 8);
      expect(result).toEqual({ x: targetX, y: targetY });
    });

    it('slides horizontally when vertical blocked', () => {
      // Moving diagonally toward top wall from (1,1)
      const currentX = TILE_SIZE * 1.5;
      const currentY = TILE_SIZE * 1.5;
      const targetX = TILE_SIZE * 2.5;
      const targetY = TILE_SIZE * 0.5; // Into wall
      const result = resolveMovement(testMaze, currentX, currentY, targetX, targetY, 8);
      // Should slide horizontally only
      expect(result.x).toBe(targetX);
      expect(result.y).toBe(currentY);
    });

    it('slides vertically when horizontal blocked', () => {
      // Moving diagonally toward left wall from (1,1)
      const currentX = TILE_SIZE * 1.5;
      const currentY = TILE_SIZE * 1.5;
      const targetX = TILE_SIZE * 0.5; // Into wall
      const targetY = TILE_SIZE * 2.5;
      const result = resolveMovement(testMaze, currentX, currentY, targetX, targetY, 8);
      // Should slide vertically only
      expect(result.x).toBe(currentX);
      expect(result.y).toBe(targetY);
    });

    it('stays in place when fully blocked', () => {
      // Entity at corner surrounded by walls
      const currentX = TILE_SIZE * 1.5;
      const currentY = TILE_SIZE * 1.5;
      const targetX = TILE_SIZE * 0.5; // Wall
      const targetY = TILE_SIZE * 0.5; // Wall
      const result = resolveMovement(testMaze, currentX, currentY, targetX, targetY, 8);
      expect(result).toEqual({ x: currentX, y: currentY });
    });

    it('prefers diagonal movement when possible', () => {
      // Move from (1,1) to (3,3) - should succeed
      const currentX = TILE_SIZE * 1.5;
      const currentY = TILE_SIZE * 1.5;
      const targetX = TILE_SIZE * 3.5;
      const targetY = TILE_SIZE * 3.5;
      const result = resolveMovement(testMaze, currentX, currentY, targetX, targetY, 8);
      expect(result).toEqual({ x: targetX, y: targetY });
    });
  });

  describe('checkEntityCollision', () => {
    it('returns true for overlapping entities', () => {
      expect(checkEntityCollision(10, 10, 10, 15, 15, 10)).toBe(true);
    });

    it('returns false for non-overlapping entities', () => {
      expect(checkEntityCollision(10, 10, 10, 100, 100, 10)).toBe(false);
    });

    it('returns true for exactly touching entities', () => {
      // Entity 1: center (10,10), size 10 -> right edge at 15
      // Entity 2: center (25,10), size 10 -> left edge at 20
      // Not touching
      expect(checkEntityCollision(10, 10, 10, 25, 10, 10)).toBe(false);
      // Entity 2 closer: center (19,10), size 10 -> left edge at 14
      // Entity 1 right edge at 15 > Entity 2 left edge at 14 = overlap
      expect(checkEntityCollision(10, 10, 10, 19, 10, 10)).toBe(true);
    });

    it('returns true for same position', () => {
      expect(checkEntityCollision(50, 50, 20, 50, 50, 20)).toBe(true);
    });

    it('detects vertical overlap', () => {
      expect(checkEntityCollision(50, 10, 10, 50, 18, 10)).toBe(true);
      expect(checkEntityCollision(50, 10, 10, 50, 100, 10)).toBe(false);
    });

    it('detects horizontal overlap', () => {
      expect(checkEntityCollision(10, 50, 10, 18, 50, 10)).toBe(true);
      expect(checkEntityCollision(10, 50, 10, 100, 50, 10)).toBe(false);
    });

    it('handles different sized entities', () => {
      // Small entity inside large entity
      expect(checkEntityCollision(50, 50, 100, 50, 50, 10)).toBe(true);
    });
  });

  describe('checkDotCollision', () => {
    const dot = {
      tileX: 2,
      tileY: 3,
      collected: false,
    };

    it('returns true when entity is in same tile as dot', () => {
      const entityX = TILE_SIZE * 2.5;
      const entityY = TILE_SIZE * 3.5;
      expect(checkDotCollision(entityX, entityY, dot)).toBe(true);
    });

    it('returns false when entity is in different tile', () => {
      const entityX = TILE_SIZE * 1.5;
      const entityY = TILE_SIZE * 1.5;
      expect(checkDotCollision(entityX, entityY, dot)).toBe(false);
    });

    it('returns false when dot is already collected', () => {
      const collectedDot = { ...dot, collected: true };
      const entityX = TILE_SIZE * 2.5;
      const entityY = TILE_SIZE * 3.5;
      expect(checkDotCollision(entityX, entityY, collectedDot)).toBe(false);
    });

    it('handles entity at exact tile boundary', () => {
      // At boundary between tile 1 and tile 2
      const entityX = TILE_SIZE * 2;
      const entityY = TILE_SIZE * 3;
      expect(checkDotCollision(entityX, entityY, dot)).toBe(true);
    });

    it('handles entity just before tile boundary', () => {
      // Just before crossing into tile 2
      const entityX = TILE_SIZE * 2 - 0.1;
      const entityY = TILE_SIZE * 3.5;
      expect(checkDotCollision(entityX, entityY, dot)).toBe(false);
    });
  });

  describe('getDotsAtPosition', () => {
    const dotsState = {
      dots: {
        'dot-2-3': { id: 'dot-2-3', tileX: 2, tileY: 3, collected: false },
        'dot-2-4': { id: 'dot-2-4', tileX: 2, tileY: 4, collected: false },
        'dot-5-3': { id: 'dot-5-3', tileX: 5, tileY: 3, collected: false },
        'dot-collected': { id: 'dot-collected', tileX: 2, tileY: 3, collected: true },
      },
    };

    it('returns dots at position', () => {
      const x = TILE_SIZE * 2.5;
      const y = TILE_SIZE * 3.5;
      const result = getDotsAtPosition(dotsState, x, y);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('dot-2-3');
    });

    it('returns empty array when no dots at position', () => {
      const x = TILE_SIZE * 10;
      const y = TILE_SIZE * 10;
      const result = getDotsAtPosition(dotsState, x, y);
      expect(result).toHaveLength(0);
    });

    it('excludes collected dots', () => {
      // Position has both collected and uncollected dot
      const x = TILE_SIZE * 2.5;
      const y = TILE_SIZE * 3.5;
      const result = getDotsAtPosition(dotsState, x, y);
      const ids = result.map((d) => d.id);
      expect(ids).not.toContain('dot-collected');
    });

    it('returns all dots at same tile', () => {
      // Add another uncollected dot at same position
      const stateWithMultiple = {
        dots: {
          ...dotsState.dots,
          'dot-2-3-extra': { id: 'dot-2-3-extra', tileX: 2, tileY: 3, collected: false },
        },
      };
      const x = TILE_SIZE * 2.5;
      const y = TILE_SIZE * 3.5;
      const result = getDotsAtPosition(stateWithMultiple, x, y);
      expect(result).toHaveLength(2);
    });
  });

  describe('clampToMazeBounds', () => {
    it('returns same position when inside bounds', () => {
      const x = TILE_SIZE * 2.5;
      const y = TILE_SIZE * 2.5;
      const result = clampToMazeBounds(testMaze, x, y, 10);
      expect(result).toEqual({ x, y });
    });

    it('clamps X to minimum bound', () => {
      const result = clampToMazeBounds(testMaze, -10, TILE_SIZE * 2.5, 10);
      expect(result.x).toBe(5); // halfSize
    });

    it('clamps X to maximum bound', () => {
      const mazeWidth = testMaze[0].length * TILE_SIZE;
      const result = clampToMazeBounds(testMaze, mazeWidth + 10, TILE_SIZE * 2.5, 10);
      expect(result.x).toBe(mazeWidth - 5); // mazeWidth - halfSize
    });

    it('clamps Y to minimum bound', () => {
      const result = clampToMazeBounds(testMaze, TILE_SIZE * 2.5, -10, 10);
      expect(result.y).toBe(5); // halfSize
    });

    it('clamps Y to maximum bound', () => {
      const mazeHeight = testMaze.length * TILE_SIZE;
      const result = clampToMazeBounds(testMaze, TILE_SIZE * 2.5, mazeHeight + 10, 10);
      expect(result.y).toBe(mazeHeight - 5); // mazeHeight - halfSize
    });

    it('clamps both axes when needed', () => {
      const result = clampToMazeBounds(testMaze, -100, -100, 20);
      expect(result.x).toBe(10); // halfSize
      expect(result.y).toBe(10); // halfSize
    });

    it('accounts for entity size in bounds calculation', () => {
      const largeSize = 40;
      const halfSize = largeSize / 2;
      const result = clampToMazeBounds(testMaze, 0, 0, largeSize);
      expect(result.x).toBe(halfSize);
      expect(result.y).toBe(halfSize);
    });
  });
});
