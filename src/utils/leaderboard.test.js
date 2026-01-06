import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getLeaderboard,
  saveScore,
  isHighScore,
  getMinimumHighScore,
  clearLeaderboard,
  formatDate,
} from './leaderboard';

describe('leaderboard', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getLeaderboard', () => {
    it('should return empty array when no leaderboard exists', () => {
      expect(getLeaderboard()).toEqual([]);
    });

    it('should return empty array for invalid JSON', () => {
      localStorage.setItem('pacman-leaderboard', 'invalid json');
      expect(getLeaderboard()).toEqual([]);
    });

    it('should return empty array for non-array data', () => {
      localStorage.setItem('pacman-leaderboard', '{"foo": "bar"}');
      expect(getLeaderboard()).toEqual([]);
    });

    it('should filter out invalid entries', () => {
      localStorage.setItem('pacman-leaderboard', JSON.stringify([
        { initials: 'ABC', score: 1000, level: 1, date: '2025-01-01' },
        { initials: 123, score: 500, level: 1 }, // Invalid initials
        { initials: 'DEF', score: -100, level: 1 }, // Invalid score
        { initials: 'GHI', score: 800, level: 2, date: '2025-01-02' },
      ]));

      const result = getLeaderboard();
      expect(result).toHaveLength(2);
      expect(result[0].initials).toBe('ABC');
      expect(result[1].initials).toBe('GHI');
    });

    it('should limit to 10 entries', () => {
      const entries = Array.from({ length: 15 }, (_, i) => ({
        initials: `A${i.toString().padStart(2, '0')}`,
        score: 1000 - i * 10,
        level: 1,
        date: '2025-01-01',
      }));
      localStorage.setItem('pacman-leaderboard', JSON.stringify(entries));

      expect(getLeaderboard()).toHaveLength(10);
    });
  });

  describe('saveScore', () => {
    it('should save a new high score to empty leaderboard', () => {
      const rank = saveScore('ABC', 1000, 3);

      expect(rank).toBe(1);
      const leaderboard = getLeaderboard();
      expect(leaderboard).toHaveLength(1);
      expect(leaderboard[0].initials).toBe('ABC');
      expect(leaderboard[0].score).toBe(1000);
      expect(leaderboard[0].level).toBe(3);
    });

    it('should sanitize initials to uppercase', () => {
      saveScore('abc', 1000, 1);
      expect(getLeaderboard()[0].initials).toBe('ABC');
    });

    it('should remove non-letter characters from initials', () => {
      saveScore('A1B', 1000, 1);
      expect(getLeaderboard()[0].initials).toBe('AB_');
    });

    it('should pad short initials with underscores', () => {
      saveScore('AB', 1000, 1);
      expect(getLeaderboard()[0].initials).toBe('AB_');
    });

    it('should truncate long initials', () => {
      saveScore('ABCDEF', 1000, 1);
      expect(getLeaderboard()[0].initials).toBe('ABC');
    });

    it('should insert score in correct position', () => {
      saveScore('AAA', 3000, 1);
      saveScore('BBB', 1000, 1);
      saveScore('CCC', 2000, 1);

      const leaderboard = getLeaderboard();
      expect(leaderboard[0].initials).toBe('AAA');
      expect(leaderboard[1].initials).toBe('CCC');
      expect(leaderboard[2].initials).toBe('BBB');
    });

    it('should return correct rank', () => {
      saveScore('AAA', 3000, 1);
      saveScore('BBB', 1000, 1);

      expect(saveScore('CCC', 2000, 1)).toBe(2);
      expect(saveScore('DDD', 500, 1)).toBe(4);
      expect(saveScore('EEE', 5000, 1)).toBe(1);
    });

    it('should limit leaderboard to 10 entries', () => {
      for (let i = 0; i < 12; i++) {
        saveScore(`A${i.toString().padStart(2, '0')}`, (12 - i) * 100, 1);
      }

      expect(getLeaderboard()).toHaveLength(10);
    });

    it('should return -1 if score does not make top 10', () => {
      for (let i = 0; i < 10; i++) {
        saveScore(`A${i.toString().padStart(2, '0')}`, 1000 + i * 100, 1);
      }

      expect(saveScore('ZZZ', 500, 1)).toBe(-1);
    });

    it('should floor decimal scores', () => {
      saveScore('ABC', 1000.99, 1);
      expect(getLeaderboard()[0].score).toBe(1000);
    });

    it('should handle negative scores', () => {
      saveScore('ABC', -100, 1);
      expect(getLeaderboard()[0].score).toBe(0);
    });
  });

  describe('isHighScore', () => {
    it('should return true for any score on empty leaderboard', () => {
      expect(isHighScore(1)).toBe(true);
      expect(isHighScore(0)).toBe(false);
    });

    it('should return true if leaderboard not full', () => {
      for (let i = 0; i < 5; i++) {
        saveScore(`A${i.toString().padStart(2, '0')}`, 1000, 1);
      }
      expect(isHighScore(1)).toBe(true);
    });

    it('should return false if score is lower than all entries in full leaderboard', () => {
      for (let i = 0; i < 10; i++) {
        saveScore(`A${i.toString().padStart(2, '0')}`, 1000 + i * 100, 1);
      }
      expect(isHighScore(500)).toBe(false);
    });

    it('should return true if score is higher than lowest entry in full leaderboard', () => {
      for (let i = 0; i < 10; i++) {
        saveScore(`A${i.toString().padStart(2, '0')}`, 1000 + i * 100, 1);
      }
      expect(isHighScore(1500)).toBe(true);
    });

    it('should return false for zero or negative scores', () => {
      expect(isHighScore(0)).toBe(false);
      expect(isHighScore(-100)).toBe(false);
    });
  });

  describe('getMinimumHighScore', () => {
    it('should return 0 for empty leaderboard', () => {
      expect(getMinimumHighScore()).toBe(0);
    });

    it('should return 0 for partially filled leaderboard', () => {
      for (let i = 0; i < 5; i++) {
        saveScore(`A${i.toString().padStart(2, '0')}`, 1000, 1);
      }
      expect(getMinimumHighScore()).toBe(0);
    });

    it('should return lowest score + 1 for full leaderboard', () => {
      for (let i = 0; i < 10; i++) {
        saveScore(`A${i.toString().padStart(2, '0')}`, 1000 + i * 100, 1);
      }
      expect(getMinimumHighScore()).toBe(1001);
    });
  });

  describe('clearLeaderboard', () => {
    it('should clear all entries', () => {
      saveScore('ABC', 1000, 1);
      saveScore('DEF', 2000, 2);
      expect(getLeaderboard()).toHaveLength(2);

      clearLeaderboard();
      expect(getLeaderboard()).toEqual([]);
    });
  });

  describe('formatDate', () => {
    it('should format ISO date to MM/DD', () => {
      expect(formatDate('2025-01-05T12:00:00.000Z')).toBe('01/05');
      expect(formatDate('2025-12-25T00:00:00.000Z')).toBe('12/25');
    });

    it('should return placeholder for invalid date', () => {
      expect(formatDate('invalid')).toBe('--/--');
      expect(formatDate('')).toBe('--/--');
    });
  });
});
