/**
 * Leaderboard management utilities for Pac-Man game.
 * Persists top 10 high scores to localStorage.
 */

const LEADERBOARD_KEY = 'pacman-leaderboard';
const MAX_ENTRIES = 10;

/**
 * Get the current leaderboard from localStorage.
 * @returns {Array<{initials: string, score: number, level: number, date: string}>}
 */
export function getLeaderboard() {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Validate and sanitize data
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(entry =>
        entry &&
        typeof entry.initials === 'string' &&
        typeof entry.score === 'number' &&
        entry.score >= 0
      )
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/**
 * Save a new score to the leaderboard.
 * @param {string} initials - 3-letter player initials
 * @param {number} score - Player's final score
 * @param {number} level - Level reached
 * @returns {number} The rank achieved (1-10) or -1 if not in top 10
 */
export function saveScore(initials, score, level) {
  // Sanitize initials to 3 uppercase letters
  const sanitizedInitials = initials
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)
    .padEnd(3, '_');

  const newEntry = {
    initials: sanitizedInitials,
    score: Math.max(0, Math.floor(score)),
    level: Math.max(1, Math.floor(level)),
    date: new Date().toISOString(),
  };

  const leaderboard = getLeaderboard();

  // Find where this score ranks
  let insertIndex = leaderboard.findIndex(entry => score > entry.score);
  if (insertIndex === -1) {
    insertIndex = leaderboard.length;
  }

  // If not in top 10, don't add
  if (insertIndex >= MAX_ENTRIES) {
    return -1;
  }

  // Insert at the correct position
  leaderboard.splice(insertIndex, 0, newEntry);

  // Trim to max entries
  const trimmedLeaderboard = leaderboard.slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmedLeaderboard));
  } catch {
    // localStorage might be full or unavailable
    return -1;
  }

  return insertIndex + 1; // Return 1-based rank
}

/**
 * Check if a score qualifies for the leaderboard.
 * @param {number} score - The score to check
 * @returns {boolean} True if score would make it to top 10
 */
export function isHighScore(score) {
  if (score <= 0) return false;
  const leaderboard = getLeaderboard();
  if (leaderboard.length < MAX_ENTRIES) return true;
  return score > leaderboard[leaderboard.length - 1].score;
}

/**
 * Get the minimum score needed to make the leaderboard.
 * @returns {number} Minimum score needed, or 0 if leaderboard not full
 */
export function getMinimumHighScore() {
  const leaderboard = getLeaderboard();
  if (leaderboard.length < MAX_ENTRIES) return 0;
  return leaderboard[leaderboard.length - 1].score + 1;
}

/**
 * Clear the entire leaderboard.
 */
export function clearLeaderboard() {
  try {
    localStorage.removeItem(LEADERBOARD_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Format a date string for display.
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date like "01/05"
 */
export function formatDate(isoDate) {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
      return '--/--';
    }
    // Use UTC methods to avoid timezone issues
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${month}/${day}`;
  } catch {
    return '--/--';
  }
}
