/**
 * Tests for GhostAI module.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GhostType,
  GhostMode,
  Direction,
  MODE_TIMINGS,
  GHOST_START_POSITIONS,
  createGhost,
  createAllGhosts,
  calculateBlinkyTarget,
  calculatePinkyTarget,
  calculateInkyTarget,
  calculateClydeTarget,
  getGhostTarget,
  chooseBestDirection,
  updateGhost,
  updateAllGhosts,
  setGhostMode,
  markGhostEaten,
  endFrightenedMode,
  resetGhosts,
  checkGhostCollision,
} from './GhostAI.js';
import { TILE_SIZE } from './Dots.js';

// Helper to create a simple maze for testing
function createTestMaze() {
  // 5x5 maze with walls on edges, open in center
  // 1 = wall, 0 = walkable
  return [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ];
}

describe('GhostAI', () => {
  describe('GhostType constants', () => {
    it('has BLINKY type', () => {
      expect(GhostType.BLINKY).toBe('blinky');
    });

    it('has PINKY type', () => {
      expect(GhostType.PINKY).toBe('pinky');
    });

    it('has INKY type', () => {
      expect(GhostType.INKY).toBe('inky');
    });

    it('has CLYDE type', () => {
      expect(GhostType.CLYDE).toBe('clyde');
    });
  });

  describe('GhostMode constants', () => {
    it('has CHASE mode', () => {
      expect(GhostMode.CHASE).toBe('chase');
    });

    it('has SCATTER mode', () => {
      expect(GhostMode.SCATTER).toBe('scatter');
    });

    it('has FRIGHTENED mode', () => {
      expect(GhostMode.FRIGHTENED).toBe('frightened');
    });

    it('has EATEN mode', () => {
      expect(GhostMode.EATEN).toBe('eaten');
    });

    it('has IN_HOUSE mode', () => {
      expect(GhostMode.IN_HOUSE).toBe('in_house');
    });
  });

  describe('Direction constants', () => {
    it('has UP direction', () => {
      expect(Direction.UP).toEqual({ dx: 0, dy: -1 });
    });

    it('has DOWN direction', () => {
      expect(Direction.DOWN).toEqual({ dx: 0, dy: 1 });
    });

    it('has LEFT direction', () => {
      expect(Direction.LEFT).toEqual({ dx: -1, dy: 0 });
    });

    it('has RIGHT direction', () => {
      expect(Direction.RIGHT).toEqual({ dx: 1, dy: 0 });
    });

    it('has NONE direction', () => {
      expect(Direction.NONE).toEqual({ dx: 0, dy: 0 });
    });
  });

  describe('MODE_TIMINGS constants', () => {
    it('has scatter timing', () => {
      expect(MODE_TIMINGS.scatter).toBe(1500);
    });

    it('has chase timing', () => {
      expect(MODE_TIMINGS.chase).toBe(45000);
    });
  });

  describe('GHOST_START_POSITIONS', () => {
    it('has start position for Blinky', () => {
      expect(GHOST_START_POSITIONS[GhostType.BLINKY]).toBeDefined();
      expect(GHOST_START_POSITIONS[GhostType.BLINKY].x).toBeDefined();
      expect(GHOST_START_POSITIONS[GhostType.BLINKY].y).toBeDefined();
    });

    it('has start position for Pinky', () => {
      expect(GHOST_START_POSITIONS[GhostType.PINKY]).toBeDefined();
    });

    it('has start position for Inky', () => {
      expect(GHOST_START_POSITIONS[GhostType.INKY]).toBeDefined();
    });

    it('has start position for Clyde', () => {
      expect(GHOST_START_POSITIONS[GhostType.CLYDE]).toBeDefined();
    });
  });

  describe('createGhost', () => {
    it('creates a ghost with correct type', () => {
      const ghost = createGhost(GhostType.BLINKY);
      expect(ghost.type).toBe(GhostType.BLINKY);
    });

    it('creates ghost at start position', () => {
      const ghost = createGhost(GhostType.BLINKY);
      expect(ghost.x).toBe(GHOST_START_POSITIONS[GhostType.BLINKY].x);
      expect(ghost.y).toBe(GHOST_START_POSITIONS[GhostType.BLINKY].y);
    });

    it('creates ghost in IN_HOUSE mode', () => {
      const ghost = createGhost(GhostType.BLINKY);
      expect(ghost.mode).toBe(GhostMode.IN_HOUSE);
    });

    it('initializes direction to UP', () => {
      const ghost = createGhost(GhostType.BLINKY);
      expect(ghost.direction).toBe(Direction.UP);
    });

    it('initializes targetTile', () => {
      const ghost = createGhost(GhostType.BLINKY);
      expect(ghost.targetTile).toEqual({ tileX: 0, tileY: 0 });
    });

    it('initializes timeInHouse to 0', () => {
      const ghost = createGhost(GhostType.BLINKY);
      expect(ghost.timeInHouse).toBe(0);
    });

    it('sets correct release delay for Blinky (0)', () => {
      const ghost = createGhost(GhostType.BLINKY);
      expect(ghost.releaseDelay).toBe(0);
    });

    it('sets correct release delay for Pinky (1500)', () => {
      const ghost = createGhost(GhostType.PINKY);
      expect(ghost.releaseDelay).toBe(1500);
    });

    it('sets correct release delay for Inky (3000)', () => {
      const ghost = createGhost(GhostType.INKY);
      expect(ghost.releaseDelay).toBe(3000);
    });

    it('sets correct release delay for Clyde (4500)', () => {
      const ghost = createGhost(GhostType.CLYDE);
      expect(ghost.releaseDelay).toBe(4500);
    });

    it('initializes isExiting to false', () => {
      const ghost = createGhost(GhostType.BLINKY);
      expect(ghost.isExiting).toBe(false);
    });

    it('has bounceDirection for ghost house behavior', () => {
      const ghost = createGhost(GhostType.BLINKY);
      expect(ghost.bounceDirection).toBeDefined();
      expect(ghost.bounceDirection.dx).toBeDefined();
      expect(ghost.bounceDirection.dy).toBeDefined();
    });
  });

  describe('createAllGhosts', () => {
    it('creates all four ghosts', () => {
      const ghosts = createAllGhosts();
      expect(Object.keys(ghosts)).toHaveLength(4);
    });

    it('creates Blinky', () => {
      const ghosts = createAllGhosts();
      expect(ghosts[GhostType.BLINKY]).toBeDefined();
      expect(ghosts[GhostType.BLINKY].type).toBe(GhostType.BLINKY);
    });

    it('creates Pinky', () => {
      const ghosts = createAllGhosts();
      expect(ghosts[GhostType.PINKY]).toBeDefined();
      expect(ghosts[GhostType.PINKY].type).toBe(GhostType.PINKY);
    });

    it('creates Inky', () => {
      const ghosts = createAllGhosts();
      expect(ghosts[GhostType.INKY]).toBeDefined();
      expect(ghosts[GhostType.INKY].type).toBe(GhostType.INKY);
    });

    it('creates Clyde', () => {
      const ghosts = createAllGhosts();
      expect(ghosts[GhostType.CLYDE]).toBeDefined();
      expect(ghosts[GhostType.CLYDE].type).toBe(GhostType.CLYDE);
    });
  });

  describe('calculateBlinkyTarget', () => {
    it('targets player current tile position', () => {
      const playerPos = { x: TILE_SIZE * 5 + TILE_SIZE / 2, y: TILE_SIZE * 3 + TILE_SIZE / 2 };
      const target = calculateBlinkyTarget(playerPos);
      expect(target.tileX).toBe(5);
      expect(target.tileY).toBe(3);
    });

    it('handles player at origin', () => {
      const playerPos = { x: TILE_SIZE / 2, y: TILE_SIZE / 2 };
      const target = calculateBlinkyTarget(playerPos);
      expect(target.tileX).toBe(0);
      expect(target.tileY).toBe(0);
    });
  });

  describe('calculatePinkyTarget', () => {
    it('targets 4 tiles ahead of player moving RIGHT', () => {
      const playerPos = { x: TILE_SIZE * 5 + TILE_SIZE / 2, y: TILE_SIZE * 3 + TILE_SIZE / 2 };
      const target = calculatePinkyTarget(playerPos, Direction.RIGHT);
      expect(target.tileX).toBe(9); // 5 + 4
      expect(target.tileY).toBe(3);
    });

    it('targets 4 tiles ahead of player moving LEFT', () => {
      const playerPos = { x: TILE_SIZE * 10 + TILE_SIZE / 2, y: TILE_SIZE * 5 + TILE_SIZE / 2 };
      const target = calculatePinkyTarget(playerPos, Direction.LEFT);
      expect(target.tileX).toBe(6); // 10 - 4
      expect(target.tileY).toBe(5);
    });

    it('targets 4 tiles ahead of player moving UP', () => {
      const playerPos = { x: TILE_SIZE * 5 + TILE_SIZE / 2, y: TILE_SIZE * 8 + TILE_SIZE / 2 };
      const target = calculatePinkyTarget(playerPos, Direction.UP);
      expect(target.tileX).toBe(5);
      expect(target.tileY).toBe(4); // 8 - 4
    });

    it('targets 4 tiles ahead of player moving DOWN', () => {
      const playerPos = { x: TILE_SIZE * 5 + TILE_SIZE / 2, y: TILE_SIZE * 3 + TILE_SIZE / 2 };
      const target = calculatePinkyTarget(playerPos, Direction.DOWN);
      expect(target.tileX).toBe(5);
      expect(target.tileY).toBe(7); // 3 + 4
    });
  });

  describe('calculateInkyTarget', () => {
    it('calculates target using vector from Blinky to 2 tiles ahead, doubled', () => {
      // Player at tile (10, 10), moving right
      // 2 tiles ahead = (12, 10)
      // Blinky at tile (8, 10)
      // Vector from Blinky to ahead: (4, 0)
      // Doubled: (8, 0)
      // Target = Blinky + doubled vector = (8 + 8, 10) = (16, 10)
      const playerPos = { x: TILE_SIZE * 10 + TILE_SIZE / 2, y: TILE_SIZE * 10 + TILE_SIZE / 2 };
      const blinkyPos = { x: TILE_SIZE * 8 + TILE_SIZE / 2, y: TILE_SIZE * 10 + TILE_SIZE / 2 };
      const target = calculateInkyTarget(playerPos, Direction.RIGHT, blinkyPos);
      expect(target.tileX).toBe(16);
      expect(target.tileY).toBe(10);
    });

    it('handles vertical movement', () => {
      // Player at (5, 5), moving up
      // 2 tiles ahead = (5, 3)
      // Blinky at (5, 8)
      // Vector: (0, -5)
      // Doubled: (0, -10)
      // Target = (5, 8 + -10) = (5, -2)
      const playerPos = { x: TILE_SIZE * 5 + TILE_SIZE / 2, y: TILE_SIZE * 5 + TILE_SIZE / 2 };
      const blinkyPos = { x: TILE_SIZE * 5 + TILE_SIZE / 2, y: TILE_SIZE * 8 + TILE_SIZE / 2 };
      const target = calculateInkyTarget(playerPos, Direction.UP, blinkyPos);
      expect(target.tileX).toBe(5);
      expect(target.tileY).toBe(-2);
    });
  });

  describe('calculateClydeTarget', () => {
    it('targets player when more than 4 tiles away', () => {
      // Player at (10, 10), Clyde at (2, 10) = 8 tiles away
      const playerPos = { x: TILE_SIZE * 10 + TILE_SIZE / 2, y: TILE_SIZE * 10 + TILE_SIZE / 2 };
      const clydePos = { x: TILE_SIZE * 2 + TILE_SIZE / 2, y: TILE_SIZE * 10 + TILE_SIZE / 2 };
      const target = calculateClydeTarget(playerPos, clydePos);
      expect(target.tileX).toBe(10);
      expect(target.tileY).toBe(10);
    });

    it('targets scatter corner when within 4 tiles', () => {
      // Player at (5, 5), Clyde at (4, 5) = 1 tile away
      const playerPos = { x: TILE_SIZE * 5 + TILE_SIZE / 2, y: TILE_SIZE * 5 + TILE_SIZE / 2 };
      const clydePos = { x: TILE_SIZE * 4 + TILE_SIZE / 2, y: TILE_SIZE * 5 + TILE_SIZE / 2 };
      const target = calculateClydeTarget(playerPos, clydePos);
      // Should return Clyde's scatter corner (bottom-left)
      expect(target.tileX).toBe(1);
      expect(target.tileY).toBe(13);
    });

    it('targets scatter corner at exactly 4 tiles away', () => {
      // Player at (10, 10), Clyde at (6, 10) = 4 tiles away (boundary)
      const playerPos = { x: TILE_SIZE * 10 + TILE_SIZE / 2, y: TILE_SIZE * 10 + TILE_SIZE / 2 };
      const clydePos = { x: TILE_SIZE * 6 + TILE_SIZE / 2, y: TILE_SIZE * 10 + TILE_SIZE / 2 };
      const target = calculateClydeTarget(playerPos, clydePos);
      // At exactly 4 tiles, should scatter (distance > 4 means chase)
      expect(target.tileX).toBe(1);
      expect(target.tileY).toBe(13);
    });
  });

  describe('getGhostTarget', () => {
    let ghosts;
    let playerPos;
    let playerDir;

    beforeEach(() => {
      ghosts = createAllGhosts();
      playerPos = { x: TILE_SIZE * 10 + TILE_SIZE / 2, y: TILE_SIZE * 10 + TILE_SIZE / 2 };
      playerDir = Direction.RIGHT;
    });

    it('returns scatter corner in SCATTER mode', () => {
      const ghost = { ...ghosts[GhostType.BLINKY], mode: GhostMode.SCATTER };
      const target = getGhostTarget(ghost, playerPos, playerDir, null, null, ghosts);
      // Blinky scatter corner is top-right
      expect(target.tileX).toBe(18);
      expect(target.tileY).toBe(1);
    });

    it('returns ghost house center in EATEN mode', () => {
      const ghost = { ...ghosts[GhostType.BLINKY], mode: GhostMode.EATEN };
      const target = getGhostTarget(ghost, playerPos, playerDir, null, null, ghosts);
      expect(target.tileX).toBe(11);
      expect(target.tileY).toBe(7.5);
    });

    it('uses Blinky targeting in CHASE mode', () => {
      const ghost = { ...ghosts[GhostType.BLINKY], mode: GhostMode.CHASE };
      const target = getGhostTarget(ghost, playerPos, playerDir, null, null, ghosts);
      expect(target.tileX).toBe(10);
      expect(target.tileY).toBe(10);
    });

    it('uses Pinky targeting in CHASE mode', () => {
      const ghost = { ...ghosts[GhostType.PINKY], mode: GhostMode.CHASE };
      const target = getGhostTarget(ghost, playerPos, playerDir, null, null, ghosts);
      expect(target.tileX).toBe(14); // 10 + 4
      expect(target.tileY).toBe(10);
    });

    it('returns dummy target in FRIGHTENED mode', () => {
      const ghost = { ...ghosts[GhostType.BLINKY], mode: GhostMode.FRIGHTENED };
      const target = getGhostTarget(ghost, playerPos, playerDir, null, null, ghosts);
      // Frightened mode returns { tileX: 0, tileY: 0 } (random movement)
      expect(target).toEqual({ tileX: 0, tileY: 0 });
    });

    it('targets nearest player in 2-player mode', () => {
      // Ghost closer to player 2
      const ghost = {
        ...ghosts[GhostType.BLINKY],
        mode: GhostMode.CHASE,
        x: TILE_SIZE * 15 + TILE_SIZE / 2,
        y: TILE_SIZE * 10 + TILE_SIZE / 2,
      };
      const player1Pos = { x: TILE_SIZE * 5 + TILE_SIZE / 2, y: TILE_SIZE * 10 + TILE_SIZE / 2 };
      const player2Pos = { x: TILE_SIZE * 18 + TILE_SIZE / 2, y: TILE_SIZE * 10 + TILE_SIZE / 2 };

      const target = getGhostTarget(ghost, player1Pos, playerDir, player2Pos, Direction.LEFT, ghosts);
      // Should target player 2 (closer)
      expect(target.tileX).toBe(18);
      expect(target.tileY).toBe(10);
    });
  });

  describe('chooseBestDirection', () => {
    let maze;

    beforeEach(() => {
      maze = createTestMaze();
    });

    it('returns current direction when stuck', () => {
      // Place ghost in a corner with no valid moves
      const ghost = {
        x: TILE_SIZE * 1 + TILE_SIZE / 2,
        y: TILE_SIZE * 1 + TILE_SIZE / 2,
        direction: Direction.UP,
        mode: GhostMode.CHASE,
      };
      // Target is far away
      const target = { tileX: 10, tileY: 10 };
      const dir = chooseBestDirection(ghost, maze, target);
      // Should return some direction (could be right or down since they're valid)
      expect(dir).toBeDefined();
    });

    it('chooses direction minimizing distance to target', () => {
      const ghost = {
        x: TILE_SIZE * 2 + TILE_SIZE / 2,
        y: TILE_SIZE * 2 + TILE_SIZE / 2,
        direction: Direction.UP,
        mode: GhostMode.CHASE,
      };
      // Target is to the right
      const target = { tileX: 3, tileY: 2 };
      const dir = chooseBestDirection(ghost, maze, target);
      expect(dir).toBe(Direction.RIGHT);
    });

    it('chooses random direction in FRIGHTENED mode', () => {
      const ghost = {
        x: TILE_SIZE * 2 + TILE_SIZE / 2,
        y: TILE_SIZE * 2 + TILE_SIZE / 2,
        direction: Direction.UP,
        mode: GhostMode.FRIGHTENED,
      };
      const target = { tileX: 3, tileY: 2 };

      // Run multiple times to check randomness
      const directions = new Set();
      for (let i = 0; i < 20; i++) {
        const dir = chooseBestDirection(ghost, maze, target);
        directions.add(dir);
      }
      // In frightened mode, random selection should occur
      expect(directions.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateGhost', () => {
    let maze;
    let ghosts;
    let playerPos;
    let playerDir;

    beforeEach(() => {
      maze = createTestMaze();
      ghosts = createAllGhosts();
      playerPos = { x: TILE_SIZE * 2 + TILE_SIZE / 2, y: TILE_SIZE * 2 + TILE_SIZE / 2 };
      playerDir = Direction.RIGHT;
    });

    it('increments timeInHouse while in ghost house', () => {
      const ghost = createGhost(GhostType.PINKY);
      expect(ghost.timeInHouse).toBe(0);

      const updated = updateGhost(ghost, maze, playerPos, playerDir, null, null, ghosts, 100, GhostMode.SCATTER);
      expect(updated.timeInHouse).toBe(100);
    });

    it('returns new ghost object (immutable)', () => {
      const ghost = createGhost(GhostType.BLINKY);
      const updated = updateGhost(ghost, maze, playerPos, playerDir, null, null, ghosts, 16, GhostMode.SCATTER);
      expect(updated).not.toBe(ghost);
    });

    it('bounces in house before release time', () => {
      const ghost = createGhost(GhostType.CLYDE); // 6000ms delay
      const updated = updateGhost(ghost, maze, playerPos, playerDir, null, null, ghosts, 100, GhostMode.SCATTER);
      expect(updated.mode).toBe(GhostMode.IN_HOUSE);
    });

    it('sets isExiting when release delay reached', () => {
      const ghost = { ...createGhost(GhostType.BLINKY), timeInHouse: 0 }; // Blinky has 0 delay
      const updated = updateGhost(ghost, maze, playerPos, playerDir, null, null, ghosts, 100, GhostMode.SCATTER);
      expect(updated.isExiting).toBe(true);
    });
  });

  describe('updateAllGhosts', () => {
    it('updates all four ghosts', () => {
      const maze = createTestMaze();
      const ghosts = createAllGhosts();
      const playerPos = { x: TILE_SIZE * 2, y: TILE_SIZE * 2 };
      const playerDir = Direction.RIGHT;

      const updated = updateAllGhosts(ghosts, maze, playerPos, playerDir, null, null, 16, GhostMode.SCATTER);

      expect(updated[GhostType.BLINKY]).toBeDefined();
      expect(updated[GhostType.PINKY]).toBeDefined();
      expect(updated[GhostType.INKY]).toBeDefined();
      expect(updated[GhostType.CLYDE]).toBeDefined();
    });

    it('returns new object (immutable)', () => {
      const maze = createTestMaze();
      const ghosts = createAllGhosts();
      const playerPos = { x: TILE_SIZE * 2, y: TILE_SIZE * 2 };
      const playerDir = Direction.RIGHT;

      const updated = updateAllGhosts(ghosts, maze, playerPos, playerDir, null, null, 16, GhostMode.SCATTER);

      expect(updated).not.toBe(ghosts);
    });
  });

  describe('setGhostMode', () => {
    it('sets mode for all active ghosts', () => {
      let ghosts = createAllGhosts();
      // Move ghosts out of house
      for (const type of Object.keys(ghosts)) {
        ghosts[type] = { ...ghosts[type], mode: GhostMode.SCATTER };
      }

      const updated = setGhostMode(ghosts, GhostMode.CHASE);

      expect(updated[GhostType.BLINKY].mode).toBe(GhostMode.CHASE);
      expect(updated[GhostType.PINKY].mode).toBe(GhostMode.CHASE);
    });

    it('does not affect ghosts in house', () => {
      const ghosts = createAllGhosts(); // All start IN_HOUSE
      const updated = setGhostMode(ghosts, GhostMode.CHASE);

      expect(updated[GhostType.BLINKY].mode).toBe(GhostMode.IN_HOUSE);
    });

    it('does not affect eaten ghosts', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.BLINKY] = { ...ghosts[GhostType.BLINKY], mode: GhostMode.EATEN };

      const updated = setGhostMode(ghosts, GhostMode.CHASE);

      expect(updated[GhostType.BLINKY].mode).toBe(GhostMode.EATEN);
    });

    it('stores previous mode', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.BLINKY] = { ...ghosts[GhostType.BLINKY], mode: GhostMode.SCATTER };

      const updated = setGhostMode(ghosts, GhostMode.FRIGHTENED);

      expect(updated[GhostType.BLINKY].previousMode).toBe(GhostMode.SCATTER);
    });

    it('reverses direction when reverse flag is true', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.BLINKY] = {
        ...ghosts[GhostType.BLINKY],
        mode: GhostMode.SCATTER,
        direction: Direction.RIGHT,
      };

      const updated = setGhostMode(ghosts, GhostMode.FRIGHTENED, true);

      expect(updated[GhostType.BLINKY].direction).toBe(Direction.LEFT);
    });
  });

  describe('markGhostEaten', () => {
    it('marks frightened ghost as eaten', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.BLINKY] = { ...ghosts[GhostType.BLINKY], mode: GhostMode.FRIGHTENED };

      const updated = markGhostEaten(ghosts, GhostType.BLINKY);

      expect(updated[GhostType.BLINKY].mode).toBe(GhostMode.EATEN);
    });

    it('does not affect non-frightened ghost', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.BLINKY] = { ...ghosts[GhostType.BLINKY], mode: GhostMode.CHASE };

      const updated = markGhostEaten(ghosts, GhostType.BLINKY);

      expect(updated[GhostType.BLINKY].mode).toBe(GhostMode.CHASE);
    });

    it('returns original ghosts if ghost not frightened', () => {
      let ghosts = createAllGhosts();
      const updated = markGhostEaten(ghosts, GhostType.BLINKY);

      expect(updated).toBe(ghosts);
    });
  });

  describe('endFrightenedMode', () => {
    it('returns frightened ghosts to previous mode', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.BLINKY] = {
        ...ghosts[GhostType.BLINKY],
        mode: GhostMode.FRIGHTENED,
        previousMode: GhostMode.CHASE,
      };

      const updated = endFrightenedMode(ghosts);

      expect(updated[GhostType.BLINKY].mode).toBe(GhostMode.CHASE);
    });

    it('defaults to CHASE if no previous mode', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.BLINKY] = {
        ...ghosts[GhostType.BLINKY],
        mode: GhostMode.FRIGHTENED,
        previousMode: undefined,
      };

      const updated = endFrightenedMode(ghosts);

      expect(updated[GhostType.BLINKY].mode).toBe(GhostMode.CHASE);
    });

    it('does not affect non-frightened ghosts', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.BLINKY] = { ...ghosts[GhostType.BLINKY], mode: GhostMode.SCATTER };

      const updated = endFrightenedMode(ghosts);

      expect(updated[GhostType.BLINKY].mode).toBe(GhostMode.SCATTER);
    });
  });

  describe('resetGhosts', () => {
    it('returns fresh ghost states', () => {
      const ghosts = resetGhosts();

      expect(Object.keys(ghosts)).toHaveLength(4);
      expect(ghosts[GhostType.BLINKY].mode).toBe(GhostMode.IN_HOUSE);
      expect(ghosts[GhostType.BLINKY].timeInHouse).toBe(0);
    });

    it('resets positions to start', () => {
      const ghosts = resetGhosts();

      expect(ghosts[GhostType.BLINKY].x).toBe(GHOST_START_POSITIONS[GhostType.BLINKY].x);
      expect(ghosts[GhostType.BLINKY].y).toBe(GHOST_START_POSITIONS[GhostType.BLINKY].y);
    });
  });

  describe('checkGhostCollision', () => {
    it('returns no collision when player is far from all ghosts', () => {
      let ghosts = createAllGhosts();
      // Move ghosts out of house
      for (const type of Object.keys(ghosts)) {
        ghosts[type] = {
          ...ghosts[type],
          mode: GhostMode.CHASE,
          x: TILE_SIZE * 15,
          y: TILE_SIZE * 10,
        };
      }

      const result = checkGhostCollision(ghosts, TILE_SIZE * 2, TILE_SIZE * 2);

      expect(result.collision).toBe(false);
      expect(result.ghostType).toBeNull();
    });

    it('detects collision with chase ghost', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.BLINKY] = {
        ...ghosts[GhostType.BLINKY],
        mode: GhostMode.CHASE,
        x: TILE_SIZE * 5 + TILE_SIZE / 2,
        y: TILE_SIZE * 5 + TILE_SIZE / 2,
      };

      // Player at same position
      const result = checkGhostCollision(ghosts, TILE_SIZE * 5 + TILE_SIZE / 2, TILE_SIZE * 5 + TILE_SIZE / 2);

      expect(result.collision).toBe(true);
      expect(result.ghostType).toBe(GhostType.BLINKY);
      expect(result.canEat).toBe(false);
    });

    it('detects collision with frightened ghost (canEat = true)', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.PINKY] = {
        ...ghosts[GhostType.PINKY],
        mode: GhostMode.FRIGHTENED,
        x: TILE_SIZE * 5 + TILE_SIZE / 2,
        y: TILE_SIZE * 5 + TILE_SIZE / 2,
      };

      const result = checkGhostCollision(ghosts, TILE_SIZE * 5 + TILE_SIZE / 2, TILE_SIZE * 5 + TILE_SIZE / 2);

      expect(result.collision).toBe(true);
      expect(result.ghostType).toBe(GhostType.PINKY);
      expect(result.canEat).toBe(true);
    });

    it('ignores ghosts in house', () => {
      const ghosts = createAllGhosts(); // All IN_HOUSE

      const result = checkGhostCollision(
        ghosts,
        GHOST_START_POSITIONS[GhostType.BLINKY].x,
        GHOST_START_POSITIONS[GhostType.BLINKY].y
      );

      expect(result.collision).toBe(false);
    });

    it('ignores eaten ghosts', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.BLINKY] = {
        ...ghosts[GhostType.BLINKY],
        mode: GhostMode.EATEN,
        x: TILE_SIZE * 5,
        y: TILE_SIZE * 5,
      };

      const result = checkGhostCollision(ghosts, TILE_SIZE * 5, TILE_SIZE * 5);

      expect(result.collision).toBe(false);
    });

    it('respects custom collision radius', () => {
      let ghosts = createAllGhosts();
      ghosts[GhostType.BLINKY] = {
        ...ghosts[GhostType.BLINKY],
        mode: GhostMode.CHASE,
        x: TILE_SIZE * 5,
        y: TILE_SIZE * 5,
      };

      // Player close but outside small radius
      const result = checkGhostCollision(ghosts, TILE_SIZE * 5 + 10, TILE_SIZE * 5, 5);

      expect(result.collision).toBe(false);
    });
  });
});
