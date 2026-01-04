/**
 * Tests for ScoreDisplay component.
 * Tests the split-screen score display for 2-player Pacman.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, resetGameStore, setGameStoreState, waitFor, act } from '../test/test-utils.jsx';
import ScoreDisplay from './ScoreDisplay.jsx';

describe('ScoreDisplay', () => {
  beforeEach(() => {
    resetGameStore();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ============================================
  // Basic Rendering Tests
  // ============================================
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<ScoreDisplay />);
      expect(screen.getByText('P1')).toBeInTheDocument();
      expect(screen.getByText('P2')).toBeInTheDocument();
    });

    it('renders player 1 label', () => {
      render(<ScoreDisplay />);
      expect(screen.getByText('P1')).toBeInTheDocument();
    });

    it('renders player 2 label', () => {
      render(<ScoreDisplay />);
      expect(screen.getByText('P2')).toBeInTheDocument();
    });

    it('renders HIGH SCORE label', () => {
      render(<ScoreDisplay />);
      expect(screen.getByText('HIGH SCORE')).toBeInTheDocument();
    });

    it('renders LEVEL label', () => {
      render(<ScoreDisplay />);
      expect(screen.getByText('LEVEL')).toBeInTheDocument();
    });

    it('has correct container class', () => {
      const { container } = render(<ScoreDisplay />);
      expect(container.querySelector('.score-display')).toBeInTheDocument();
    });

    it('renders player 1 section with correct class', () => {
      const { container } = render(<ScoreDisplay />);
      expect(container.querySelector('.score-display__player--p1')).toBeInTheDocument();
    });

    it('renders player 2 section with correct class', () => {
      const { container } = render(<ScoreDisplay />);
      expect(container.querySelector('.score-display__player--p2')).toBeInTheDocument();
    });

    it('renders center section', () => {
      const { container } = render(<ScoreDisplay />);
      expect(container.querySelector('.score-display__center')).toBeInTheDocument();
    });
  });

  // ============================================
  // Score Display Tests
  // ============================================
  describe('Score Display', () => {
    it('displays initial player 1 score of 0', () => {
      render(<ScoreDisplay />);
      // Score 0 formatted with toLocaleString is "0"
      const scoreElements = screen.getAllByText('0');
      expect(scoreElements.length).toBeGreaterThanOrEqual(1);
    });

    it('displays player 1 score from store', () => {
      render(<ScoreDisplay />, { initialState: { score: 1500 } });
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    it('displays player 2 score from store', () => {
      render(<ScoreDisplay />, { initialState: { player2Score: 2500 } });
      expect(screen.getByText('2,500')).toBeInTheDocument();
    });

    it('displays high score from store', () => {
      render(<ScoreDisplay />, { initialState: { highScore: 10000 } });
      expect(screen.getByText('10,000')).toBeInTheDocument();
    });

    it('formats large scores with commas', () => {
      render(<ScoreDisplay />, { initialState: { score: 1234567 } });
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('displays different scores for each player', () => {
      render(<ScoreDisplay />, {
        initialState: { score: 500, player2Score: 750 }
      });
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('750')).toBeInTheDocument();
    });
  });

  // ============================================
  // Level Display Tests
  // ============================================
  describe('Level Display', () => {
    it('displays initial level 1', () => {
      render(<ScoreDisplay />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('displays current level from store', () => {
      render(<ScoreDisplay />, { initialState: { level: 5 } });
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays high level numbers', () => {
      render(<ScoreDisplay />, { initialState: { level: 256 } });
      expect(screen.getByText('256')).toBeInTheDocument();
    });
  });

  // ============================================
  // Lives Display Tests
  // ============================================
  describe('Lives Display', () => {
    it('renders lives container for player 1', () => {
      const { container } = render(<ScoreDisplay />);
      const p1Section = container.querySelector('.score-display__player--p1');
      expect(p1Section.querySelector('.score-display__lives')).toBeInTheDocument();
    });

    it('renders lives container for player 2', () => {
      const { container } = render(<ScoreDisplay />);
      const p2Section = container.querySelector('.score-display__player--p2');
      expect(p2Section.querySelector('.score-display__lives')).toBeInTheDocument();
    });

    it('renders correct number of life icons for player 1', () => {
      const { container } = render(<ScoreDisplay />, { initialState: { lives: 3 } });
      const p1Section = container.querySelector('.score-display__player--p1');
      const lives = p1Section.querySelectorAll('.score-display__life--p1');
      expect(lives.length).toBe(3);
    });

    it('renders correct number of life icons for player 2', () => {
      const { container } = render(<ScoreDisplay />, { initialState: { player2Lives: 2 } });
      const p2Section = container.querySelector('.score-display__player--p2');
      const lives = p2Section.querySelectorAll('.score-display__life--p2');
      expect(lives.length).toBe(2);
    });

    it('renders no life icons when lives are 0', () => {
      const { container } = render(<ScoreDisplay />, { initialState: { lives: 0 } });
      const p1Section = container.querySelector('.score-display__player--p1');
      const lives = p1Section.querySelectorAll('.score-display__life--p1');
      expect(lives.length).toBe(0);
    });

    it('updates life count when store changes', async () => {
      const { container } = render(<ScoreDisplay />, { initialState: { lives: 3 } });

      let p1Section = container.querySelector('.score-display__player--p1');
      expect(p1Section.querySelectorAll('.score-display__life--p1').length).toBe(3);

      act(() => {
        setGameStoreState({ lives: 2 });
      });

      await waitFor(() => {
        p1Section = container.querySelector('.score-display__player--p1');
        expect(p1Section.querySelectorAll('.score-display__life--p1').length).toBe(2);
      });
    });

    it('renders SVG elements for life icons', () => {
      const { container } = render(<ScoreDisplay />, { initialState: { lives: 1 } });
      const p1Section = container.querySelector('.score-display__player--p1');
      const svgElements = p1Section.querySelectorAll('svg');
      expect(svgElements.length).toBe(1);
    });

    it('life icons have correct viewBox attribute', () => {
      const { container } = render(<ScoreDisplay />, { initialState: { lives: 1 } });
      const p1Section = container.querySelector('.score-display__player--p1');
      const svg = p1Section.querySelector('svg');
      expect(svg.getAttribute('viewBox')).toBe('0 0 20 20');
    });

    it('renders different number of lives for each player', () => {
      const { container } = render(<ScoreDisplay />, {
        initialState: { lives: 3, player2Lives: 1 }
      });
      const p1Section = container.querySelector('.score-display__player--p1');
      const p2Section = container.querySelector('.score-display__player--p2');

      expect(p1Section.querySelectorAll('.score-display__life--p1').length).toBe(3);
      expect(p2Section.querySelectorAll('.score-display__life--p2').length).toBe(1);
    });
  });

  // ============================================
  // Score Animation Tests
  // ============================================
  describe('Score Animation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('applies animating class when score is increasing', async () => {
      const { container } = render(<ScoreDisplay />, { initialState: { score: 0 } });

      act(() => {
        setGameStoreState({ score: 1000 });
      });

      // The animated score starts below target, triggering animation class
      const scoreElement = container.querySelector('.score-display__player--p1 .score-display__score');
      expect(scoreElement).toHaveClass('score-display__score--animating');
    });

    it('removes animating class when animation completes', async () => {
      vi.useRealTimers(); // Need real timers for RAF

      const { container } = render(<ScoreDisplay />, { initialState: { score: 100 } });

      // Wait for animation to catch up (should be quick for small score)
      await waitFor(() => {
        const scoreElement = container.querySelector('.score-display__player--p1 .score-display__score');
        expect(scoreElement).not.toHaveClass('score-display__score--animating');
      }, { timeout: 500 });
    });

    it('snaps score down immediately on reset', async () => {
      vi.useRealTimers();

      const { container } = render(<ScoreDisplay />, { initialState: { score: 5000 } });

      // Wait for initial display
      await waitFor(() => {
        expect(screen.getByText('5,000')).toBeInTheDocument();
      });

      act(() => {
        setGameStoreState({ score: 0 });
      });

      // Score should snap down, not animate
      await waitFor(() => {
        const scoreElements = screen.getAllByText('0');
        expect(scoreElements.length).toBeGreaterThanOrEqual(1);
      }, { timeout: 200 });
    });
  });

  // ============================================
  // Store Integration Tests
  // ============================================
  describe('Store Integration', () => {
    it('updates when player 1 score changes', async () => {
      render(<ScoreDisplay />, { initialState: { score: 100 } });
      expect(screen.getByText('100')).toBeInTheDocument();

      act(() => {
        setGameStoreState({ score: 200 });
      });

      // Due to animation, we need to wait for it to catch up
      await waitFor(() => {
        expect(screen.getByText('200')).toBeInTheDocument();
      });
    });

    it('updates when player 2 score changes', async () => {
      render(<ScoreDisplay />, { initialState: { player2Score: 300 } });
      expect(screen.getByText('300')).toBeInTheDocument();

      act(() => {
        setGameStoreState({ player2Score: 400 });
      });

      await waitFor(() => {
        expect(screen.getByText('400')).toBeInTheDocument();
      });
    });

    it('updates when high score changes', () => {
      render(<ScoreDisplay />, { initialState: { highScore: 5000 } });
      expect(screen.getByText('5,000')).toBeInTheDocument();

      act(() => {
        setGameStoreState({ highScore: 10000 });
      });

      expect(screen.getByText('10,000')).toBeInTheDocument();
    });

    it('updates when level changes', () => {
      render(<ScoreDisplay />, { initialState: { level: 1 } });
      expect(screen.getByText('1')).toBeInTheDocument();

      act(() => {
        setGameStoreState({ level: 2 });
      });

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('reflects all state properties simultaneously', () => {
      render(<ScoreDisplay />, {
        initialState: {
          score: 1000,
          player2Score: 2000,
          highScore: 5000,
          level: 3,
          lives: 2,
          player2Lives: 1
        }
      });

      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('2,000')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('renders all score values as visible text', () => {
      render(<ScoreDisplay />, {
        initialState: { score: 100, player2Score: 200, highScore: 300 }
      });

      // All scores should be visible text, not hidden
      expect(screen.getByText('100')).toBeVisible();
      expect(screen.getByText('200')).toBeVisible();
      expect(screen.getByText('300')).toBeVisible();
    });

    it('renders player labels as visible text', () => {
      render(<ScoreDisplay />);
      expect(screen.getByText('P1')).toBeVisible();
      expect(screen.getByText('P2')).toBeVisible();
    });

    it('renders section labels as visible text', () => {
      render(<ScoreDisplay />);
      expect(screen.getByText('HIGH SCORE')).toBeVisible();
      expect(screen.getByText('LEVEL')).toBeVisible();
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('handles very large scores', () => {
      render(<ScoreDisplay />, { initialState: { score: 999999999 } });
      expect(screen.getByText('999,999,999')).toBeInTheDocument();
    });

    it('handles zero lives correctly', () => {
      const { container } = render(<ScoreDisplay />, {
        initialState: { lives: 0, player2Lives: 0 }
      });

      const p1Section = container.querySelector('.score-display__player--p1');
      const p2Section = container.querySelector('.score-display__player--p2');

      expect(p1Section.querySelectorAll('.score-display__life--p1').length).toBe(0);
      expect(p2Section.querySelectorAll('.score-display__life--p2').length).toBe(0);
    });

    it('handles many lives correctly', () => {
      const { container } = render(<ScoreDisplay />, { initialState: { lives: 10 } });
      const p1Section = container.querySelector('.score-display__player--p1');
      expect(p1Section.querySelectorAll('.score-display__life--p1').length).toBe(10);
    });

    it('handles level 0 edge case', () => {
      render(<ScoreDisplay />, { initialState: { level: 0 } });
      // Level display should show 0 (even though this is invalid state)
      const levelElements = screen.getAllByText('0');
      expect(levelElements.length).toBeGreaterThanOrEqual(1);
    });

    it('handles simultaneous score updates', async () => {
      render(<ScoreDisplay />, {
        initialState: { score: 0, player2Score: 0 }
      });

      act(() => {
        setGameStoreState({ score: 1000, player2Score: 2000 });
      });

      // Both should eventually display the correct values
      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
        expect(screen.getByText('2,000')).toBeInTheDocument();
      });
    });
  });
});

// ============================================
// PacManLife Component Tests (internal component)
// ============================================
describe('PacManLife SVG', () => {
  beforeEach(() => {
    resetGameStore();
  });

  it('renders P1 life with correct CSS class', () => {
    const { container } = render(<ScoreDisplay />, { initialState: { lives: 1 } });
    const p1Section = container.querySelector('.score-display__player--p1');
    const life = p1Section.querySelector('.score-display__life');
    expect(life).toHaveClass('score-display__life--p1');
  });

  it('renders P2 life with correct CSS class', () => {
    const { container } = render(<ScoreDisplay />, { initialState: { player2Lives: 1 } });
    const p2Section = container.querySelector('.score-display__player--p2');
    const life = p2Section.querySelector('.score-display__life');
    expect(life).toHaveClass('score-display__life--p2');
  });

  it('renders SVG path for Pac-Man shape', () => {
    const { container } = render(<ScoreDisplay />, { initialState: { lives: 1 } });
    const path = container.querySelector('.score-display__life path');
    expect(path).toBeInTheDocument();
    expect(path.getAttribute('d')).toContain('M 10 10');
  });

  it('path has currentColor fill', () => {
    const { container } = render(<ScoreDisplay />, { initialState: { lives: 1 } });
    const path = container.querySelector('.score-display__life path');
    expect(path.getAttribute('fill')).toBe('currentColor');
  });
});
