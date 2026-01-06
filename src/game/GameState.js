/**
 * Game state management for Pacman 2D.
 * Handles game state updates, pause/resume, and state transitions.
 */

import {
  createDefaultMaze,
  createDotsFromMaze,
  collectDotsAtPosition,
  allDotsCollected,
  TILE_SIZE,
} from './Dots.js';
import {
  createAllGhosts,
  updateAllGhosts,
  setGhostMode,
  endFrightenedMode,
  markGhostEaten,
  checkGhostCollision,
  GhostMode,
  Direction,
  GHOST_START_POSITIONS,
  MODE_TIMINGS,
} from './GhostAI.js';
import {
  createInitialFruitState,
  shouldSpawnFruit,
  spawnFruit,
  updateFruitTimer,
  checkFruitCollision,
  collectFruit,
} from './Fruit.js';
import {
  createInitialRandomFruitState,
  updateRandomFruits,
} from './RandomFruit.js';
import {
  Difficulty,
  getDifficultySettings,
  getModeTimings,
} from './DifficultyConfig.js';

export const GameStatus = {
  MODE_SELECT: 'mode_select',
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  DYING: 'dying',
  GAME_OVER: 'game_over',
  LEVEL_COMPLETE: 'level_complete',
  GAME_COMPLETE: 'game_complete',
};

// Maximum level before game completion
export const MAX_LEVEL = 5;

// Death animation duration in milliseconds
export const DEATH_ANIMATION_DURATION = 1500;

export const GameMode = {
  SINGLE_PLAYER: '1P',
  TWO_PLAYER: '2P',
};

// Frightened mode constants
export const FRIGHTENED_DURATION = 7000; // 7 seconds of frightened mode
export const FRIGHTENED_FLASH_TIME = 2000; // Flash for last 2 seconds
export const FRIGHTENED_SPEED_MULTIPLIER = 0.5; // Ghosts move at half speed when frightened
export const VULNERABILITY_DURATION = 7000; // 7 seconds vulnerability

// Ghost configuration
export const GHOST_NAMES = ['blinky', 'pinky', 'inky', 'clyde'];
export const GHOST_SIZE = 18; // Ghost hitbox size

// Ghost respawn delay after being eaten (in ms)
export const GHOST_RESPAWN_DELAY = 5000;

/**
 * Ghost point values for eating during frightened mode.
 * Points double for each successive ghost eaten: 200, 400, 800, 1600
 */
export const GHOST_EAT_POINTS = [200, 400, 800, 1600];

export function createInitialState(highScore = 0, difficulty = Difficulty.MEDIUM) {
  const maze = createDefaultMaze();
  const dotsState = createDotsFromMaze(maze);

  return {
    status: GameStatus.MODE_SELECT,
    gameMode: null, // Will be set when player selects 1P or 2P
    difficulty, // Difficulty setting (easy, medium, hard)
    // Player 1 stats
    score: 0,
    highScore,
    lives: 3,
    // Player 2 stats
    player2Score: 0,
    player2Lives: 3,
    // Shared game state
    level: 1,
    elapsedTime: 0,
    frameCount: 0,
    maze,
    dots: dotsState,
    // Player 1 starts at tile (2, 4) - avoids power pellet at (1,1)
    player: {
      x: TILE_SIZE * 2.5,
      y: TILE_SIZE * 4.5,
      direction: Direction.RIGHT,
    },
    // Player 2 starts at bottom-right area
    player2: {
      x: TILE_SIZE * 8.5,
      y: TILE_SIZE * 5.5,
      direction: Direction.LEFT,
    },
    // Ghosts with AI behaviors
    ghosts: createAllGhosts(difficulty),
    // Ghost mode management (scatter/chase switching)
    globalMode: GhostMode.SCATTER,
    modeTimer: 0,
    // Ghost frightened/vulnerable state
    ghostsVulnerable: false,
    vulnerabilityTimer: 0,
    ghostsEatenDuringFrightened: 0,
    // Ghost respawn timers (keyed by ghost type)
    ghostRespawnTimers: {},
    // Bonus fruit state (fixed position based on dots collected)
    fruit: createInitialFruitState(),
    // Random fruit state (random spawning bonus items)
    randomFruits: createInitialRandomFruitState(),
    // Death animation state
    deathAnimationTimer: 0,
  };
}

/**
 * Updates death animation state.
 * Called when status is DYING to animate and then respawn or game over.
 *
 * @param {object} state - Current game state
 * @param {number} deltaTime - Time since last frame in milliseconds
 * @returns {object} - Updated game state
 */
export function updateDeathAnimation(state, deltaTime) {
  if (state.status !== GameStatus.DYING) {
    return state;
  }

  const newTimer = Math.max(0, state.deathAnimationTimer - deltaTime);

  if (newTimer <= 0) {
    // Death animation complete
    if (state.lives <= 0) {
      // Game over
      return {
        ...state,
        status: GameStatus.GAME_OVER,
        deathAnimationTimer: 0,
      };
    } else {
      // Respawn player at tile (2, 4) - avoids power pellet at (1,1)
      // Ghosts keep their positions (no reset) for more challenge
      return {
        ...state,
        status: GameStatus.RUNNING,
        deathAnimationTimer: 0,
        player: {
          x: TILE_SIZE * 2.5,
          y: TILE_SIZE * 4.5,
          direction: Direction.RIGHT,
        },
        // Keep ghosts in their current positions - don't reset them
        ghostsVulnerable: false,
        vulnerabilityTimer: 0,
      };
    }
  }

  return {
    ...state,
    deathAnimationTimer: newTimer,
  };
}

/**
 * Updates game state based on delta time.
 * This is the main update function called by the game loop.
 *
 * @param {object} state - Current game state
 * @param {number} deltaTime - Time since last frame in milliseconds
 * @returns {object} - Updated game state
 */
export function updateGameState(state, deltaTime) {
  if (state.status !== GameStatus.RUNNING) {
    return state;
  }

  // Check for dot collection at player 1 position
  const { newDotsState: p1DotsState, totalPoints: p1Points, powerPelletCollected: p1PowerPellet } = collectDotsAtPosition(
    state.dots,
    state.player.x,
    state.player.y
  );

  // Check for dot collection at player 2 position (in 2P mode)
  let newDotsState = p1DotsState;
  let p2Points = 0;
  let p2PowerPellet = false;
  if (state.gameMode === GameMode.TWO_PLAYER) {
    const p2Collection = collectDotsAtPosition(
      p1DotsState,
      state.player2.x,
      state.player2.y
    );
    newDotsState = p2Collection.newDotsState;
    p2Points = p2Collection.totalPoints;
    p2PowerPellet = p2Collection.powerPelletCollected;
  }

  let newScore = state.score + p1Points;
  let newPlayer2Score = state.player2Score + p2Points;
  const powerPelletCollected = p1PowerPellet || p2PowerPellet;
  const newStatus = allDotsCollected(newDotsState)
    ? GameStatus.LEVEL_COMPLETE
    : state.status;

  // Handle ghost vulnerability
  let ghostsVulnerable = state.ghostsVulnerable;
  let vulnerabilityTimer = state.vulnerabilityTimer;
  let ghostsEatenDuringFrightened = state.ghostsEatenDuringFrightened;
  let updatedGhosts = state.ghosts;
  let ghostRespawnTimers = { ...state.ghostRespawnTimers };
  let globalMode = state.globalMode;
  let modeTimer = state.modeTimer + deltaTime;

  if (powerPelletCollected) {
    // Start or reset vulnerability timer
    ghostsVulnerable = true;
    vulnerabilityTimer = VULNERABILITY_DURATION;
    ghostsEatenDuringFrightened = 0;
    // Set all ghosts to frightened mode with reverse (skips EATEN ghosts)
    updatedGhosts = setGhostMode(state.ghosts, GhostMode.FRIGHTENED, true);
  } else if (ghostsVulnerable) {
    // Count down vulnerability timer
    vulnerabilityTimer = Math.max(0, vulnerabilityTimer - deltaTime);
    if (vulnerabilityTimer <= 0) {
      ghostsVulnerable = false;
      ghostsEatenDuringFrightened = 0;
      // Return ghosts to their previous mode (skips EATEN ghosts)
      updatedGhosts = endFrightenedMode(updatedGhosts);
    }
  }

  // Handle scatter/chase mode switching (only when not frightened)
  if (!ghostsVulnerable) {
    // Get mode timings based on difficulty
    const difficultyModeTimings = getModeTimings(state.difficulty);
    const currentModeTime = globalMode === GhostMode.SCATTER
      ? difficultyModeTimings.scatter
      : difficultyModeTimings.chase;

    if (modeTimer >= currentModeTime) {
      // Switch modes
      modeTimer = 0;
      globalMode = globalMode === GhostMode.SCATTER
        ? GhostMode.CHASE
        : GhostMode.SCATTER;
      // Update all active ghosts to new mode with direction reverse
      updatedGhosts = setGhostMode(updatedGhosts, globalMode, true);
    }
  }

  // Handle ghost respawn timers
  for (const ghostType of Object.keys(ghostRespawnTimers)) {
    if (ghostRespawnTimers[ghostType] > 0) {
      ghostRespawnTimers[ghostType] = Math.max(0, ghostRespawnTimers[ghostType] - deltaTime);

      // Respawn ghost when timer reaches 0
      if (ghostRespawnTimers[ghostType] <= 0) {
        const ghost = updatedGhosts[ghostType];
        if (ghost && ghost.mode === GhostMode.EATEN) {
          // Respawn at starting position
          const startPos = GHOST_START_POSITIONS[ghostType];
          updatedGhosts = {
            ...updatedGhosts,
            [ghostType]: {
              ...ghost,
              x: startPos.x,
              y: startPos.y,
              mode: ghostsVulnerable ? GhostMode.FRIGHTENED : GhostMode.CHASE,
            },
          };
        }
        delete ghostRespawnTimers[ghostType];
      }
    }
  }

  // Pass FRIGHTENED as release mode when ghosts are vulnerable,
  // so ghosts released from house enter frightened mode
  const releaseMode = ghostsVulnerable ? GhostMode.FRIGHTENED : globalMode;

  // Get player 2 info for 2-player mode (ghosts will target nearest player)
  const player2Pos = state.gameMode === GameMode.TWO_PLAYER ? state.player2 : null;
  const player2Dir = state.gameMode === GameMode.TWO_PLAYER ? state.player2.direction : null;

  // Update all ghosts including eaten ones (so their eyes return to pen)
  updatedGhosts = updateAllGhosts(
    updatedGhosts,
    state.maze,
    state.player,
    state.player.direction,
    player2Pos,
    player2Dir,
    deltaTime,
    releaseMode
  );

  // Check player-ghost collision
  let lives = state.lives;
  let player2Lives = state.player2Lives;
  let finalScore = newScore;
  let finalPlayer2Score = newPlayer2Score;
  let finalStatus = newStatus;
  let player = state.player;
  let deathAnimationTimer = state.deathAnimationTimer;

  // Check Player 1 collision with ghosts
  const collision = checkGhostCollision(updatedGhosts, state.player.x, state.player.y);

  if (collision.collision) {
    if (collision.canEat) {
      // Player 1 eats frightened ghost
      updatedGhosts = markGhostEaten(updatedGhosts, collision.ghostType);
      const pointIndex = Math.min(ghostsEatenDuringFrightened, GHOST_EAT_POINTS.length - 1);
      finalScore += GHOST_EAT_POINTS[pointIndex];
      ghostsEatenDuringFrightened += 1;
      // Start respawn timer for eaten ghost
      ghostRespawnTimers[collision.ghostType] = GHOST_RESPAWN_DELAY;
    } else {
      // Ghost catches player 1 - start death animation
      lives -= 1;
      finalStatus = GameStatus.DYING;
      deathAnimationTimer = DEATH_ANIMATION_DURATION;
    }
  }

  // Check Player 2 collision with ghosts (in 2P mode)
  if (state.gameMode === GameMode.TWO_PLAYER && finalStatus !== GameStatus.DYING) {
    const collision2 = checkGhostCollision(updatedGhosts, state.player2.x, state.player2.y);

    if (collision2.collision) {
      if (collision2.canEat) {
        // Player 2 eats frightened ghost
        updatedGhosts = markGhostEaten(updatedGhosts, collision2.ghostType);
        const pointIndex = Math.min(ghostsEatenDuringFrightened, GHOST_EAT_POINTS.length - 1);
        finalPlayer2Score += GHOST_EAT_POINTS[pointIndex];
        ghostsEatenDuringFrightened += 1;
        // Start respawn timer for eaten ghost
        ghostRespawnTimers[collision2.ghostType] = GHOST_RESPAWN_DELAY;
      } else {
        // Ghost catches player 2 - lose a life
        player2Lives -= 1;
        // In 2P mode, game continues if either player has lives
        if (lives <= 0 && player2Lives <= 0) {
          finalStatus = GameStatus.GAME_OVER;
        }
        // TODO: Could add player 2 death animation/respawn logic
      }
    }
  }

  // Handle bonus fruit
  let newFruitState = updateFruitTimer(state.fruit, deltaTime);
  let fruitPoints = 0;
  let fruitPointsP2 = 0;

  // Check if fruit should spawn based on dots collected
  if (!newFruitState.active && shouldSpawnFruit(newDotsState.collectedDots, newFruitState.spawnCount)) {
    newFruitState = spawnFruit(newFruitState, state.level);
  }

  // Check for fruit collection - Player 1
  if (newFruitState.active && checkFruitCollision(player.x, player.y, newFruitState)) {
    const { newFruitState: collectedState, points } = collectFruit(newFruitState);
    newFruitState = collectedState;
    fruitPoints = points;
  }

  // Check for fruit collection - Player 2 (in 2P mode)
  if (state.gameMode === GameMode.TWO_PLAYER && newFruitState.active && checkFruitCollision(state.player2.x, state.player2.y, newFruitState)) {
    const { newFruitState: collectedState, points } = collectFruit(newFruitState);
    newFruitState = collectedState;
    fruitPointsP2 = points;
  }

  // Handle random fruit spawning and collection
  const player2PosForFruit = state.gameMode === GameMode.TWO_PLAYER ? state.player2 : null;
  const { newState: newRandomFruitState, collectedPoints: randomFruitPoints } = updateRandomFruits(
    state.randomFruits,
    deltaTime,
    state.maze,
    newDotsState,
    state.player,
    player2PosForFruit,
    state.level
  );

  const finalScoreWithFruit = finalScore + fruitPoints + randomFruitPoints;
  const finalPlayer2ScoreWithFruit = finalPlayer2Score + fruitPointsP2;
  const newHighScore = Math.max(state.highScore, finalScoreWithFruit, finalPlayer2ScoreWithFruit);

  return {
    ...state,
    elapsedTime: state.elapsedTime + deltaTime,
    frameCount: state.frameCount + 1,
    dots: newDotsState,
    score: finalScoreWithFruit,
    highScore: newHighScore,
    player2Score: finalPlayer2ScoreWithFruit,
    status: finalStatus,
    lives,
    player2Lives,
    player,
    ghosts: updatedGhosts,
    globalMode,
    modeTimer,
    ghostsVulnerable,
    vulnerabilityTimer,
    ghostsEatenDuringFrightened,
    ghostRespawnTimers,
    fruit: newFruitState,
    randomFruits: newRandomFruitState,
    deathAnimationTimer,
  };
}

/**
 * Updates player 1 position and direction.
 * @param {object} state - Current game state
 * @param {number} x - New X position
 * @param {number} y - New Y position
 * @param {object} direction - Movement direction (optional)
 * @returns {object} - Updated game state
 */
export function updatePlayerPosition(state, x, y, direction = null) {
  return {
    ...state,
    player: {
      x,
      y,
      direction: direction || state.player.direction,
    },
  };
}

/**
 * Updates player 2 position and direction.
 * @param {object} state - Current game state
 * @param {number} x - New X position
 * @param {number} y - New Y position
 * @param {object} direction - Movement direction (optional)
 * @returns {object} - Updated game state
 */
export function updatePlayer2Position(state, x, y, direction = null) {
  return {
    ...state,
    player2: {
      x,
      y,
      direction: direction || state.player2.direction,
    },
  };
}

/**
 * Sets the game mode (1P or 2P) and transitions to IDLE (ready to start).
 */
export function setGameMode(state, mode) {
  return {
    ...state,
    gameMode: mode,
    status: GameStatus.IDLE,
  };
}

/**
 * Starts or resumes the game.
 */
export function startGame(state) {
  return {
    ...state,
    status: GameStatus.RUNNING,
  };
}

/**
 * Pauses the game.
 */
export function pauseGame(state) {
  if (state.status !== GameStatus.RUNNING) {
    return state;
  }
  return {
    ...state,
    status: GameStatus.PAUSED,
  };
}

/**
 * Resumes a paused game.
 */
export function resumeGame(state) {
  if (state.status !== GameStatus.PAUSED) {
    return state;
  }
  return {
    ...state,
    status: GameStatus.RUNNING,
  };
}

/**
 * Resets the game to initial state, preserving high score and difficulty.
 * @param {number} highScore - High score to preserve
 * @param {string} difficulty - Difficulty level to preserve
 */
export function resetGame(highScore = 0, difficulty = Difficulty.MEDIUM) {
  return createInitialState(highScore, difficulty);
}

/**
 * Sets the difficulty level.
 * @param {object} state - Current game state
 * @param {string} difficulty - New difficulty level
 * @returns {object} - Updated game state
 */
export function setDifficulty(state, difficulty) {
  return {
    ...state,
    difficulty,
    // Recreate ghosts with new difficulty settings
    ghosts: createAllGhosts(difficulty),
  };
}

/**
 * Advances to the next level.
 * Resets maze/dots/ghosts/fruit while preserving score/lives/highScore/gameMode/difficulty.
 * If already at MAX_LEVEL, sets status to GAME_COMPLETE instead.
 *
 * @param {object} state - Current game state
 * @returns {object} - Updated game state for next level
 */
export function nextLevel(state) {
  const newLevel = state.level + 1;

  // Check if game is complete
  if (newLevel > MAX_LEVEL) {
    return {
      ...state,
      status: GameStatus.GAME_COMPLETE,
    };
  }

  // Create fresh maze and dots
  const maze = createDefaultMaze();
  const dotsState = createDotsFromMaze(maze);

  return {
    ...state,
    status: GameStatus.IDLE,
    level: newLevel,
    elapsedTime: 0,
    frameCount: 0,
    maze,
    dots: dotsState,
    // Reset player positions
    player: {
      x: TILE_SIZE * 2.5,
      y: TILE_SIZE * 4.5,
      direction: Direction.RIGHT,
    },
    player2: {
      x: TILE_SIZE * 8.5,
      y: TILE_SIZE * 5.5,
      direction: Direction.LEFT,
    },
    // Reset ghosts with current difficulty
    ghosts: createAllGhosts(state.difficulty),
    globalMode: GhostMode.SCATTER,
    modeTimer: 0,
    ghostsVulnerable: false,
    vulnerabilityTimer: 0,
    ghostsEatenDuringFrightened: 0,
    ghostRespawnTimers: {},
    // Reset fruit
    fruit: createInitialFruitState(),
    deathAnimationTimer: 0,
    // Preserved: score, lives, highScore, gameMode, player2Score, player2Lives, difficulty
  };
}

/**
 * Gets the current ghost speed multiplier based on frightened state.
 * @param {object} state - Current game state
 * @returns {number} Speed multiplier (1.0 for normal, 0.5 for frightened)
 */
export function getGhostSpeedMultiplier(state) {
  return state.ghostsVulnerable ? FRIGHTENED_SPEED_MULTIPLIER : 1.0;
}

/**
 * Checks if ghosts are currently frightened.
 * @param {object} state - Current game state
 * @returns {boolean} True if ghosts are frightened
 */
export function areGhostsFrightened(state) {
  return state.ghostsVulnerable;
}

/**
 * Checks if ghosts are in the flashing warning state.
 * @param {object} state - Current game state
 * @returns {boolean} True if ghosts are flashing (last 2 seconds of vulnerability)
 */
export function areGhostsFlashing(state) {
  return state.ghostsVulnerable && state.vulnerabilityTimer <= FRIGHTENED_FLASH_TIME;
}

/**
 * Handles eating a ghost during frightened mode.
 * @param {object} state - Current game state
 * @returns {object} Updated game state with points added
 */
export function eatGhost(state) {
  if (!state.ghostsVulnerable) {
    return state;
  }

  const ghostIndex = Math.min(state.ghostsEatenDuringFrightened, GHOST_EAT_POINTS.length - 1);
  const points = GHOST_EAT_POINTS[ghostIndex];

  return {
    ...state,
    score: state.score + points,
    ghostsEatenDuringFrightened: state.ghostsEatenDuringFrightened + 1,
  };
}

// Re-export TILE_SIZE, Direction, GhostMode, and Difficulty for components
export { TILE_SIZE, Direction, GhostMode, Difficulty };
