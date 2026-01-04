/**
 * Tests for Fruit system pure functions.
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import {
  FRUIT_SPAWN_TILE,
  FRUIT_SPAWN_THRESHOLDS,
  FRUIT_DURATION,
  FruitType,
  FRUIT_DATA,
  getFruitForLevel,
  getFruitPoints,
  getFruitData,
  createInitialFruitState,
  shouldSpawnFruit,
  spawnFruit,
  updateFruitTimer,
  checkFruitCollision,
  collectFruit,
  resetFruitForLevel,
} from './Fruit.js';
import { TILE_SIZE } from './Dots.js';

describe('Fruit', () => {
  describe('Constants', () => {
    it('has FRUIT_SPAWN_TILE at center of maze', () => {
      expect(FRUIT_SPAWN_TILE).toEqual({ x: 9, y: 7 });
    });

    it('has two spawn thresholds', () => {
      expect(FRUIT_SPAWN_THRESHOLDS).toEqual([30, 70]);
    });

    it('has FRUIT_DURATION of 10 seconds', () => {
      expect(FRUIT_DURATION).toBe(10000);
    });

    it('has all FruitType values defined', () => {
      expect(FruitType.CHERRY).toBe('cherry');
      expect(FruitType.STRAWBERRY).toBe('strawberry');
      expect(FruitType.ORANGE).toBe('orange');
      expect(FruitType.APPLE).toBe('apple');
      expect(FruitType.GRAPES).toBe('grapes');
      expect(FruitType.GALAXIAN).toBe('galaxian');
      expect(FruitType.BELL).toBe('bell');
      expect(FruitType.KEY).toBe('key');
    });

    it('has FRUIT_DATA for all fruit types with correct structure', () => {
      Object.values(FruitType).forEach((fruitType) => {
        const data = FRUIT_DATA[fruitType];
        expect(data).toBeDefined();
        expect(typeof data.points).toBe('number');
        expect(typeof data.color).toBe('string');
        expect(typeof data.emoji).toBe('string');
      });
    });

    it('has increasing point values for fruits', () => {
      expect(FRUIT_DATA[FruitType.CHERRY].points).toBe(100);
      expect(FRUIT_DATA[FruitType.STRAWBERRY].points).toBe(300);
      expect(FRUIT_DATA[FruitType.ORANGE].points).toBe(500);
      expect(FRUIT_DATA[FruitType.APPLE].points).toBe(700);
      expect(FRUIT_DATA[FruitType.GRAPES].points).toBe(1000);
      expect(FRUIT_DATA[FruitType.GALAXIAN].points).toBe(2000);
      expect(FRUIT_DATA[FruitType.BELL].points).toBe(3000);
      expect(FRUIT_DATA[FruitType.KEY].points).toBe(5000);
    });
  });

  describe('getFruitForLevel', () => {
    it('returns CHERRY for levels 1-2', () => {
      expect(getFruitForLevel(1)).toBe(FruitType.CHERRY);
      expect(getFruitForLevel(2)).toBe(FruitType.CHERRY);
    });

    it('returns STRAWBERRY for levels 3-4', () => {
      expect(getFruitForLevel(3)).toBe(FruitType.STRAWBERRY);
      expect(getFruitForLevel(4)).toBe(FruitType.STRAWBERRY);
    });

    it('returns ORANGE for levels 5-6', () => {
      expect(getFruitForLevel(5)).toBe(FruitType.ORANGE);
      expect(getFruitForLevel(6)).toBe(FruitType.ORANGE);
    });

    it('returns APPLE for levels 7-8', () => {
      expect(getFruitForLevel(7)).toBe(FruitType.APPLE);
      expect(getFruitForLevel(8)).toBe(FruitType.APPLE);
    });

    it('returns GRAPES for levels 9-10', () => {
      expect(getFruitForLevel(9)).toBe(FruitType.GRAPES);
      expect(getFruitForLevel(10)).toBe(FruitType.GRAPES);
    });

    it('returns GALAXIAN for levels 11-12', () => {
      expect(getFruitForLevel(11)).toBe(FruitType.GALAXIAN);
      expect(getFruitForLevel(12)).toBe(FruitType.GALAXIAN);
    });

    it('returns BELL for levels 13-14', () => {
      expect(getFruitForLevel(13)).toBe(FruitType.BELL);
      expect(getFruitForLevel(14)).toBe(FruitType.BELL);
    });

    it('returns KEY for levels 15 and above', () => {
      expect(getFruitForLevel(15)).toBe(FruitType.KEY);
      expect(getFruitForLevel(20)).toBe(FruitType.KEY);
      expect(getFruitForLevel(100)).toBe(FruitType.KEY);
    });
  });

  describe('getFruitPoints', () => {
    it('returns correct points for each fruit type', () => {
      expect(getFruitPoints(FruitType.CHERRY)).toBe(100);
      expect(getFruitPoints(FruitType.STRAWBERRY)).toBe(300);
      expect(getFruitPoints(FruitType.ORANGE)).toBe(500);
      expect(getFruitPoints(FruitType.APPLE)).toBe(700);
      expect(getFruitPoints(FruitType.GRAPES)).toBe(1000);
      expect(getFruitPoints(FruitType.GALAXIAN)).toBe(2000);
      expect(getFruitPoints(FruitType.BELL)).toBe(3000);
      expect(getFruitPoints(FruitType.KEY)).toBe(5000);
    });

    it('returns 0 for invalid fruit type', () => {
      expect(getFruitPoints('invalid')).toBe(0);
      expect(getFruitPoints(null)).toBe(0);
      expect(getFruitPoints(undefined)).toBe(0);
    });
  });

  describe('getFruitData', () => {
    it('returns data object for valid fruit type', () => {
      const data = getFruitData(FruitType.CHERRY);
      expect(data).toEqual({ points: 100, color: '#ff0000', emoji: '🍒' });
    });

    it('returns all properties for each fruit type', () => {
      Object.values(FruitType).forEach((fruitType) => {
        const data = getFruitData(fruitType);
        expect(data).not.toBeNull();
        expect(data).toHaveProperty('points');
        expect(data).toHaveProperty('color');
        expect(data).toHaveProperty('emoji');
      });
    });

    it('returns null for invalid fruit type', () => {
      expect(getFruitData('invalid')).toBeNull();
      expect(getFruitData(null)).toBeNull();
      expect(getFruitData(undefined)).toBeNull();
    });
  });

  describe('createInitialFruitState', () => {
    it('creates state with fruit inactive', () => {
      const state = createInitialFruitState();
      expect(state.active).toBe(false);
    });

    it('creates state with type null', () => {
      const state = createInitialFruitState();
      expect(state.type).toBeNull();
    });

    it('creates state with correct spawn position', () => {
      const state = createInitialFruitState();
      expect(state.x).toBe(FRUIT_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2);
      expect(state.y).toBe(FRUIT_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2);
    });

    it('creates state with timer at 0', () => {
      const state = createInitialFruitState();
      expect(state.timer).toBe(0);
    });

    it('creates state with spawnCount at 0', () => {
      const state = createInitialFruitState();
      expect(state.spawnCount).toBe(0);
    });

    it('creates state with lastCollectedPoints at 0', () => {
      const state = createInitialFruitState();
      expect(state.lastCollectedPoints).toBe(0);
    });

    it('creates state with showPointsTimer at 0', () => {
      const state = createInitialFruitState();
      expect(state.showPointsTimer).toBe(0);
    });
  });

  describe('shouldSpawnFruit', () => {
    it('returns false when spawnCount exceeds thresholds length', () => {
      expect(shouldSpawnFruit(100, 2)).toBe(false);
      expect(shouldSpawnFruit(100, 3)).toBe(false);
    });

    it('returns false when dots collected is below first threshold', () => {
      expect(shouldSpawnFruit(0, 0)).toBe(false);
      expect(shouldSpawnFruit(29, 0)).toBe(false);
    });

    it('returns true when dots collected reaches first threshold', () => {
      expect(shouldSpawnFruit(30, 0)).toBe(true);
      expect(shouldSpawnFruit(50, 0)).toBe(true);
    });

    it('returns false when dots collected is below second threshold', () => {
      expect(shouldSpawnFruit(30, 1)).toBe(false);
      expect(shouldSpawnFruit(69, 1)).toBe(false);
    });

    it('returns true when dots collected reaches second threshold', () => {
      expect(shouldSpawnFruit(70, 1)).toBe(true);
      expect(shouldSpawnFruit(100, 1)).toBe(true);
    });
  });

  describe('spawnFruit', () => {
    it('sets fruit to active', () => {
      const state = createInitialFruitState();
      const newState = spawnFruit(state, 1);
      expect(newState.active).toBe(true);
    });

    it('sets fruit type based on level', () => {
      const state = createInitialFruitState();
      expect(spawnFruit(state, 1).type).toBe(FruitType.CHERRY);
      expect(spawnFruit(state, 5).type).toBe(FruitType.ORANGE);
      expect(spawnFruit(state, 15).type).toBe(FruitType.KEY);
    });

    it('sets timer to FRUIT_DURATION', () => {
      const state = createInitialFruitState();
      const newState = spawnFruit(state, 1);
      expect(newState.timer).toBe(FRUIT_DURATION);
    });

    it('increments spawnCount', () => {
      const state = createInitialFruitState();
      const newState = spawnFruit(state, 1);
      expect(newState.spawnCount).toBe(1);

      const newState2 = spawnFruit(newState, 1);
      expect(newState2.spawnCount).toBe(2);
    });

    it('preserves position', () => {
      const state = createInitialFruitState();
      const newState = spawnFruit(state, 1);
      expect(newState.x).toBe(state.x);
      expect(newState.y).toBe(state.y);
    });

    it('does not modify original state', () => {
      const state = createInitialFruitState();
      spawnFruit(state, 1);
      expect(state.active).toBe(false);
      expect(state.spawnCount).toBe(0);
    });
  });

  describe('updateFruitTimer', () => {
    it('returns same state if fruit is inactive and no points timer', () => {
      const state = createInitialFruitState();
      const newState = updateFruitTimer(state, 100);
      expect(newState).toEqual(state);
    });

    it('decrements showPointsTimer when inactive but timer is active', () => {
      const state = {
        ...createInitialFruitState(),
        showPointsTimer: 1000,
      };
      const newState = updateFruitTimer(state, 100);
      expect(newState.showPointsTimer).toBe(900);
    });

    it('does not go below 0 for showPointsTimer', () => {
      const state = {
        ...createInitialFruitState(),
        showPointsTimer: 50,
      };
      const newState = updateFruitTimer(state, 100);
      expect(newState.showPointsTimer).toBe(0);
    });

    it('decrements fruit timer when active', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
        timer: 5000,
      };
      const newState = updateFruitTimer(state, 100);
      expect(newState.timer).toBe(4900);
    });

    it('removes fruit when timer expires', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
        timer: 50,
      };
      const newState = updateFruitTimer(state, 100);
      expect(newState.active).toBe(false);
      expect(newState.type).toBeNull();
      expect(newState.timer).toBe(0);
    });

    it('does not modify original state', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
        timer: 5000,
      };
      updateFruitTimer(state, 100);
      expect(state.timer).toBe(5000);
    });
  });

  describe('checkFruitCollision', () => {
    it('returns false when fruit is inactive', () => {
      const state = createInitialFruitState();
      const playerX = FRUIT_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2;
      const playerY = FRUIT_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2;
      expect(checkFruitCollision(playerX, playerY, state)).toBe(false);
    });

    it('returns true when player is on fruit tile', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
      };
      const playerX = FRUIT_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2;
      const playerY = FRUIT_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2;
      expect(checkFruitCollision(playerX, playerY, state)).toBe(true);
    });

    it('returns true when player is anywhere within fruit tile', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
      };
      // Top-left corner of tile
      const playerX = FRUIT_SPAWN_TILE.x * TILE_SIZE;
      const playerY = FRUIT_SPAWN_TILE.y * TILE_SIZE;
      expect(checkFruitCollision(playerX, playerY, state)).toBe(true);
    });

    it('returns false when player is on adjacent tile', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
      };
      const playerX = (FRUIT_SPAWN_TILE.x + 1) * TILE_SIZE + TILE_SIZE / 2;
      const playerY = FRUIT_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2;
      expect(checkFruitCollision(playerX, playerY, state)).toBe(false);
    });

    it('returns false when player is far from fruit', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
      };
      expect(checkFruitCollision(0, 0, state)).toBe(false);
    });
  });

  describe('collectFruit', () => {
    it('returns unchanged state and 0 points when fruit is inactive', () => {
      const state = createInitialFruitState();
      const { newFruitState, points } = collectFruit(state);
      expect(points).toBe(0);
      expect(newFruitState).toEqual(state);
    });

    it('returns points for collected fruit', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
        timer: 5000,
      };
      const { points } = collectFruit(state);
      expect(points).toBe(100);
    });

    it('returns correct points for each fruit type', () => {
      Object.values(FruitType).forEach((fruitType) => {
        const state = {
          ...createInitialFruitState(),
          active: true,
          type: fruitType,
          timer: 5000,
        };
        const { points } = collectFruit(state);
        expect(points).toBe(FRUIT_DATA[fruitType].points);
      });
    });

    it('sets fruit to inactive after collection', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
        timer: 5000,
      };
      const { newFruitState } = collectFruit(state);
      expect(newFruitState.active).toBe(false);
    });

    it('sets type to null after collection', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
        timer: 5000,
      };
      const { newFruitState } = collectFruit(state);
      expect(newFruitState.type).toBeNull();
    });

    it('sets timer to 0 after collection', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
        timer: 5000,
      };
      const { newFruitState } = collectFruit(state);
      expect(newFruitState.timer).toBe(0);
    });

    it('sets lastCollectedPoints to collected amount', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.GRAPES,
        timer: 5000,
      };
      const { newFruitState } = collectFruit(state);
      expect(newFruitState.lastCollectedPoints).toBe(1000);
    });

    it('sets showPointsTimer to 2000ms', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
        timer: 5000,
      };
      const { newFruitState } = collectFruit(state);
      expect(newFruitState.showPointsTimer).toBe(2000);
    });

    it('preserves spawnCount after collection', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
        timer: 5000,
        spawnCount: 1,
      };
      const { newFruitState } = collectFruit(state);
      expect(newFruitState.spawnCount).toBe(1);
    });

    it('does not modify original state', () => {
      const state = {
        ...createInitialFruitState(),
        active: true,
        type: FruitType.CHERRY,
        timer: 5000,
      };
      collectFruit(state);
      expect(state.active).toBe(true);
      expect(state.type).toBe(FruitType.CHERRY);
    });
  });

  describe('resetFruitForLevel', () => {
    it('returns a fresh initial fruit state', () => {
      const state = resetFruitForLevel();
      expect(state).toEqual(createInitialFruitState());
    });

    it('has inactive fruit', () => {
      const state = resetFruitForLevel();
      expect(state.active).toBe(false);
    });

    it('has spawnCount reset to 0', () => {
      const state = resetFruitForLevel();
      expect(state.spawnCount).toBe(0);
    });

    it('has timer at 0', () => {
      const state = resetFruitForLevel();
      expect(state.timer).toBe(0);
    });
  });
});
