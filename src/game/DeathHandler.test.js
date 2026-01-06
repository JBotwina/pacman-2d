/**
 * Tests for DeathHandler module - player death, respawn, and invincibility.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  canPlayerDie,
  isPlayerInvincible,
  resetEatenGhosts,
  respawnPlayer,
  updateInvincibility,
  getPlayerSpawnPosition,
  INVINCIBILITY_DURATION,
  PLAYER_SPAWN_POSITIONS,
} from './DeathHandler.js';
import { GhostMode, Direction, GHOST_START_POSITIONS } from './GhostAI.js';
import { TILE_SIZE } from './Dots.js';

describe('DeathHandler', () => {
  describe('canPlayerDie', () => {
    it('returns true when player 1 is not invincible', () => {
      const state = { player1Invincible: false };
      expect(canPlayerDie(state, 1)).toBe(true);
    });

    it('returns false when player 1 is invincible', () => {
      const state = { player1Invincible: true };
      expect(canPlayerDie(state, 1)).toBe(false);
    });

    it('returns true when player 2 is not invincible', () => {
      const state = { player2Invincible: false };
      expect(canPlayerDie(state, 2)).toBe(true);
    });

    it('returns false when player 2 is invincible', () => {
      const state = { player2Invincible: true };
      expect(canPlayerDie(state, 2)).toBe(false);
    });

    it('defaults to true for undefined invincibility state', () => {
      const state = {};
      expect(canPlayerDie(state, 1)).toBe(true);
      expect(canPlayerDie(state, 2)).toBe(true);
    });
  });

  describe('isPlayerInvincible', () => {
    it('returns true when player 1 is invincible', () => {
      const state = { player1Invincible: true };
      expect(isPlayerInvincible(state, 1)).toBe(true);
    });

    it('returns false when player 1 is not invincible', () => {
      const state = { player1Invincible: false };
      expect(isPlayerInvincible(state, 1)).toBe(false);
    });

    it('returns true when player 2 is invincible', () => {
      const state = { player2Invincible: true };
      expect(isPlayerInvincible(state, 2)).toBe(true);
    });

    it('returns false when player 2 is not invincible', () => {
      const state = { player2Invincible: false };
      expect(isPlayerInvincible(state, 2)).toBe(false);
    });

    it('returns false for undefined state', () => {
      const state = {};
      expect(isPlayerInvincible(state, 1)).toBe(false);
      expect(isPlayerInvincible(state, 2)).toBe(false);
    });
  });

  describe('resetEatenGhosts', () => {
    it('resets EATEN ghosts to IN_HOUSE mode', () => {
      const ghosts = {
        blinky: { mode: GhostMode.EATEN, x: 100, y: 100 },
        pinky: { mode: GhostMode.CHASE, x: 50, y: 50 },
      };

      const result = resetEatenGhosts(ghosts);

      expect(result.blinky.mode).toBe(GhostMode.IN_HOUSE);
      expect(result.blinky.x).toBe(GHOST_START_POSITIONS.blinky.x);
      expect(result.blinky.y).toBe(GHOST_START_POSITIONS.blinky.y);
    });

    it('does not modify non-EATEN ghosts', () => {
      const ghosts = {
        blinky: { mode: GhostMode.CHASE, x: 100, y: 100 },
        pinky: { mode: GhostMode.FRIGHTENED, x: 50, y: 50 },
      };

      const result = resetEatenGhosts(ghosts);

      expect(result.blinky.mode).toBe(GhostMode.CHASE);
      expect(result.blinky.x).toBe(100);
      expect(result.pinky.mode).toBe(GhostMode.FRIGHTENED);
      expect(result.pinky.x).toBe(50);
    });

    it('resets multiple EATEN ghosts', () => {
      const ghosts = {
        blinky: { mode: GhostMode.EATEN, x: 100, y: 100 },
        pinky: { mode: GhostMode.EATEN, x: 50, y: 50 },
        inky: { mode: GhostMode.CHASE, x: 75, y: 75 },
      };

      const result = resetEatenGhosts(ghosts);

      expect(result.blinky.mode).toBe(GhostMode.IN_HOUSE);
      expect(result.pinky.mode).toBe(GhostMode.IN_HOUSE);
      expect(result.inky.mode).toBe(GhostMode.CHASE);
    });
  });

  describe('respawnPlayer', () => {
    let baseState;

    beforeEach(() => {
      baseState = {
        player: { x: 100, y: 100, direction: Direction.UP },
        player2: { x: 200, y: 200, direction: Direction.DOWN },
        player1Invincible: false,
        player1InvincibilityTimer: 0,
        player2Invincible: false,
        player2InvincibilityTimer: 0,
        ghosts: {
          blinky: { mode: GhostMode.CHASE, x: 50, y: 50 },
        },
        ghostsVulnerable: true,
        vulnerabilityTimer: 5000,
      };
    });

    it('respawns player 1 at safe spawn position', () => {
      const result = respawnPlayer(baseState, 1);

      expect(result.player.x).toBe(PLAYER_SPAWN_POSITIONS[1].x);
      expect(result.player.y).toBe(PLAYER_SPAWN_POSITIONS[1].y);
      expect(result.player.direction).toBe(PLAYER_SPAWN_POSITIONS[1].direction);
    });

    it('respawns player 2 at safe spawn position', () => {
      const result = respawnPlayer(baseState, 2);

      expect(result.player2.x).toBe(PLAYER_SPAWN_POSITIONS[2].x);
      expect(result.player2.y).toBe(PLAYER_SPAWN_POSITIONS[2].y);
      expect(result.player2.direction).toBe(PLAYER_SPAWN_POSITIONS[2].direction);
    });

    it('grants invincibility to player 1', () => {
      const result = respawnPlayer(baseState, 1);

      expect(result.player1Invincible).toBe(true);
      expect(result.player1InvincibilityTimer).toBe(INVINCIBILITY_DURATION);
    });

    it('grants invincibility to player 2', () => {
      const result = respawnPlayer(baseState, 2);

      expect(result.player2Invincible).toBe(true);
      expect(result.player2InvincibilityTimer).toBe(INVINCIBILITY_DURATION);
    });

    it('clears ghost vulnerability on respawn', () => {
      const result = respawnPlayer(baseState, 1);

      expect(result.ghostsVulnerable).toBe(false);
      expect(result.vulnerabilityTimer).toBe(0);
    });

    it('resets EATEN ghosts on respawn', () => {
      baseState.ghosts.pinky = { mode: GhostMode.EATEN, x: 75, y: 75 };

      const result = respawnPlayer(baseState, 1);

      expect(result.ghosts.pinky.mode).toBe(GhostMode.IN_HOUSE);
    });

    it('player 2 spawn is far from ghost house', () => {
      // Ghost house is around rows 5-7, P2 should spawn at row 10.5
      const p2Spawn = PLAYER_SPAWN_POSITIONS[2];
      const ghostHouseY = TILE_SIZE * 6; // Approximate ghost house center

      const distanceFromGhostHouse = Math.abs(p2Spawn.y - ghostHouseY);

      // P2 spawn should be at least 4 tiles away from ghost house
      expect(distanceFromGhostHouse).toBeGreaterThan(TILE_SIZE * 3);
    });
  });

  describe('updateInvincibility', () => {
    it('counts down player 1 invincibility timer', () => {
      const state = {
        player1Invincible: true,
        player1InvincibilityTimer: 2000,
        player2Invincible: false,
        player2InvincibilityTimer: 0,
      };

      const result = updateInvincibility(state, 500);

      expect(result.player1InvincibilityTimer).toBe(1500);
      expect(result.player1Invincible).toBe(true);
    });

    it('removes player 1 invincibility when timer expires', () => {
      const state = {
        player1Invincible: true,
        player1InvincibilityTimer: 500,
        player2Invincible: false,
        player2InvincibilityTimer: 0,
      };

      const result = updateInvincibility(state, 600);

      expect(result.player1InvincibilityTimer).toBe(0);
      expect(result.player1Invincible).toBe(false);
    });

    it('counts down player 2 invincibility timer', () => {
      const state = {
        player1Invincible: false,
        player1InvincibilityTimer: 0,
        player2Invincible: true,
        player2InvincibilityTimer: 2000,
      };

      const result = updateInvincibility(state, 500);

      expect(result.player2InvincibilityTimer).toBe(1500);
      expect(result.player2Invincible).toBe(true);
    });

    it('removes player 2 invincibility when timer expires', () => {
      const state = {
        player1Invincible: false,
        player1InvincibilityTimer: 0,
        player2Invincible: true,
        player2InvincibilityTimer: 500,
      };

      const result = updateInvincibility(state, 600);

      expect(result.player2InvincibilityTimer).toBe(0);
      expect(result.player2Invincible).toBe(false);
    });

    it('handles both players invincible simultaneously', () => {
      const state = {
        player1Invincible: true,
        player1InvincibilityTimer: 1000,
        player2Invincible: true,
        player2InvincibilityTimer: 2000,
      };

      const result = updateInvincibility(state, 1500);

      expect(result.player1Invincible).toBe(false);
      expect(result.player1InvincibilityTimer).toBe(0);
      expect(result.player2Invincible).toBe(true);
      expect(result.player2InvincibilityTimer).toBe(500);
    });

    it('does nothing when neither player is invincible', () => {
      const state = {
        player1Invincible: false,
        player1InvincibilityTimer: 0,
        player2Invincible: false,
        player2InvincibilityTimer: 0,
      };

      const result = updateInvincibility(state, 1000);

      expect(result.player1Invincible).toBe(false);
      expect(result.player2Invincible).toBe(false);
    });

    it('handles undefined timer values gracefully', () => {
      const state = {
        player1Invincible: true,
        player2Invincible: false,
      };

      const result = updateInvincibility(state, 100);

      // Should not throw and should handle missing timers
      expect(result.player1InvincibilityTimer).toBe(0);
      expect(result.player1Invincible).toBe(false);
    });
  });

  describe('getPlayerSpawnPosition', () => {
    it('returns player 1 spawn position', () => {
      const pos = getPlayerSpawnPosition(1);
      expect(pos.x).toBe(TILE_SIZE * 2.5);
      expect(pos.y).toBe(TILE_SIZE * 4.5);
      expect(pos.direction).toBe(Direction.RIGHT);
    });

    it('returns player 2 spawn position', () => {
      const pos = getPlayerSpawnPosition(2);
      expect(pos.x).toBe(TILE_SIZE * 2.5);
      expect(pos.y).toBe(TILE_SIZE * 10.5);
      expect(pos.direction).toBe(Direction.LEFT);
    });

    it('defaults to player 1 for invalid player number', () => {
      const pos = getPlayerSpawnPosition(3);
      expect(pos.x).toBe(PLAYER_SPAWN_POSITIONS[1].x);
    });
  });

  describe('INVINCIBILITY_DURATION constant', () => {
    it('is 2.5 seconds', () => {
      expect(INVINCIBILITY_DURATION).toBe(2500);
    });
  });

  describe('player spawn positions safety', () => {
    it('player 1 spawn is in top-left area', () => {
      const p1Spawn = PLAYER_SPAWN_POSITIONS[1];
      // P1 should spawn at approximately (2.5, 4.5) tiles
      expect(p1Spawn.x / TILE_SIZE).toBeCloseTo(2.5);
      expect(p1Spawn.y / TILE_SIZE).toBeCloseTo(4.5);
    });

    it('player 2 spawn is in bottom-left area away from ghosts', () => {
      const p2Spawn = PLAYER_SPAWN_POSITIONS[2];
      // P2 should spawn at approximately (2.5, 10.5) tiles - bottom area
      expect(p2Spawn.x / TILE_SIZE).toBeCloseTo(2.5);
      expect(p2Spawn.y / TILE_SIZE).toBeCloseTo(10.5);
    });

    it('player spawns are in different areas', () => {
      const p1Spawn = PLAYER_SPAWN_POSITIONS[1];
      const p2Spawn = PLAYER_SPAWN_POSITIONS[2];

      // P2 should be at least 5 tiles below P1
      const yDifference = (p2Spawn.y - p1Spawn.y) / TILE_SIZE;
      expect(yDifference).toBeGreaterThanOrEqual(5);
    });
  });

  describe('integration: invincibility prevents death after respawn', () => {
    it('canPlayerDie returns false immediately after respawnPlayer', () => {
      const initialState = {
        player: { x: 100, y: 100, direction: Direction.UP },
        player2: { x: 200, y: 200, direction: Direction.DOWN },
        player1Invincible: false,
        player2Invincible: false,
        ghosts: {},
        ghostsVulnerable: false,
        vulnerabilityTimer: 0,
      };

      // Player 1 dies and respawns
      const afterRespawn = respawnPlayer(initialState, 1);

      // Should be invincible immediately after respawn
      expect(canPlayerDie(afterRespawn, 1)).toBe(false);
      expect(isPlayerInvincible(afterRespawn, 1)).toBe(true);
    });

    it('canPlayerDie returns true after invincibility expires', () => {
      const initialState = {
        player: { x: 100, y: 100, direction: Direction.UP },
        player2: { x: 200, y: 200, direction: Direction.DOWN },
        player1Invincible: false,
        player2Invincible: false,
        ghosts: {},
        ghostsVulnerable: false,
        vulnerabilityTimer: 0,
      };

      // Player 1 dies and respawns
      let state = respawnPlayer(initialState, 1);

      // Invincibility should be active
      expect(canPlayerDie(state, 1)).toBe(false);

      // Fast forward past invincibility duration
      state = updateInvincibility(state, INVINCIBILITY_DURATION + 100);

      // Should be vulnerable again
      expect(canPlayerDie(state, 1)).toBe(true);
      expect(isPlayerInvincible(state, 1)).toBe(false);
    });
  });
});
