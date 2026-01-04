/**
 * Tests for RandomFruit system pure functions.
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RANDOM_FRUIT_CONFIG,
  RANDOM_FRUIT_TYPES,
  createInitialRandomFruitState,
  getRandomSpawnInterval,
  selectRandomFruitType,
  getValidSpawnPositions,
  createRandomFruit,
  trySpawnRandomFruit,
  updateRandomFruitTimers,
  checkRandomFruitCollision,
  collectRandomFruit,
  updateRandomFruits,
  resetRandomFruits,
  getRandomFruitVisualData,
} from './RandomFruit.js';
import { FruitType, FRUIT_DATA } from './Fruit.js';
import { TILE_SIZE } from './Dots.js';

describe('RandomFruit', () => {
  describe('Constants', () => {
    it('has sensible spawn interval configuration', () => {
      expect(RANDOM_FRUIT_CONFIG.MIN_SPAWN_INTERVAL).toBe(8000);
      expect(RANDOM_FRUIT_CONFIG.MAX_SPAWN_INTERVAL).toBe(15000);
      expect(RANDOM_FRUIT_CONFIG.MIN_SPAWN_INTERVAL).toBeLessThan(RANDOM_FRUIT_CONFIG.MAX_SPAWN_INTERVAL);
    });

    it('has reasonable fruit lifetime', () => {
      expect(RANDOM_FRUIT_CONFIG.FRUIT_LIFETIME).toBe(7000);
    });

    it('limits max active fruits', () => {
      expect(RANDOM_FRUIT_CONFIG.MAX_ACTIVE_FRUITS).toBe(2);
    });

    it('has fruit types with weights', () => {
      expect(RANDOM_FRUIT_TYPES.length).toBeGreaterThan(0);
      for (const { type, weight } of RANDOM_FRUIT_TYPES) {
        expect(type).toBeDefined();
        expect(weight).toBeGreaterThan(0);
      }
    });
  });

  describe('createInitialRandomFruitState', () => {
    it('creates state with empty active fruits array', () => {
      const state = createInitialRandomFruitState();
      expect(state.activeFruits).toEqual([]);
    });

    it('creates state with spawn timer set', () => {
      const state = createInitialRandomFruitState();
      expect(state.nextSpawnTimer).toBeGreaterThanOrEqual(RANDOM_FRUIT_CONFIG.MIN_SPAWN_INTERVAL);
      expect(state.nextSpawnTimer).toBeLessThanOrEqual(RANDOM_FRUIT_CONFIG.MAX_SPAWN_INTERVAL);
    });

    it('creates state with empty points popups', () => {
      const state = createInitialRandomFruitState();
      expect(state.pointsPopups).toEqual([]);
    });

    it('creates state with nextFruitId at 1', () => {
      const state = createInitialRandomFruitState();
      expect(state.nextFruitId).toBe(1);
    });
  });

  describe('getRandomSpawnInterval', () => {
    it('returns value within configured range', () => {
      for (let i = 0; i < 100; i++) {
        const interval = getRandomSpawnInterval();
        expect(interval).toBeGreaterThanOrEqual(RANDOM_FRUIT_CONFIG.MIN_SPAWN_INTERVAL);
        expect(interval).toBeLessThanOrEqual(RANDOM_FRUIT_CONFIG.MAX_SPAWN_INTERVAL);
      }
    });
  });

  describe('selectRandomFruitType', () => {
    it('returns a valid fruit type', () => {
      const validTypes = Object.values(FruitType);
      for (let i = 0; i < 50; i++) {
        const type = selectRandomFruitType(1);
        expect(validTypes).toContain(type);
      }
    });

    it('always returns a fruit type (never undefined)', () => {
      for (let level = 1; level <= 10; level++) {
        for (let i = 0; i < 10; i++) {
          const type = selectRandomFruitType(level);
          expect(type).toBeDefined();
        }
      }
    });
  });

  describe('getValidSpawnPositions', () => {
    const createTestMaze = () => [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ];

    const createEmptyDotsState = () => ({ dots: {} });

    it('excludes wall tiles', () => {
      const maze = createTestMaze();
      const dotsState = createEmptyDotsState();
      const playerPos = { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };

      const positions = getValidSpawnPositions(maze, dotsState, [], playerPos);

      // Should not include any wall positions
      for (const pos of positions) {
        expect(maze[pos.tileY][pos.tileX]).not.toBe(1);
      }
    });

    it('excludes tiles too close to player', () => {
      const maze = createTestMaze();
      const dotsState = createEmptyDotsState();
      const playerPos = { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };

      const positions = getValidSpawnPositions(maze, dotsState, [], playerPos);

      for (const pos of positions) {
        const dist = Math.abs(pos.tileX - 1) + Math.abs(pos.tileY - 1);
        expect(dist).toBeGreaterThanOrEqual(RANDOM_FRUIT_CONFIG.MIN_SPAWN_DISTANCE);
      }
    });

    it('excludes tiles with existing fruits', () => {
      const maze = createTestMaze();
      const dotsState = createEmptyDotsState();
      const playerPos = { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };
      const existingFruits = [{ tileX: 3, tileY: 3 }];

      const positions = getValidSpawnPositions(maze, dotsState, existingFruits, playerPos);

      const has33 = positions.some(p => p.tileX === 3 && p.tileY === 3);
      expect(has33).toBe(false);
    });

    it('excludes tiles with uncollected dots', () => {
      const maze = createTestMaze();
      const dotsState = {
        dots: {
          'dot-3-3': { tileX: 3, tileY: 3, collected: false },
        },
      };
      const playerPos = { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };

      const positions = getValidSpawnPositions(maze, dotsState, [], playerPos);

      const has33 = positions.some(p => p.tileX === 3 && p.tileY === 3);
      expect(has33).toBe(false);
    });

    it('includes tiles with collected dots', () => {
      const maze = createTestMaze();
      const dotsState = {
        dots: {
          'dot-3-3': { tileX: 3, tileY: 3, collected: true },
        },
      };
      // Player far away so tile 3,3 is valid
      const playerPos = { x: TILE_SIZE * 100, y: TILE_SIZE * 100 };

      const positions = getValidSpawnPositions(maze, dotsState, [], playerPos);

      const has33 = positions.some(p => p.tileX === 3 && p.tileY === 3);
      expect(has33).toBe(true);
    });

    it('respects player 2 distance when provided', () => {
      const maze = createTestMaze();
      const dotsState = createEmptyDotsState();
      const playerPos = { x: TILE_SIZE * 100, y: TILE_SIZE * 100 }; // Far away
      const player2Pos = { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };

      const positions = getValidSpawnPositions(maze, dotsState, [], playerPos, player2Pos);

      for (const pos of positions) {
        const dist = Math.abs(pos.tileX - 1) + Math.abs(pos.tileY - 1);
        expect(dist).toBeGreaterThanOrEqual(RANDOM_FRUIT_CONFIG.MIN_SPAWN_DISTANCE);
      }
    });
  });

  describe('createRandomFruit', () => {
    it('creates fruit with correct id', () => {
      const fruit = createRandomFruit(42, 5, 7, FruitType.CHERRY);
      expect(fruit.id).toBe(42);
    });

    it('creates fruit with correct tile position', () => {
      const fruit = createRandomFruit(1, 5, 7, FruitType.CHERRY);
      expect(fruit.tileX).toBe(5);
      expect(fruit.tileY).toBe(7);
    });

    it('creates fruit with correct pixel position (center of tile)', () => {
      const fruit = createRandomFruit(1, 5, 7, FruitType.CHERRY);
      expect(fruit.x).toBe(5 * TILE_SIZE + TILE_SIZE / 2);
      expect(fruit.y).toBe(7 * TILE_SIZE + TILE_SIZE / 2);
    });

    it('creates fruit with correct type', () => {
      const fruit = createRandomFruit(1, 5, 7, FruitType.GRAPES);
      expect(fruit.type).toBe(FruitType.GRAPES);
    });

    it('creates fruit with lifetime set to config value', () => {
      const fruit = createRandomFruit(1, 5, 7, FruitType.CHERRY);
      expect(fruit.lifetime).toBe(RANDOM_FRUIT_CONFIG.FRUIT_LIFETIME);
    });

    it('creates fruit with fadeIn animation value', () => {
      const fruit = createRandomFruit(1, 5, 7, FruitType.CHERRY);
      expect(fruit.fadeIn).toBe(500);
    });
  });

  describe('trySpawnRandomFruit', () => {
    const createTestMaze = () => [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    it('does not spawn if at max capacity', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [
          { id: 1, tileX: 1, tileY: 1 },
          { id: 2, tileX: 2, tileY: 2 },
        ],
      };
      const maze = createTestMaze();
      const dotsState = { dots: {} };
      const playerPos = { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };

      const newState = trySpawnRandomFruit(state, maze, dotsState, playerPos, null, 1);

      expect(newState.activeFruits.length).toBe(2);
    });

    it('spawns a fruit when under capacity', () => {
      const state = createInitialRandomFruitState();
      const maze = createTestMaze();
      const dotsState = { dots: {} };
      const playerPos = { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };

      const newState = trySpawnRandomFruit(state, maze, dotsState, playerPos, null, 1);

      expect(newState.activeFruits.length).toBe(1);
    });

    it('increments nextFruitId after spawning', () => {
      const state = createInitialRandomFruitState();
      const maze = createTestMaze();
      const dotsState = { dots: {} };
      const playerPos = { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };

      const newState = trySpawnRandomFruit(state, maze, dotsState, playerPos, null, 1);

      expect(newState.nextFruitId).toBe(2);
    });

    it('does not modify original state', () => {
      const state = createInitialRandomFruitState();
      const originalFruitCount = state.activeFruits.length;
      const maze = createTestMaze();
      const dotsState = { dots: {} };
      const playerPos = { x: TILE_SIZE * 1.5, y: TILE_SIZE * 1.5 };

      trySpawnRandomFruit(state, maze, dotsState, playerPos, null, 1);

      expect(state.activeFruits.length).toBe(originalFruitCount);
    });
  });

  describe('updateRandomFruitTimers', () => {
    it('decrements spawn timer', () => {
      const state = {
        ...createInitialRandomFruitState(),
        nextSpawnTimer: 10000,
      };

      const newState = updateRandomFruitTimers(state, 1000);

      expect(newState.nextSpawnTimer).toBe(9000);
    });

    it('sets shouldTrySpawn when timer expires', () => {
      const state = {
        ...createInitialRandomFruitState(),
        nextSpawnTimer: 500,
      };

      const newState = updateRandomFruitTimers(state, 1000);

      expect(newState.shouldTrySpawn).toBe(true);
    });

    it('resets spawn timer when it expires', () => {
      const state = {
        ...createInitialRandomFruitState(),
        nextSpawnTimer: 500,
      };

      const newState = updateRandomFruitTimers(state, 1000);

      expect(newState.nextSpawnTimer).toBeGreaterThanOrEqual(RANDOM_FRUIT_CONFIG.MIN_SPAWN_INTERVAL);
    });

    it('decrements fruit lifetime', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [{ id: 1, lifetime: 5000, fadeIn: 0 }],
      };

      const newState = updateRandomFruitTimers(state, 1000);

      expect(newState.activeFruits[0].lifetime).toBe(4000);
    });

    it('removes fruits with expired lifetime', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [{ id: 1, lifetime: 500, fadeIn: 0 }],
      };

      const newState = updateRandomFruitTimers(state, 1000);

      expect(newState.activeFruits.length).toBe(0);
    });

    it('decrements fadeIn value', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [{ id: 1, lifetime: 5000, fadeIn: 400 }],
      };

      const newState = updateRandomFruitTimers(state, 100);

      expect(newState.activeFruits[0].fadeIn).toBe(300);
    });

    it('does not let fadeIn go below 0', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [{ id: 1, lifetime: 5000, fadeIn: 50 }],
      };

      const newState = updateRandomFruitTimers(state, 100);

      expect(newState.activeFruits[0].fadeIn).toBe(0);
    });

    it('decrements popup timers', () => {
      const state = {
        ...createInitialRandomFruitState(),
        pointsPopups: [{ id: 1, timer: 1000, points: 100 }],
      };

      const newState = updateRandomFruitTimers(state, 200);

      expect(newState.pointsPopups[0].timer).toBe(800);
    });

    it('removes expired popups', () => {
      const state = {
        ...createInitialRandomFruitState(),
        pointsPopups: [{ id: 1, timer: 500, points: 100 }],
      };

      const newState = updateRandomFruitTimers(state, 1000);

      expect(newState.pointsPopups.length).toBe(0);
    });
  });

  describe('checkRandomFruitCollision', () => {
    it('returns null when no fruits active', () => {
      const result = checkRandomFruitCollision(100, 100, []);
      expect(result).toBeNull();
    });

    it('returns fruit when player is on same tile', () => {
      const fruits = [{ id: 1, tileX: 2, tileY: 3 }];
      const playerX = 2 * TILE_SIZE + TILE_SIZE / 2;
      const playerY = 3 * TILE_SIZE + TILE_SIZE / 2;

      const result = checkRandomFruitCollision(playerX, playerY, fruits);

      expect(result).toBe(fruits[0]);
    });

    it('returns null when player is on different tile', () => {
      const fruits = [{ id: 1, tileX: 2, tileY: 3 }];
      const playerX = 5 * TILE_SIZE + TILE_SIZE / 2;
      const playerY = 5 * TILE_SIZE + TILE_SIZE / 2;

      const result = checkRandomFruitCollision(playerX, playerY, fruits);

      expect(result).toBeNull();
    });

    it('returns first matching fruit when multiple exist', () => {
      const fruits = [
        { id: 1, tileX: 2, tileY: 3 },
        { id: 2, tileX: 2, tileY: 3 },
      ];
      const playerX = 2 * TILE_SIZE + TILE_SIZE / 2;
      const playerY = 3 * TILE_SIZE + TILE_SIZE / 2;

      const result = checkRandomFruitCollision(playerX, playerY, fruits);

      expect(result.id).toBe(1);
    });
  });

  describe('collectRandomFruit', () => {
    it('removes the collected fruit from activeFruits', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [
          { id: 1, tileX: 2, tileY: 3, type: FruitType.CHERRY, x: 100, y: 150 },
          { id: 2, tileX: 5, tileY: 6, type: FruitType.ORANGE, x: 200, y: 250 },
        ],
      };
      const fruitToCollect = state.activeFruits[0];

      const { newState } = collectRandomFruit(state, fruitToCollect);

      expect(newState.activeFruits.length).toBe(1);
      expect(newState.activeFruits[0].id).toBe(2);
    });

    it('returns correct points for fruit type', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [
          { id: 1, type: FruitType.GRAPES, x: 100, y: 150 },
        ],
      };

      const { points } = collectRandomFruit(state, state.activeFruits[0]);

      expect(points).toBe(FRUIT_DATA[FruitType.GRAPES].points);
    });

    it('adds a points popup', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [
          { id: 1, type: FruitType.CHERRY, x: 100, y: 150 },
        ],
      };

      const { newState } = collectRandomFruit(state, state.activeFruits[0]);

      expect(newState.pointsPopups.length).toBe(1);
      expect(newState.pointsPopups[0].points).toBe(FRUIT_DATA[FruitType.CHERRY].points);
      expect(newState.pointsPopups[0].x).toBe(100);
      expect(newState.pointsPopups[0].y).toBe(150);
    });

    it('does not modify original state', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [
          { id: 1, type: FruitType.CHERRY, x: 100, y: 150 },
        ],
      };

      collectRandomFruit(state, state.activeFruits[0]);

      expect(state.activeFruits.length).toBe(1);
      expect(state.pointsPopups.length).toBe(0);
    });
  });

  describe('updateRandomFruits', () => {
    const createTestMaze = () => [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    it('collects fruit when player collides', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [
          { id: 1, tileX: 5, tileY: 5, type: FruitType.CHERRY, x: 5 * TILE_SIZE + TILE_SIZE / 2, y: 5 * TILE_SIZE + TILE_SIZE / 2, lifetime: 5000, fadeIn: 0 },
        ],
        nextSpawnTimer: 10000,
      };
      const maze = createTestMaze();
      const dotsState = { dots: {} };
      const playerPos = { x: 5 * TILE_SIZE + TILE_SIZE / 2, y: 5 * TILE_SIZE + TILE_SIZE / 2 };

      const { newState, collectedPoints } = updateRandomFruits(state, 100, maze, dotsState, playerPos, null, 1);

      expect(newState.activeFruits.length).toBe(0);
      expect(collectedPoints).toBe(FRUIT_DATA[FruitType.CHERRY].points);
    });

    it('returns 0 points when no collision', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [
          { id: 1, tileX: 8, tileY: 8, type: FruitType.CHERRY, lifetime: 5000, fadeIn: 0 },
        ],
        nextSpawnTimer: 10000,
      };
      const maze = createTestMaze();
      const dotsState = { dots: {} };
      const playerPos = { x: 1 * TILE_SIZE + TILE_SIZE / 2, y: 1 * TILE_SIZE + TILE_SIZE / 2 };

      const { collectedPoints } = updateRandomFruits(state, 100, maze, dotsState, playerPos, null, 1);

      expect(collectedPoints).toBe(0);
    });

    it('handles player 2 collision in 2P mode', () => {
      const state = {
        ...createInitialRandomFruitState(),
        activeFruits: [
          { id: 1, tileX: 8, tileY: 8, type: FruitType.ORANGE, x: 8 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2, lifetime: 5000, fadeIn: 0 },
        ],
        nextSpawnTimer: 10000,
      };
      const maze = createTestMaze();
      const dotsState = { dots: {} };
      const playerPos = { x: 1 * TILE_SIZE + TILE_SIZE / 2, y: 1 * TILE_SIZE + TILE_SIZE / 2 };
      const player2Pos = { x: 8 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2 };

      const { newState, collectedPoints } = updateRandomFruits(state, 100, maze, dotsState, playerPos, player2Pos, 1);

      expect(newState.activeFruits.length).toBe(0);
      expect(collectedPoints).toBe(FRUIT_DATA[FruitType.ORANGE].points);
    });
  });

  describe('resetRandomFruits', () => {
    it('returns fresh initial state', () => {
      const state = resetRandomFruits();
      expect(state.activeFruits).toEqual([]);
      expect(state.pointsPopups).toEqual([]);
      expect(state.nextFruitId).toBe(1);
    });
  });

  describe('getRandomFruitVisualData', () => {
    it('returns correct position', () => {
      const fruit = { x: 100, y: 200, type: FruitType.CHERRY, fadeIn: 0, lifetime: 5000 };
      const data = getRandomFruitVisualData(fruit);
      expect(data.x).toBe(100);
      expect(data.y).toBe(200);
    });

    it('returns correct color from FRUIT_DATA', () => {
      const fruit = { x: 100, y: 200, type: FruitType.CHERRY, fadeIn: 0, lifetime: 5000 };
      const data = getRandomFruitVisualData(fruit);
      expect(data.color).toBe(FRUIT_DATA[FruitType.CHERRY].color);
    });

    it('returns full opacity when fadeIn complete and lifetime high', () => {
      const fruit = { x: 100, y: 200, type: FruitType.CHERRY, fadeIn: 0, lifetime: 5000 };
      const data = getRandomFruitVisualData(fruit);
      expect(data.opacity).toBe(1);
    });

    it('returns partial opacity during fadeIn', () => {
      const fruit = { x: 100, y: 200, type: FruitType.CHERRY, fadeIn: 250, lifetime: 5000 };
      const data = getRandomFruitVisualData(fruit);
      expect(data.opacity).toBe(0.5);
    });

    it('indicates blinking when lifetime is low', () => {
      const fruit = { x: 100, y: 200, type: FruitType.CHERRY, fadeIn: 0, lifetime: 1500 };
      const data = getRandomFruitVisualData(fruit);
      expect(data.isBlinking).toBe(true);
    });

    it('does not indicate blinking when lifetime is high', () => {
      const fruit = { x: 100, y: 200, type: FruitType.CHERRY, fadeIn: 0, lifetime: 5000 };
      const data = getRandomFruitVisualData(fruit);
      expect(data.isBlinking).toBe(false);
    });

    it('handles unknown fruit type gracefully', () => {
      const fruit = { x: 100, y: 200, type: 'unknown', fadeIn: 0, lifetime: 5000 };
      const data = getRandomFruitVisualData(fruit);
      expect(data.color).toBe('#ffffff');
      expect(data.emoji).toBe('?');
    });
  });
});
