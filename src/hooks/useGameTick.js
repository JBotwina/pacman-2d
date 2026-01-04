/**
 * Hook that connects the game loop with the Zustand store.
 * Handles the main game tick and player movement integration.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useGameLoop } from './useGameLoop';
import { usePlayerMovement } from './usePlayerMovement';
import { useGameStore, GameStatus, GameMode } from '../store';
import { Direction } from '../game/GameState';

// Player movement speed in tiles per second
const PLAYER_SPEED = 4;

/**
 * Converts string direction to Direction object for ghost AI.
 */
function toDirectionObject(dirString, currentDirection) {
  switch (dirString) {
    case 'up': return Direction.UP;
    case 'down': return Direction.DOWN;
    case 'left': return Direction.LEFT;
    case 'right': return Direction.RIGHT;
    default: return currentDirection;
  }
}

/**
 * Custom hook that manages the game loop and integrates with the Zustand store.
 *
 * @param {object} options
 * @param {function} options.getPlayer1Input - Returns current P1 input direction or null
 * @param {function} options.getPlayer2Input - Returns current P2 input direction or null
 * @returns {object} Game tick controller with player directions for rendering
 */
export function useGameTick({ getPlayer1Input, getPlayer2Input } = {}) {
  // Get store state and actions
  const status = useGameStore((state) => state.status);
  const gameMode = useGameStore((state) => state.gameMode);
  const maze = useGameStore((state) => state.maze);
  const player = useGameStore((state) => state.player);
  const player2 = useGameStore((state) => state.player2);
  const tick = useGameStore((state) => state.tick);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const updatePlayer2Position = useGameStore((state) => state.updatePlayer2Position);

  // Player movement hooks
  const player1Movement = usePlayerMovement({ speed: PLAYER_SPEED });
  const player2Movement = usePlayerMovement({ speed: PLAYER_SPEED });

  // Track player directions for rendering
  const player1DirectionRef = useRef('right');
  const player2DirectionRef = useRef('left');

  // Initialize player positions when they change (e.g., after respawn)
  const prevPlayerRef = useRef(null);
  const prevPlayer2Ref = useRef(null);

  useEffect(() => {
    // Sync player 1 position from store to movement hook when it changes externally
    // (e.g., on game start, respawn, or reset)
    if (prevPlayerRef.current === null ||
        (prevPlayerRef.current.x !== player.x || prevPlayerRef.current.y !== player.y)) {
      // Only sync if we're not currently running (to avoid fighting with movement updates)
      if (status !== GameStatus.RUNNING) {
        player1Movement.setPosition(player.x, player.y);
        if (player.direction) {
          const dirStr = directionToString(player.direction);
          player1Movement.setDirection(dirStr);
          player1DirectionRef.current = dirStr;
        }
      }
    }
    prevPlayerRef.current = player;
  }, [player, status, player1Movement]);

  useEffect(() => {
    // Sync player 2 position from store to movement hook when it changes externally
    if (prevPlayer2Ref.current === null ||
        (prevPlayer2Ref.current.x !== player2.x || prevPlayer2Ref.current.y !== player2.y)) {
      if (status !== GameStatus.RUNNING) {
        player2Movement.setPosition(player2.x, player2.y);
        if (player2.direction) {
          const dirStr = directionToString(player2.direction);
          player2Movement.setDirection(dirStr);
          player2DirectionRef.current = dirStr;
        }
      }
    }
    prevPlayer2Ref.current = player2;
  }, [player2, status, player2Movement]);

  // Main update callback for the game loop
  const handleUpdate = useCallback((deltaTime) => {
    // During death animation, just tick the store (it handles the animation)
    if (status === GameStatus.DYING) {
      tick(deltaTime);
      return;
    }

    // Only update during RUNNING state
    if (status !== GameStatus.RUNNING) {
      return;
    }

    // Get player 1 input and update movement
    const p1Input = getPlayer1Input ? getPlayer1Input() : null;
    const p1State = player1Movement.update(maze, deltaTime, p1Input);
    player1DirectionRef.current = p1State.direction;

    // Update player 1 position in store
    const p1Direction = toDirectionObject(p1State.direction, player.direction);
    updatePlayerPosition(p1State.x, p1State.y, p1Direction);

    // Handle player 2 in two-player mode
    if (gameMode === GameMode.TWO_PLAYER) {
      const p2Input = getPlayer2Input ? getPlayer2Input() : null;
      const p2State = player2Movement.update(maze, deltaTime, p2Input);
      player2DirectionRef.current = p2State.direction;

      // Update player 2 position in store
      const p2Direction = toDirectionObject(p2State.direction, player2.direction);
      updatePlayer2Position(p2State.x, p2State.y, p2Direction);
    }

    // Run the main game tick (collision detection, ghost AI, etc.)
    tick(deltaTime);
  }, [
    status,
    gameMode,
    maze,
    player.direction,
    player2.direction,
    tick,
    updatePlayerPosition,
    updatePlayer2Position,
    player1Movement,
    player2Movement,
    getPlayer1Input,
    getPlayer2Input,
  ]);

  // Determine if the game loop should be running
  const isLoopRunning = status === GameStatus.RUNNING || status === GameStatus.DYING;

  // Run the game loop
  useGameLoop(handleUpdate, isLoopRunning);

  // Sync movement hooks when player respawns (status changes from DYING to RUNNING)
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current === GameStatus.DYING && status === GameStatus.RUNNING) {
      // Player respawned - sync movement hook to new position
      player1Movement.setPosition(player.x, player.y);
      player1Movement.setDirection('right');
      player1DirectionRef.current = 'right';
    }
    prevStatusRef.current = status;
  }, [status, player, player1Movement]);

  return {
    // Expose movement controllers for manual position resets
    player1Movement,
    player2Movement,
    // Expose direction getters for real-time access (call these in render)
    getPlayer1Direction: () => player1DirectionRef.current,
    getPlayer2Direction: () => player2DirectionRef.current,
  };
}

/**
 * Converts Direction object to string for movement hook.
 */
function directionToString(direction) {
  if (!direction) return 'right';
  if (direction.dx === 1) return 'right';
  if (direction.dx === -1) return 'left';
  if (direction.dy === -1) return 'up';
  if (direction.dy === 1) return 'down';
  return 'right';
}

export default useGameTick;
