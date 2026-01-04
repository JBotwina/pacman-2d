/**
 * Tests for LevelCompleteScreen component.
 * Validates level progression UI including next level vs game completion flow.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent, resetGameStore, setGameStoreState, act } from '../test/test-utils.jsx';
import LevelCompleteScreen from './LevelCompleteScreen.jsx';
import { GameStatus, MAX_LEVEL } from '../store/gameStore.js';

describe('LevelCompleteScreen', () => {
  beforeEach(() => {
    resetGameStore();
  });

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('renders the level complete title with current level', () => {
      render(<LevelCompleteScreen />, { initialState: { level: 1 } });
      expect(screen.getByText('LEVEL 1 COMPLETE!')).toBeInTheDocument();
    });

    it('renders the correct level number for level 3', () => {
      render(<LevelCompleteScreen />, { initialState: { level: 3 } });
      expect(screen.getByText('LEVEL 3 COMPLETE!')).toBeInTheDocument();
    });

    it('renders with menu-overlay class', () => {
      render(<LevelCompleteScreen />);
      const container = screen.getByText(/LEVEL.*COMPLETE/i).closest('.menu-overlay');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('level-complete-screen');
    });

    it('renders the title with correct class', () => {
      render(<LevelCompleteScreen />);
      const title = screen.getByText(/LEVEL.*COMPLETE/i);
      expect(title).toHaveClass('level-complete-title');
    });

    it('renders the score label', () => {
      render(<LevelCompleteScreen />);
      expect(screen.getByText('SCORE')).toBeInTheDocument();
    });

    it('renders the keyboard hint', () => {
      render(<LevelCompleteScreen />);
      expect(screen.getByText('Press ENTER to continue')).toBeInTheDocument();
    });

    it('renders hint with correct class', () => {
      render(<LevelCompleteScreen />);
      const hint = screen.getByText('Press ENTER to continue');
      expect(hint).toHaveClass('level-complete-hint');
    });
  });

  // ============================================
  // Score Display Tests
  // ============================================
  describe('Score Display', () => {
    it('displays score of 0 when no points scored', () => {
      render(<LevelCompleteScreen />, { initialState: { score: 0 } });
      const scoreRow = screen.getByText('SCORE').closest('.stat-row');
      expect(scoreRow.querySelector('.score-value')).toHaveTextContent('0');
    });

    it('displays the current score from store', () => {
      render(<LevelCompleteScreen />, { initialState: { score: 7500 } });
      const scoreRow = screen.getByText('SCORE').closest('.stat-row');
      expect(scoreRow.querySelector('.score-value')).toHaveTextContent('7500');
    });

    it('displays large scores correctly', () => {
      render(<LevelCompleteScreen />, { initialState: { score: 123456 } });
      const scoreRow = screen.getByText('SCORE').closest('.stat-row');
      expect(scoreRow.querySelector('.score-value')).toHaveTextContent('123456');
    });

    it('score value has correct CSS class', () => {
      render(<LevelCompleteScreen />, { initialState: { score: 5000 } });
      const scoreRow = screen.getByText('SCORE').closest('.stat-row');
      const scoreValue = scoreRow.querySelector('.stat-value');
      expect(scoreValue).toHaveClass('stat-value', 'score-value');
    });
  });

  // ============================================
  // Button Text Tests (CRITICAL for level progression)
  // ============================================
  describe('Button Text based on Level', () => {
    it('shows NEXT LEVEL button for level 1', () => {
      render(<LevelCompleteScreen />, { initialState: { level: 1 } });
      expect(screen.getByRole('button', { name: 'NEXT LEVEL' })).toBeInTheDocument();
    });

    it('shows NEXT LEVEL button for level 2', () => {
      render(<LevelCompleteScreen />, { initialState: { level: 2 } });
      expect(screen.getByRole('button', { name: 'NEXT LEVEL' })).toBeInTheDocument();
    });

    it('shows NEXT LEVEL button for level 3', () => {
      render(<LevelCompleteScreen />, { initialState: { level: 3 } });
      expect(screen.getByRole('button', { name: 'NEXT LEVEL' })).toBeInTheDocument();
    });

    it('shows NEXT LEVEL button for level 4', () => {
      render(<LevelCompleteScreen />, { initialState: { level: 4 } });
      expect(screen.getByRole('button', { name: 'NEXT LEVEL' })).toBeInTheDocument();
    });

    it('shows FINISH GAME button for level 5 (MAX_LEVEL)', () => {
      render(<LevelCompleteScreen />, { initialState: { level: MAX_LEVEL } });
      expect(screen.getByRole('button', { name: 'FINISH GAME' })).toBeInTheDocument();
    });

    it('shows FINISH GAME button when at MAX_LEVEL', () => {
      render(<LevelCompleteScreen />, { initialState: { level: 5 } });
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('FINISH GAME');
    });
  });

  // ============================================
  // Next Level Button Interaction Tests
  // ============================================
  describe('Next Level Button', () => {
    it('calls nextLevel when clicked on level 1', async () => {
      const user = userEvent.setup();
      render(<LevelCompleteScreen />, { initialState: { level: 1 } });

      const button = screen.getByRole('button', { name: 'NEXT LEVEL' });
      await user.click(button);

      const { useGameStore } = await import('../store/gameStore.js');
      const state = useGameStore.getState();
      expect(state.level).toBe(2);
    });

    it('advances from level 2 to level 3', async () => {
      const user = userEvent.setup();
      render(<LevelCompleteScreen />, { initialState: { level: 2 } });

      await user.click(screen.getByRole('button', { name: 'NEXT LEVEL' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().level).toBe(3);
    });

    it('advances from level 4 to level 5', async () => {
      const user = userEvent.setup();
      render(<LevelCompleteScreen />, { initialState: { level: 4 } });

      await user.click(screen.getByRole('button', { name: 'NEXT LEVEL' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().level).toBe(5);
    });

    it('sets status to GAME_COMPLETE when finishing level 5', async () => {
      const user = userEvent.setup();
      render(<LevelCompleteScreen />, { initialState: { level: MAX_LEVEL } });

      await user.click(screen.getByRole('button', { name: 'FINISH GAME' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().status).toBe(GameStatus.GAME_COMPLETE);
    });

    it('preserves score when advancing to next level', async () => {
      const user = userEvent.setup();
      render(<LevelCompleteScreen />, { initialState: { level: 1, score: 8500 } });

      await user.click(screen.getByRole('button', { name: 'NEXT LEVEL' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().score).toBe(8500);
    });

    it('preserves lives when advancing to next level', async () => {
      const user = userEvent.setup();
      render(<LevelCompleteScreen />, { initialState: { level: 2, lives: 2 } });

      await user.click(screen.getByRole('button', { name: 'NEXT LEVEL' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().lives).toBe(2);
    });

    it('preserves highScore when advancing to next level', async () => {
      const user = userEvent.setup();
      render(<LevelCompleteScreen />, { initialState: { level: 3 }, highScore: 25000 });

      await user.click(screen.getByRole('button', { name: 'NEXT LEVEL' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().highScore).toBe(25000);
    });

    it('sets status to IDLE when advancing (before game starts)', async () => {
      const user = userEvent.setup();
      render(<LevelCompleteScreen />, { initialState: { level: 1 } });

      await user.click(screen.getByRole('button', { name: 'NEXT LEVEL' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().status).toBe(GameStatus.IDLE);
    });
  });

  // ============================================
  // Full Level Progression E2E Tests
  // ============================================
  describe('Full Level Progression Flow', () => {
    it('can progress from level 1 through level 5', async () => {
      const user = userEvent.setup();

      // Start at level 1
      const { rerender } = render(<LevelCompleteScreen />, { initialState: { level: 1, score: 1000 } });

      // Advance through levels 1-4
      for (let level = 1; level < MAX_LEVEL; level++) {
        act(() => {
          setGameStoreState({ level });
        });
        rerender(<LevelCompleteScreen />);

        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('NEXT LEVEL');
        await user.click(button);
      }

      // At level 5, should show FINISH GAME
      act(() => {
        setGameStoreState({ level: MAX_LEVEL });
      });
      rerender(<LevelCompleteScreen />);

      const finishButton = screen.getByRole('button');
      expect(finishButton).toHaveTextContent('FINISH GAME');
    });

    it('preserves score across multiple level transitions', async () => {
      const user = userEvent.setup();
      const { useGameStore } = await import('../store/gameStore.js');

      // Start with some score
      render(<LevelCompleteScreen />, { initialState: { level: 1, score: 5000 } });
      await user.click(screen.getByRole('button', { name: 'NEXT LEVEL' }));
      expect(useGameStore.getState().score).toBe(5000);

      // Add more score and advance again
      act(() => {
        setGameStoreState({ score: 10000 });
      });
      await user.click(screen.getByRole('button', { name: 'NEXT LEVEL' }));
      expect(useGameStore.getState().score).toBe(10000);
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('button is focusable', () => {
      render(<LevelCompleteScreen />);
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('button can be activated with Enter key', async () => {
      const user = userEvent.setup();
      render(<LevelCompleteScreen />, { initialState: { level: 1 } });

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().level).toBe(2);
    });

    it('button can be activated with Space key', async () => {
      const user = userEvent.setup();
      render(<LevelCompleteScreen />, { initialState: { level: 2 } });

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().level).toBe(3);
    });

    it('has semantic heading for level complete title', () => {
      render(<LevelCompleteScreen />, { initialState: { level: 1 } });
      const heading = screen.getByRole('heading', { name: /LEVEL.*COMPLETE/i });
      expect(heading).toBeInTheDocument();
    });
  });

  // ============================================
  // Component Structure Tests
  // ============================================
  describe('Component Structure', () => {
    it('has correct DOM hierarchy for stats', () => {
      render(<LevelCompleteScreen />);
      const container = screen.getByText(/LEVEL.*COMPLETE/i).parentElement;
      const levelStats = container.querySelector('.level-stats');
      expect(levelStats).toBeInTheDocument();
      expect(levelStats.querySelectorAll('.stat-row')).toHaveLength(1);
    });

    it('button has correct CSS classes', () => {
      render(<LevelCompleteScreen />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('menu-button', 'next-level-button');
    });

    it('button comes after stats section', () => {
      render(<LevelCompleteScreen />);
      const container = screen.getByText(/LEVEL.*COMPLETE/i).parentElement;
      const children = Array.from(container.children);
      const statsIndex = children.findIndex(el => el.classList.contains('level-stats'));
      const buttonIndex = children.findIndex(el => el.classList.contains('next-level-button'));
      expect(buttonIndex).toBeGreaterThan(statsIndex);
    });

    it('hint comes after button', () => {
      render(<LevelCompleteScreen />);
      const container = screen.getByText(/LEVEL.*COMPLETE/i).parentElement;
      const children = Array.from(container.children);
      const buttonIndex = children.findIndex(el => el.classList.contains('next-level-button'));
      const hintIndex = children.findIndex(el => el.classList.contains('level-complete-hint'));
      expect(hintIndex).toBeGreaterThan(buttonIndex);
    });
  });
});
