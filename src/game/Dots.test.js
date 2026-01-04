/**
 * Tests for Dots pure functions.
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import {
  TILE_SIZE,
  DOT_POINTS,
  POWER_PELLET_POINTS,
  POWER_PELLET_POSITIONS,
  DotType,
  createDot,
  createDotsFromMaze,
  createDefaultMaze,
  checkDotCollision,
  collectDot,
  collectDotsAtPosition,
  allDotsCollected,
  getUncollectedDots,
} from './Dots.js';

describe('Dots', () => {
  describe('Constants', () => {
    it('has DOT_POINTS set to 10', () => {
      expect(DOT_POINTS).toBe(10);
    });

    it('has POWER_PELLET_POINTS set to 50', () => {
      expect(POWER_PELLET_POINTS).toBe(50);
    });

    it('has TILE_SIZE defined', () => {
      expect(TILE_SIZE).toBeDefined();
      expect(typeof TILE_SIZE).toBe('number');
      expect(TILE_SIZE).toBeGreaterThan(0);
    });

    it('has 4 power pellet positions at corners', () => {
      expect(POWER_PELLET_POSITIONS).toHaveLength(4);
      expect(POWER_PELLET_POSITIONS).toContainEqual({ x: 1, y: 1 });
      expect(POWER_PELLET_POSITIONS).toContainEqual({ x: 18, y: 1 });
      expect(POWER_PELLET_POSITIONS).toContainEqual({ x: 1, y: 13 });
      expect(POWER_PELLET_POSITIONS).toContainEqual({ x: 18, y: 13 });
    });
  });

  describe('DotType', () => {
    it('has REGULAR type', () => {
      expect(DotType.REGULAR).toBe('regular');
    });

    it('has POWER type', () => {
      expect(DotType.POWER).toBe('power');
    });
  });

  describe('createDot', () => {
    it('creates a dot with correct tile coordinates', () => {
      const dot = createDot(5, 3);
      expect(dot.tileX).toBe(5);
      expect(dot.tileY).toBe(3);
    });

    it('creates a dot with pixel position at tile center', () => {
      const dot = createDot(5, 3);
      expect(dot.x).toBe(5 * TILE_SIZE + TILE_SIZE / 2);
      expect(dot.y).toBe(3 * TILE_SIZE + TILE_SIZE / 2);
    });

    it('creates a unique id based on tile position', () => {
      const dot = createDot(5, 3);
      expect(dot.id).toBe('dot-5-3');
    });

    it('defaults to REGULAR type', () => {
      const dot = createDot(5, 3);
      expect(dot.type).toBe(DotType.REGULAR);
    });

    it('creates POWER type when specified', () => {
      const dot = createDot(5, 3, DotType.POWER);
      expect(dot.type).toBe(DotType.POWER);
    });

    it('initializes as not collected', () => {
      const dot = createDot(5, 3);
      expect(dot.collected).toBe(false);
    });

    it('handles zero coordinates', () => {
      const dot = createDot(0, 0);
      expect(dot.tileX).toBe(0);
      expect(dot.tileY).toBe(0);
      expect(dot.id).toBe('dot-0-0');
    });
  });

  describe('createDefaultMaze', () => {
    it('returns a 2D array', () => {
      const maze = createDefaultMaze();
      expect(Array.isArray(maze)).toBe(true);
      expect(Array.isArray(maze[0])).toBe(true);
    });

    it('has 15 rows', () => {
      const maze = createDefaultMaze();
      expect(maze).toHaveLength(15);
    });

    it('has 20 columns per row', () => {
      const maze = createDefaultMaze();
      maze.forEach((row) => {
        expect(row).toHaveLength(20);
      });
    });

    it('has walls around the perimeter', () => {
      const maze = createDefaultMaze();
      // Top row all walls
      expect(maze[0].every((cell) => cell === 1)).toBe(true);
      // Bottom row all walls
      expect(maze[14].every((cell) => cell === 1)).toBe(true);
      // Left and right edges
      for (let y = 0; y < 15; y++) {
        expect(maze[y][0]).toBe(1);
        expect(maze[y][19]).toBe(1);
      }
    });

    it('contains only 0s and 1s', () => {
      const maze = createDefaultMaze();
      maze.forEach((row) => {
        row.forEach((cell) => {
          expect([0, 1]).toContain(cell);
        });
      });
    });

    it('has empty tiles at power pellet positions', () => {
      const maze = createDefaultMaze();
      POWER_PELLET_POSITIONS.forEach(({ x, y }) => {
        expect(maze[y][x]).toBe(0);
      });
    });
  });

  describe('createDotsFromMaze', () => {
    it('creates dots for empty tiles', () => {
      const simpleMaze = [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1],
      ];
      const state = createDotsFromMaze(simpleMaze);
      expect(Object.keys(state.dots)).toHaveLength(1);
      expect(state.dots['dot-1-1']).toBeDefined();
    });

    it('returns correct totalDots count', () => {
      const simpleMaze = [
        [1, 0, 1],
        [0, 0, 0],
        [1, 0, 1],
      ];
      const state = createDotsFromMaze(simpleMaze);
      expect(state.totalDots).toBe(5);
    });

    it('initializes collectedDots to 0', () => {
      const maze = createDefaultMaze();
      const state = createDotsFromMaze(maze);
      expect(state.collectedDots).toBe(0);
    });

    it('does not create dots on wall tiles', () => {
      const wallOnlyMaze = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];
      const state = createDotsFromMaze(wallOnlyMaze);
      expect(Object.keys(state.dots)).toHaveLength(0);
      expect(state.totalDots).toBe(0);
    });

    it('creates power pellets at designated positions', () => {
      const maze = createDefaultMaze();
      const state = createDotsFromMaze(maze);
      POWER_PELLET_POSITIONS.forEach(({ x, y }) => {
        const dot = state.dots[`dot-${x}-${y}`];
        if (dot) {
          expect(dot.type).toBe(DotType.POWER);
        }
      });
    });

    it('creates regular dots at non-power-pellet positions', () => {
      const maze = createDefaultMaze();
      const state = createDotsFromMaze(maze);
      const powerPosSet = new Set(
        POWER_PELLET_POSITIONS.map(({ x, y }) => `dot-${x}-${y}`)
      );
      Object.values(state.dots).forEach((dot) => {
        if (!powerPosSet.has(dot.id)) {
          expect(dot.type).toBe(DotType.REGULAR);
        }
      });
    });
  });

  describe('checkDotCollision', () => {
    it('returns true when entity is in same tile as dot', () => {
      const dot = createDot(5, 3);
      const entityX = 5 * TILE_SIZE + TILE_SIZE / 2;
      const entityY = 3 * TILE_SIZE + TILE_SIZE / 2;
      expect(checkDotCollision(entityX, entityY, dot)).toBe(true);
    });

    it('returns true anywhere in the same tile', () => {
      const dot = createDot(5, 3);
      // Test at tile edge
      const entityX = 5 * TILE_SIZE + 1;
      const entityY = 3 * TILE_SIZE + 1;
      expect(checkDotCollision(entityX, entityY, dot)).toBe(true);
    });

    it('returns false when entity is in different tile', () => {
      const dot = createDot(5, 3);
      const entityX = 6 * TILE_SIZE + TILE_SIZE / 2;
      const entityY = 3 * TILE_SIZE + TILE_SIZE / 2;
      expect(checkDotCollision(entityX, entityY, dot)).toBe(false);
    });

    it('returns false when dot is already collected', () => {
      const dot = { ...createDot(5, 3), collected: true };
      const entityX = 5 * TILE_SIZE + TILE_SIZE / 2;
      const entityY = 3 * TILE_SIZE + TILE_SIZE / 2;
      expect(checkDotCollision(entityX, entityY, dot)).toBe(false);
    });

    it('handles boundary between tiles correctly', () => {
      const dot = createDot(5, 3);
      // Just before tile boundary
      const beforeX = 5 * TILE_SIZE + TILE_SIZE - 1;
      expect(checkDotCollision(beforeX, 3 * TILE_SIZE, dot)).toBe(true);
      // At tile boundary (next tile)
      const atBoundaryX = 6 * TILE_SIZE;
      expect(checkDotCollision(atBoundaryX, 3 * TILE_SIZE, dot)).toBe(false);
    });
  });

  describe('collectDot', () => {
    it('marks dot as collected', () => {
      const initialState = createDotsFromMaze([
        [1, 0, 1],
        [1, 1, 1],
      ]);
      const { newDotsState } = collectDot(initialState, 'dot-1-0');
      expect(newDotsState.dots['dot-1-0'].collected).toBe(true);
    });

    it('increments collectedDots count', () => {
      const initialState = createDotsFromMaze([
        [1, 0, 1],
        [1, 1, 1],
      ]);
      const { newDotsState } = collectDot(initialState, 'dot-1-0');
      expect(newDotsState.collectedDots).toBe(1);
    });

    it('returns DOT_POINTS for regular dot', () => {
      const initialState = createDotsFromMaze([
        [1, 0, 1],
        [1, 1, 1],
      ]);
      const { points } = collectDot(initialState, 'dot-1-0');
      expect(points).toBe(DOT_POINTS);
    });

    it('returns POWER_PELLET_POINTS for power pellet', () => {
      // Create state with power pellet at position (1,1)
      const maze = createDefaultMaze();
      const initialState = createDotsFromMaze(maze);
      const { points } = collectDot(initialState, 'dot-1-1');
      expect(points).toBe(POWER_PELLET_POINTS);
    });

    it('returns isPowerPellet true for power pellet', () => {
      const maze = createDefaultMaze();
      const initialState = createDotsFromMaze(maze);
      const { isPowerPellet } = collectDot(initialState, 'dot-1-1');
      expect(isPowerPellet).toBe(true);
    });

    it('returns isPowerPellet false for regular dot', () => {
      // Use a position that is not a power pellet position (5,5 is not in POWER_PELLET_POSITIONS)
      const simpleMaze = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1],
      ];
      const initialState = createDotsFromMaze(simpleMaze);
      const { isPowerPellet } = collectDot(initialState, 'dot-5-5');
      expect(isPowerPellet).toBe(false);
    });

    it('returns 0 points for already collected dot', () => {
      const initialState = createDotsFromMaze([
        [1, 0, 1],
        [1, 1, 1],
      ]);
      const { newDotsState } = collectDot(initialState, 'dot-1-0');
      const { points, isPowerPellet } = collectDot(newDotsState, 'dot-1-0');
      expect(points).toBe(0);
      expect(isPowerPellet).toBe(false);
    });

    it('returns unchanged state for non-existent dot', () => {
      const initialState = createDotsFromMaze([
        [1, 0, 1],
        [1, 1, 1],
      ]);
      const { newDotsState, points } = collectDot(initialState, 'dot-99-99');
      expect(newDotsState).toBe(initialState);
      expect(points).toBe(0);
    });

    it('does not modify original state', () => {
      const initialState = createDotsFromMaze([
        [1, 0, 1],
        [1, 1, 1],
      ]);
      const originalCollected = initialState.dots['dot-1-0'].collected;
      collectDot(initialState, 'dot-1-0');
      expect(initialState.dots['dot-1-0'].collected).toBe(originalCollected);
    });
  });

  describe('collectDotsAtPosition', () => {
    it('collects dot at given position', () => {
      const initialState = createDotsFromMaze([
        [1, 0, 1],
        [1, 1, 1],
      ]);
      const x = 1 * TILE_SIZE + TILE_SIZE / 2;
      const y = 0 * TILE_SIZE + TILE_SIZE / 2;
      const { newDotsState } = collectDotsAtPosition(initialState, x, y);
      expect(newDotsState.dots['dot-1-0'].collected).toBe(true);
    });

    it('returns total points earned', () => {
      const initialState = createDotsFromMaze([
        [1, 0, 1],
        [1, 1, 1],
      ]);
      const x = 1 * TILE_SIZE + TILE_SIZE / 2;
      const y = 0 * TILE_SIZE + TILE_SIZE / 2;
      const { totalPoints } = collectDotsAtPosition(initialState, x, y);
      expect(totalPoints).toBe(DOT_POINTS);
    });

    it('returns 0 points when no dot at position', () => {
      const initialState = createDotsFromMaze([
        [1, 0, 1],
        [1, 1, 1],
      ]);
      const x = 0 * TILE_SIZE + TILE_SIZE / 2; // Wall tile
      const y = 0 * TILE_SIZE + TILE_SIZE / 2;
      const { totalPoints } = collectDotsAtPosition(initialState, x, y);
      expect(totalPoints).toBe(0);
    });

    it('returns powerPelletCollected true when collecting power pellet', () => {
      const maze = createDefaultMaze();
      const initialState = createDotsFromMaze(maze);
      const x = 1 * TILE_SIZE + TILE_SIZE / 2;
      const y = 1 * TILE_SIZE + TILE_SIZE / 2;
      const { powerPelletCollected } = collectDotsAtPosition(initialState, x, y);
      expect(powerPelletCollected).toBe(true);
    });

    it('returns powerPelletCollected false for regular dot', () => {
      // Use position (5,5) which is not a power pellet position
      const simpleMaze = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1],
      ];
      const initialState = createDotsFromMaze(simpleMaze);
      const x = 5 * TILE_SIZE + TILE_SIZE / 2;
      const y = 5 * TILE_SIZE + TILE_SIZE / 2;
      const { powerPelletCollected } = collectDotsAtPosition(initialState, x, y);
      expect(powerPelletCollected).toBe(false);
    });

    it('does not collect already collected dots', () => {
      const initialState = createDotsFromMaze([
        [1, 0, 1],
        [1, 1, 1],
      ]);
      const x = 1 * TILE_SIZE + TILE_SIZE / 2;
      const y = 0 * TILE_SIZE + TILE_SIZE / 2;
      const { newDotsState } = collectDotsAtPosition(initialState, x, y);
      const { totalPoints } = collectDotsAtPosition(newDotsState, x, y);
      expect(totalPoints).toBe(0);
    });
  });

  describe('allDotsCollected', () => {
    it('returns false when no dots collected', () => {
      const state = createDotsFromMaze([
        [1, 0, 0],
        [1, 0, 1],
      ]);
      expect(allDotsCollected(state)).toBe(false);
    });

    it('returns false when some dots collected', () => {
      const state = {
        dots: {},
        totalDots: 5,
        collectedDots: 3,
      };
      expect(allDotsCollected(state)).toBe(false);
    });

    it('returns true when all dots collected', () => {
      const state = {
        dots: {},
        totalDots: 5,
        collectedDots: 5,
      };
      expect(allDotsCollected(state)).toBe(true);
    });

    it('returns true when collectedDots exceeds totalDots', () => {
      const state = {
        dots: {},
        totalDots: 5,
        collectedDots: 6,
      };
      expect(allDotsCollected(state)).toBe(true);
    });

    it('returns true for empty maze (no dots)', () => {
      const state = createDotsFromMaze([
        [1, 1, 1],
        [1, 1, 1],
      ]);
      expect(allDotsCollected(state)).toBe(true);
    });
  });

  describe('getUncollectedDots', () => {
    it('returns all dots when none collected', () => {
      const state = createDotsFromMaze([
        [1, 0, 0],
        [1, 0, 1],
      ]);
      const uncollected = getUncollectedDots(state);
      expect(uncollected).toHaveLength(3);
    });

    it('returns empty array when all collected', () => {
      const state = {
        dots: {
          'dot-1-0': { id: 'dot-1-0', collected: true },
          'dot-2-0': { id: 'dot-2-0', collected: true },
        },
        totalDots: 2,
        collectedDots: 2,
      };
      const uncollected = getUncollectedDots(state);
      expect(uncollected).toHaveLength(0);
    });

    it('returns only uncollected dots', () => {
      const state = {
        dots: {
          'dot-1-0': { id: 'dot-1-0', collected: false },
          'dot-2-0': { id: 'dot-2-0', collected: true },
          'dot-3-0': { id: 'dot-3-0', collected: false },
        },
        totalDots: 3,
        collectedDots: 1,
      };
      const uncollected = getUncollectedDots(state);
      expect(uncollected).toHaveLength(2);
      expect(uncollected.map((d) => d.id)).toContain('dot-1-0');
      expect(uncollected.map((d) => d.id)).toContain('dot-3-0');
      expect(uncollected.map((d) => d.id)).not.toContain('dot-2-0');
    });

    it('returns array of dot objects with all properties', () => {
      const state = createDotsFromMaze([
        [1, 0, 1],
        [1, 1, 1],
      ]);
      const uncollected = getUncollectedDots(state);
      expect(uncollected[0]).toHaveProperty('id');
      expect(uncollected[0]).toHaveProperty('tileX');
      expect(uncollected[0]).toHaveProperty('tileY');
      expect(uncollected[0]).toHaveProperty('x');
      expect(uncollected[0]).toHaveProperty('y');
      expect(uncollected[0]).toHaveProperty('type');
      expect(uncollected[0]).toHaveProperty('collected', false);
    });
  });

  describe('Integration scenarios', () => {
    it('supports collecting all dots in a maze', () => {
      const simpleMaze = [
        [1, 0, 0],
        [1, 0, 1],
      ];
      let state = createDotsFromMaze(simpleMaze);
      expect(allDotsCollected(state)).toBe(false);

      // Collect all dots
      Object.keys(state.dots).forEach((dotId) => {
        const result = collectDot(state, dotId);
        state = result.newDotsState;
      });

      expect(allDotsCollected(state)).toBe(true);
      expect(getUncollectedDots(state)).toHaveLength(0);
    });

    it('tracks score correctly for mixed dot collection', () => {
      const maze = createDefaultMaze();
      let state = createDotsFromMaze(maze);
      let totalScore = 0;

      // Collect power pellet at (1, 1)
      let result = collectDot(state, 'dot-1-1');
      state = result.newDotsState;
      totalScore += result.points;
      expect(result.isPowerPellet).toBe(true);
      expect(result.points).toBe(POWER_PELLET_POINTS);

      // Collect regular dot at (2, 1)
      result = collectDot(state, 'dot-2-1');
      state = result.newDotsState;
      totalScore += result.points;
      expect(result.isPowerPellet).toBe(false);
      expect(result.points).toBe(DOT_POINTS);

      expect(totalScore).toBe(POWER_PELLET_POINTS + DOT_POINTS);
    });
  });
});
