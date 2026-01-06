/**
 * Difficulty configuration for Pacman 2D.
 * Defines Easy/Medium/Hard presets affecting ghost speed and AI aggressiveness.
 */

export const Difficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

/**
 * Difficulty presets affecting various game parameters.
 *
 * Parameters controlled:
 * - ghostSpeed: Base ghost movement speed (pixels per ms)
 * - frightenedSpeed: Ghost speed when frightened
 * - releaseDelayMultiplier: Multiplier for ghost release delays (higher = slower release)
 * - scatterDuration: Time ghosts spend in scatter mode (ms)
 * - chaseDuration: Time ghosts spend in chase mode (ms)
 * - clydeShyDistance: Distance at which Clyde retreats (tiles, lower = more aggressive)
 */
export const DIFFICULTY_PRESETS = {
  [Difficulty.EASY]: {
    label: 'Easy',
    description: 'Slower ghosts, longer scatter periods',
    ghostSpeed: 0.12,
    frightenedSpeed: 0.05,
    eatenSpeed: 0.24,
    releaseDelayMultiplier: 1.5,
    scatterDuration: 3000,
    chaseDuration: 30000,
    clydeShyDistance: 8,
  },
  [Difficulty.MEDIUM]: {
    label: 'Medium',
    description: 'Balanced challenge',
    ghostSpeed: 0.16,
    frightenedSpeed: 0.07,
    eatenSpeed: 0.28,
    releaseDelayMultiplier: 1.0,
    scatterDuration: 1500,
    chaseDuration: 45000,
    clydeShyDistance: 4,
  },
  [Difficulty.HARD]: {
    label: 'Hard',
    description: 'Fast ghosts, relentless pursuit',
    ghostSpeed: 0.20,
    frightenedSpeed: 0.09,
    eatenSpeed: 0.32,
    releaseDelayMultiplier: 0.7,
    scatterDuration: 1000,
    chaseDuration: 60000,
    clydeShyDistance: 3,
  },
};

/**
 * Gets the difficulty settings for a given difficulty level.
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {object} Difficulty settings
 */
export function getDifficultySettings(difficulty) {
  return DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS[Difficulty.MEDIUM];
}

/**
 * Gets ghost speed for the current difficulty.
 * @param {string} difficulty - Difficulty level
 * @returns {number} Ghost speed in pixels per ms
 */
export function getGhostSpeed(difficulty) {
  const settings = getDifficultySettings(difficulty);
  return settings.ghostSpeed;
}

/**
 * Gets frightened ghost speed for the current difficulty.
 * @param {string} difficulty - Difficulty level
 * @returns {number} Frightened ghost speed in pixels per ms
 */
export function getFrightenedSpeed(difficulty) {
  const settings = getDifficultySettings(difficulty);
  return settings.frightenedSpeed;
}

/**
 * Gets eaten ghost speed for the current difficulty.
 * @param {string} difficulty - Difficulty level
 * @returns {number} Eaten ghost speed in pixels per ms
 */
export function getEatenSpeed(difficulty) {
  const settings = getDifficultySettings(difficulty);
  return settings.eatenSpeed;
}

/**
 * Gets mode timing settings for the current difficulty.
 * @param {string} difficulty - Difficulty level
 * @returns {object} Mode timings { scatter, chase }
 */
export function getModeTimings(difficulty) {
  const settings = getDifficultySettings(difficulty);
  return {
    scatter: settings.scatterDuration,
    chase: settings.chaseDuration,
  };
}

/**
 * Gets the ghost release delay multiplier for the current difficulty.
 * @param {string} difficulty - Difficulty level
 * @returns {number} Release delay multiplier
 */
export function getReleaseDelayMultiplier(difficulty) {
  const settings = getDifficultySettings(difficulty);
  return settings.releaseDelayMultiplier;
}

/**
 * Gets Clyde's shy distance for the current difficulty.
 * @param {string} difficulty - Difficulty level
 * @returns {number} Distance in tiles
 */
export function getClydeShyDistance(difficulty) {
  const settings = getDifficultySettings(difficulty);
  return settings.clydeShyDistance;
}
