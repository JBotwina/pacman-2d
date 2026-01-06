/**
 * Tests for GameState pure functions.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInitialState,
  updateDeathAnimation,
  updateGameState,
  updatePlayerPosition,
  updatePlayer2Position,
  setGameMode,
  startGame,
  pauseGame,
  resumeGame,
  resetGame,
  nextLevel,
  getGhostSpeedMultiplier,
  areGhostsFrightened,
  areGhostsFlashing,
  eatGhost,
  GameStatus,
  GameMode,
  MAX_LEVEL,
  DEATH_ANIMATION_DURATION,
  FRIGHTENED_FLASH_TIME,
  FRIGHTENED_SPEED_MULTIPLIER,
  GHOST_EAT_POINTS,
} from './GameState.js';
import { Direction } from './GhostAI.js';
import { TILE_SIZE } from './Dots.js';

describe('GameState', () => {
  describe('createInitialState', () => {
    it('creates state with MODE_SELECT status', () => {
      const state = createInitialState();
      expect(state.status).toBe(GameStatus.MODE_SELECT);
    });

    it('initializes score to 0', () => {
      const state = createInitialState();
      expect(state.score).toBe(0);
    });

    it('uses provided high score', () => {
      const state = createInitialState(5000);
      expect(state.highScore).toBe(5000);
    });

    it('defaults high score to 0', () => {
      const state = createInitialState();
      expect(state.highScore).toBe(0);
    });

    it('initializes player 1 with 3 lives', () => {
      const state = createInitialState();
      expect(state.lives).toBe(3);
    });

    it('initializes player 2 with 3 lives', () => {
      const state = createInitialState();
      expect(state.player2Lives).toBe(3);
    });

    it('starts at level 1', () => {
      const state = createInitialState();
      expect(state.level).toBe(1);
    });

    it('initializes gameMode to null', () => {
      const state = createInitialState();
      expect(state.gameMode).toBeNull();
    });

    it('creates player 1 at starting position', () => {
      const state = createInitialState();
      expect(state.player.x).toBe(TILE_SIZE * 2.5);
      expect(state.player.y).toBe(TILE_SIZE * 4.5);
      expect(state.player.direction).toBe(Direction.RIGHT);
    });

    it('creates player 2 at starting position', () => {
      const state = createInitialState();
      // P2 spawns at bottom-left area (2.5, 10.5) - away from ghost house
      expect(state.player2.x).toBe(TILE_SIZE * 2.5);
      expect(state.player2.y).toBe(TILE_SIZE * 10.5);
      expect(state.player2.direction).toBe(Direction.LEFT);
    });

    it('initializes ghosts', () => {
      const state = createInitialState();
      expect(state.ghosts).toBeDefined();
      expect(state.ghosts.blinky).toBeDefined();
      expect(state.ghosts.pinky).toBeDefined();
      expect(state.ghosts.inky).toBeDefined();
      expect(state.ghosts.clyde).toBeDefined();
    });

    it('initializes dots and maze', () => {
      const state = createInitialState();
      expect(state.maze).toBeDefined();
      expect(state.dots).toBeDefined();
    });

    it('initializes ghost vulnerability state to false', () => {
      const state = createInitialState();
      expect(state.ghostsVulnerable).toBe(false);
      expect(state.vulnerabilityTimer).toBe(0);
      expect(state.ghostsEatenDuringFrightened).toBe(0);
    });

    it('initializes fruit state', () => {
      const state = createInitialState();
      expect(state.fruit).toBeDefined();
    });

    it('initializes death animation timer to 0', () => {
      const state = createInitialState();
      expect(state.deathAnimationTimer).toBe(0);
    });
  });

  describe('setGameMode', () => {
    it('sets single player mode', () => {
      const state = createInitialState();
      const newState = setGameMode(state, GameMode.SINGLE_PLAYER);
      expect(newState.gameMode).toBe(GameMode.SINGLE_PLAYER);
    });

    it('sets two player mode', () => {
      const state = createInitialState();
      const newState = setGameMode(state, GameMode.TWO_PLAYER);
      expect(newState.gameMode).toBe(GameMode.TWO_PLAYER);
    });

    it('transitions status to IDLE', () => {
      const state = createInitialState();
      expect(state.status).toBe(GameStatus.MODE_SELECT);
      const newState = setGameMode(state, GameMode.SINGLE_PLAYER);
      expect(newState.status).toBe(GameStatus.IDLE);
    });

    it('preserves other state properties', () => {
      const state = createInitialState(1000);
      const newState = setGameMode(state, GameMode.SINGLE_PLAYER);
      expect(newState.highScore).toBe(1000);
      expect(newState.lives).toBe(3);
      expect(newState.score).toBe(0);
    });
  });

  describe('startGame', () => {
    it('changes status to RUNNING', () => {
      const state = { ...createInitialState(), status: GameStatus.IDLE };
      const newState = startGame(state);
      expect(newState.status).toBe(GameStatus.RUNNING);
    });

    it('works from MODE_SELECT status', () => {
      const state = createInitialState();
      const newState = startGame(state);
      expect(newState.status).toBe(GameStatus.RUNNING);
    });

    it('preserves other state properties', () => {
      const state = { ...createInitialState(2000), status: GameStatus.IDLE };
      const newState = startGame(state);
      expect(newState.highScore).toBe(2000);
      expect(newState.score).toBe(0);
    });
  });

  describe('pauseGame', () => {
    it('pauses a running game', () => {
      const state = { ...createInitialState(), status: GameStatus.RUNNING };
      const newState = pauseGame(state);
      expect(newState.status).toBe(GameStatus.PAUSED);
    });

    it('does nothing if game is not running', () => {
      const state = { ...createInitialState(), status: GameStatus.IDLE };
      const newState = pauseGame(state);
      expect(newState.status).toBe(GameStatus.IDLE);
    });

    it('does nothing if game is already paused', () => {
      const state = { ...createInitialState(), status: GameStatus.PAUSED };
      const newState = pauseGame(state);
      expect(newState.status).toBe(GameStatus.PAUSED);
    });

    it('does nothing during death animation', () => {
      const state = { ...createInitialState(), status: GameStatus.DYING };
      const newState = pauseGame(state);
      expect(newState.status).toBe(GameStatus.DYING);
    });

    it('does nothing on game over', () => {
      const state = { ...createInitialState(), status: GameStatus.GAME_OVER };
      const newState = pauseGame(state);
      expect(newState.status).toBe(GameStatus.GAME_OVER);
    });
  });

  describe('resumeGame', () => {
    it('resumes a paused game', () => {
      const state = { ...createInitialState(), status: GameStatus.PAUSED };
      const newState = resumeGame(state);
      expect(newState.status).toBe(GameStatus.RUNNING);
    });

    it('does nothing if game is not paused', () => {
      const state = { ...createInitialState(), status: GameStatus.RUNNING };
      const newState = resumeGame(state);
      expect(newState.status).toBe(GameStatus.RUNNING);
    });

    it('does nothing if game is idle', () => {
      const state = { ...createInitialState(), status: GameStatus.IDLE };
      const newState = resumeGame(state);
      expect(newState.status).toBe(GameStatus.IDLE);
    });

    it('does nothing if game is over', () => {
      const state = { ...createInitialState(), status: GameStatus.GAME_OVER };
      const newState = resumeGame(state);
      expect(newState.status).toBe(GameStatus.GAME_OVER);
    });
  });

  describe('resetGame', () => {
    it('resets to initial state', () => {
      const newState = resetGame();
      expect(newState.status).toBe(GameStatus.MODE_SELECT);
      expect(newState.score).toBe(0);
      expect(newState.lives).toBe(3);
    });

    it('preserves provided high score', () => {
      const newState = resetGame(10000);
      expect(newState.highScore).toBe(10000);
    });

    it('resets score to 0', () => {
      const newState = resetGame(5000);
      expect(newState.score).toBe(0);
    });

    it('resets gameMode to null', () => {
      const newState = resetGame();
      expect(newState.gameMode).toBeNull();
    });

    it('resets player position', () => {
      const newState = resetGame();
      expect(newState.player.x).toBe(TILE_SIZE * 2.5);
      expect(newState.player.y).toBe(TILE_SIZE * 4.5);
    });
  });

  describe('updatePlayerPosition', () => {
    it('updates player x and y coordinates', () => {
      const state = createInitialState();
      const newState = updatePlayerPosition(state, 100, 200);
      expect(newState.player.x).toBe(100);
      expect(newState.player.y).toBe(200);
    });

    it('updates player direction when provided', () => {
      const state = createInitialState();
      const newState = updatePlayerPosition(state, 100, 200, Direction.UP);
      expect(newState.player.direction).toBe(Direction.UP);
    });

    it('preserves direction when not provided', () => {
      const state = createInitialState();
      const originalDirection = state.player.direction;
      const newState = updatePlayerPosition(state, 100, 200);
      expect(newState.player.direction).toBe(originalDirection);
    });

    it('does not modify original state', () => {
      const state = createInitialState();
      const originalX = state.player.x;
      updatePlayerPosition(state, 100, 200);
      expect(state.player.x).toBe(originalX);
    });
  });

  describe('updatePlayer2Position', () => {
    it('updates player 2 x and y coordinates', () => {
      const state = createInitialState();
      const newState = updatePlayer2Position(state, 150, 250);
      expect(newState.player2.x).toBe(150);
      expect(newState.player2.y).toBe(250);
    });

    it('updates player 2 direction when provided', () => {
      const state = createInitialState();
      const newState = updatePlayer2Position(state, 150, 250, Direction.DOWN);
      expect(newState.player2.direction).toBe(Direction.DOWN);
    });

    it('preserves direction when not provided', () => {
      const state = createInitialState();
      const originalDirection = state.player2.direction;
      const newState = updatePlayer2Position(state, 150, 250);
      expect(newState.player2.direction).toBe(originalDirection);
    });

    it('does not modify player 1 position', () => {
      const state = createInitialState();
      const originalP1X = state.player.x;
      const newState = updatePlayer2Position(state, 150, 250);
      expect(newState.player.x).toBe(originalP1X);
    });
  });

  describe('updateDeathAnimation', () => {
    it('does nothing if status is not DYING', () => {
      const state = { ...createInitialState(), status: GameStatus.RUNNING };
      const newState = updateDeathAnimation(state, 100);
      expect(newState).toBe(state);
    });

    it('counts down death animation timer', () => {
      const state = {
        ...createInitialState(),
        status: GameStatus.DYING,
        deathAnimationTimer: 1000,
        lives: 2,
      };
      const newState = updateDeathAnimation(state, 100);
      expect(newState.deathAnimationTimer).toBe(900);
    });

    it('transitions to GAME_OVER when timer completes and no lives left', () => {
      const state = {
        ...createInitialState(),
        status: GameStatus.DYING,
        deathAnimationTimer: 50,
        lives: 0,
      };
      const newState = updateDeathAnimation(state, 100);
      expect(newState.status).toBe(GameStatus.GAME_OVER);
      expect(newState.deathAnimationTimer).toBe(0);
    });

    it('respawns player when timer completes and lives remain', () => {
      const state = {
        ...createInitialState(),
        status: GameStatus.DYING,
        deathAnimationTimer: 50,
        lives: 2,
        player: { x: 500, y: 500, direction: Direction.UP },
        ghostsVulnerable: true,
      };
      const newState = updateDeathAnimation(state, 100);
      expect(newState.status).toBe(GameStatus.RUNNING);
      expect(newState.player.x).toBe(TILE_SIZE * 2.5);
      expect(newState.player.y).toBe(TILE_SIZE * 4.5);
      expect(newState.player.direction).toBe(Direction.RIGHT);
      expect(newState.ghostsVulnerable).toBe(false);
    });

    it('does not go below 0 on timer', () => {
      const state = {
        ...createInitialState(),
        status: GameStatus.DYING,
        deathAnimationTimer: 50,
        lives: 1,
      };
      const newState = updateDeathAnimation(state, 200);
      expect(newState.deathAnimationTimer).toBe(0);
    });
  });

  describe('updateGameState', () => {
    let runningState;

    beforeEach(() => {
      runningState = {
        ...createInitialState(),
        status: GameStatus.RUNNING,
        gameMode: GameMode.SINGLE_PLAYER,
      };
    });

    it('does nothing if status is not RUNNING', () => {
      const state = { ...createInitialState(), status: GameStatus.PAUSED };
      const newState = updateGameState(state, 16);
      expect(newState).toBe(state);
    });

    it('increments elapsed time', () => {
      const newState = updateGameState(runningState, 16);
      expect(newState.elapsedTime).toBe(16);
    });

    it('increments frame count', () => {
      const newState = updateGameState(runningState, 16);
      expect(newState.frameCount).toBe(1);
    });

    it('accumulates elapsed time over multiple updates', () => {
      let state = runningState;
      state = updateGameState(state, 16);
      state = updateGameState(state, 16);
      state = updateGameState(state, 16);
      expect(state.elapsedTime).toBe(48);
      expect(state.frameCount).toBe(3);
    });

    it('updates ghosts', () => {
      const newState = updateGameState(runningState, 16);
      expect(newState.ghosts).toBeDefined();
    });

    it('tracks mode timer', () => {
      const newState = updateGameState(runningState, 16);
      expect(newState.modeTimer).toBeGreaterThan(runningState.modeTimer);
    });
  });

  describe('getGhostSpeedMultiplier', () => {
    it('returns 1.0 when ghosts are not vulnerable', () => {
      const state = { ...createInitialState(), ghostsVulnerable: false };
      expect(getGhostSpeedMultiplier(state)).toBe(1.0);
    });

    it('returns FRIGHTENED_SPEED_MULTIPLIER when ghosts are vulnerable', () => {
      const state = { ...createInitialState(), ghostsVulnerable: true };
      expect(getGhostSpeedMultiplier(state)).toBe(FRIGHTENED_SPEED_MULTIPLIER);
    });
  });

  describe('areGhostsFrightened', () => {
    it('returns true when ghosts are vulnerable', () => {
      const state = { ...createInitialState(), ghostsVulnerable: true };
      expect(areGhostsFrightened(state)).toBe(true);
    });

    it('returns false when ghosts are not vulnerable', () => {
      const state = { ...createInitialState(), ghostsVulnerable: false };
      expect(areGhostsFrightened(state)).toBe(false);
    });
  });

  describe('areGhostsFlashing', () => {
    it('returns false when ghosts are not vulnerable', () => {
      const state = {
        ...createInitialState(),
        ghostsVulnerable: false,
        vulnerabilityTimer: 1000,
      };
      expect(areGhostsFlashing(state)).toBe(false);
    });

    it('returns false when vulnerability timer is above flash time', () => {
      const state = {
        ...createInitialState(),
        ghostsVulnerable: true,
        vulnerabilityTimer: FRIGHTENED_FLASH_TIME + 1000,
      };
      expect(areGhostsFlashing(state)).toBe(false);
    });

    it('returns true when vulnerable and timer is at flash time', () => {
      const state = {
        ...createInitialState(),
        ghostsVulnerable: true,
        vulnerabilityTimer: FRIGHTENED_FLASH_TIME,
      };
      expect(areGhostsFlashing(state)).toBe(true);
    });

    it('returns true when vulnerable and timer is below flash time', () => {
      const state = {
        ...createInitialState(),
        ghostsVulnerable: true,
        vulnerabilityTimer: FRIGHTENED_FLASH_TIME - 500,
      };
      expect(areGhostsFlashing(state)).toBe(true);
    });
  });

  describe('eatGhost', () => {
    it('does nothing when ghosts are not vulnerable', () => {
      const state = {
        ...createInitialState(),
        ghostsVulnerable: false,
        score: 100,
      };
      const newState = eatGhost(state);
      expect(newState.score).toBe(100);
      expect(newState.ghostsEatenDuringFrightened).toBe(0);
    });

    it('adds first ghost points (200) when vulnerable', () => {
      const state = {
        ...createInitialState(),
        ghostsVulnerable: true,
        score: 100,
        ghostsEatenDuringFrightened: 0,
      };
      const newState = eatGhost(state);
      expect(newState.score).toBe(100 + GHOST_EAT_POINTS[0]);
      expect(newState.ghostsEatenDuringFrightened).toBe(1);
    });

    it('doubles points for successive ghosts', () => {
      let state = {
        ...createInitialState(),
        ghostsVulnerable: true,
        score: 0,
        ghostsEatenDuringFrightened: 0,
      };

      // Eat first ghost: 200
      state = eatGhost(state);
      expect(state.score).toBe(200);
      expect(state.ghostsEatenDuringFrightened).toBe(1);

      // Eat second ghost: 400
      state = eatGhost(state);
      expect(state.score).toBe(600);
      expect(state.ghostsEatenDuringFrightened).toBe(2);

      // Eat third ghost: 800
      state = eatGhost(state);
      expect(state.score).toBe(1400);
      expect(state.ghostsEatenDuringFrightened).toBe(3);

      // Eat fourth ghost: 1600
      state = eatGhost(state);
      expect(state.score).toBe(3000);
      expect(state.ghostsEatenDuringFrightened).toBe(4);
    });

    it('caps points at max value for more than 4 ghosts', () => {
      const state = {
        ...createInitialState(),
        ghostsVulnerable: true,
        score: 0,
        ghostsEatenDuringFrightened: 10,
      };
      const newState = eatGhost(state);
      // Should use last value in GHOST_EAT_POINTS (1600)
      expect(newState.score).toBe(GHOST_EAT_POINTS[GHOST_EAT_POINTS.length - 1]);
    });
  });

  describe('GameStatus constants', () => {
    it('has MODE_SELECT status', () => {
      expect(GameStatus.MODE_SELECT).toBe('mode_select');
    });

    it('has IDLE status', () => {
      expect(GameStatus.IDLE).toBe('idle');
    });

    it('has RUNNING status', () => {
      expect(GameStatus.RUNNING).toBe('running');
    });

    it('has PAUSED status', () => {
      expect(GameStatus.PAUSED).toBe('paused');
    });

    it('has DYING status', () => {
      expect(GameStatus.DYING).toBe('dying');
    });

    it('has GAME_OVER status', () => {
      expect(GameStatus.GAME_OVER).toBe('game_over');
    });

    it('has LEVEL_COMPLETE status', () => {
      expect(GameStatus.LEVEL_COMPLETE).toBe('level_complete');
    });

    it('has GAME_COMPLETE status', () => {
      expect(GameStatus.GAME_COMPLETE).toBe('game_complete');
    });
  });

  describe('GameMode constants', () => {
    it('has SINGLE_PLAYER mode', () => {
      expect(GameMode.SINGLE_PLAYER).toBe('1P');
    });

    it('has TWO_PLAYER mode', () => {
      expect(GameMode.TWO_PLAYER).toBe('2P');
    });
  });

  describe('Constants', () => {
    it('has DEATH_ANIMATION_DURATION set to 1500ms', () => {
      expect(DEATH_ANIMATION_DURATION).toBe(1500);
    });

    it('has FRIGHTENED_FLASH_TIME set to 2000ms', () => {
      expect(FRIGHTENED_FLASH_TIME).toBe(2000);
    });

    it('has FRIGHTENED_SPEED_MULTIPLIER set to 0.5', () => {
      expect(FRIGHTENED_SPEED_MULTIPLIER).toBe(0.5);
    });

    it('has correct GHOST_EAT_POINTS sequence', () => {
      expect(GHOST_EAT_POINTS).toEqual([200, 400, 800, 1600]);
    });

    it('has MAX_LEVEL set to 5', () => {
      expect(MAX_LEVEL).toBe(5);
    });
  });

  describe('nextLevel', () => {
    it('increments level by 1', () => {
      const state = { ...createInitialState(), level: 1, status: GameStatus.LEVEL_COMPLETE };
      const newState = nextLevel(state);
      expect(newState.level).toBe(2);
    });

    it('sets status to IDLE', () => {
      const state = { ...createInitialState(), level: 1, status: GameStatus.LEVEL_COMPLETE };
      const newState = nextLevel(state);
      expect(newState.status).toBe(GameStatus.IDLE);
    });

    it('preserves score', () => {
      const state = { ...createInitialState(), level: 1, score: 5000 };
      const newState = nextLevel(state);
      expect(newState.score).toBe(5000);
    });

    it('preserves lives', () => {
      const state = { ...createInitialState(), level: 1, lives: 2 };
      const newState = nextLevel(state);
      expect(newState.lives).toBe(2);
    });

    it('preserves highScore', () => {
      const state = { ...createInitialState(10000), level: 1, highScore: 10000 };
      const newState = nextLevel(state);
      expect(newState.highScore).toBe(10000);
    });

    it('preserves gameMode', () => {
      const state = { ...createInitialState(), level: 1, gameMode: GameMode.TWO_PLAYER };
      const newState = nextLevel(state);
      expect(newState.gameMode).toBe(GameMode.TWO_PLAYER);
    });

    it('preserves player2Score', () => {
      const state = { ...createInitialState(), level: 1, player2Score: 3000 };
      const newState = nextLevel(state);
      expect(newState.player2Score).toBe(3000);
    });

    it('preserves player2Lives', () => {
      const state = { ...createInitialState(), level: 1, player2Lives: 1 };
      const newState = nextLevel(state);
      expect(newState.player2Lives).toBe(1);
    });

    it('resets player 1 position', () => {
      const state = {
        ...createInitialState(),
        level: 1,
        player: { x: 500, y: 500, direction: Direction.UP },
      };
      const newState = nextLevel(state);
      expect(newState.player.x).toBe(TILE_SIZE * 2.5);
      expect(newState.player.y).toBe(TILE_SIZE * 4.5);
      expect(newState.player.direction).toBe(Direction.RIGHT);
    });

    it('resets player 2 position', () => {
      const state = {
        ...createInitialState(),
        level: 1,
        player2: { x: 100, y: 100, direction: Direction.DOWN },
      };
      const newState = nextLevel(state);
      // P2 resets to safe spawn position (2.5, 10.5) - away from ghost house
      expect(newState.player2.x).toBe(TILE_SIZE * 2.5);
      expect(newState.player2.y).toBe(TILE_SIZE * 10.5);
      expect(newState.player2.direction).toBe(Direction.LEFT);
    });

    it('resets ghosts', () => {
      const state = createInitialState();
      // Modify ghost positions
      state.ghosts.blinky.x = 999;
      const newState = nextLevel(state);
      expect(newState.ghosts.blinky.x).not.toBe(999);
      expect(newState.ghosts).toBeDefined();
      expect(newState.ghosts.blinky).toBeDefined();
      expect(newState.ghosts.pinky).toBeDefined();
      expect(newState.ghosts.inky).toBeDefined();
      expect(newState.ghosts.clyde).toBeDefined();
    });

    it('resets maze and dots', () => {
      const state = createInitialState();
      const newState = nextLevel(state);
      expect(newState.maze).toBeDefined();
      expect(newState.dots).toBeDefined();
    });

    it('resets ghost vulnerability state', () => {
      const state = {
        ...createInitialState(),
        level: 1,
        ghostsVulnerable: true,
        vulnerabilityTimer: 5000,
        ghostsEatenDuringFrightened: 3,
      };
      const newState = nextLevel(state);
      expect(newState.ghostsVulnerable).toBe(false);
      expect(newState.vulnerabilityTimer).toBe(0);
      expect(newState.ghostsEatenDuringFrightened).toBe(0);
    });

    it('resets ghost respawn timers', () => {
      const state = {
        ...createInitialState(),
        level: 1,
        ghostRespawnTimers: { blinky: 1000, pinky: 2000 },
      };
      const newState = nextLevel(state);
      expect(newState.ghostRespawnTimers).toEqual({});
    });

    it('resets fruit state', () => {
      const state = createInitialState();
      state.fruit.active = true;
      state.fruit.spawnCount = 2;
      const newState = nextLevel(state);
      expect(newState.fruit).toBeDefined();
      expect(newState.fruit.active).toBe(false);
    });

    it('resets elapsedTime and frameCount', () => {
      const state = {
        ...createInitialState(),
        level: 1,
        elapsedTime: 60000,
        frameCount: 3600,
      };
      const newState = nextLevel(state);
      expect(newState.elapsedTime).toBe(0);
      expect(newState.frameCount).toBe(0);
    });

    it('sets status to GAME_COMPLETE when exceeding MAX_LEVEL', () => {
      const state = { ...createInitialState(), level: MAX_LEVEL };
      const newState = nextLevel(state);
      expect(newState.status).toBe(GameStatus.GAME_COMPLETE);
    });

    it('does not increment level when at MAX_LEVEL', () => {
      const state = { ...createInitialState(), level: MAX_LEVEL };
      const newState = nextLevel(state);
      expect(newState.level).toBe(MAX_LEVEL);
    });

    it('preserves score when game is complete', () => {
      const state = { ...createInitialState(), level: MAX_LEVEL, score: 99999 };
      const newState = nextLevel(state);
      expect(newState.score).toBe(99999);
    });

    it('can progress through all levels', () => {
      let state = createInitialState();
      for (let i = 1; i < MAX_LEVEL; i++) {
        state = { ...state, level: i };
        state = nextLevel(state);
        expect(state.level).toBe(i + 1);
        expect(state.status).toBe(GameStatus.IDLE);
      }
      // Final level
      state = nextLevel(state);
      expect(state.status).toBe(GameStatus.GAME_COMPLETE);
    });
  });
});
