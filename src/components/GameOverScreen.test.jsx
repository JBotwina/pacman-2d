/**
 * Tests for GameOverScreen component.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, resetGameStore, setGameStoreState, act } from '../test/test-utils.jsx';
import GameOverScreen from './GameOverScreen.jsx';
import { GameStatus } from '../store/gameStore.js';

describe('GameOverScreen', () => {
  beforeEach(() => {
    resetGameStore();
  });

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('renders the game over title', () => {
      render(<GameOverScreen />);
      expect(screen.getByText('GAME OVER')).toBeInTheDocument();
    });

    it('renders with menu-overlay class', () => {
      render(<GameOverScreen />);
      const container = screen.getByText('GAME OVER').closest('.menu-overlay');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('game-over-screen');
    });

    it('renders the game over title with correct class', () => {
      render(<GameOverScreen />);
      const title = screen.getByText('GAME OVER');
      expect(title).toHaveClass('game-over-title');
    });

    it('renders the final stats section', () => {
      render(<GameOverScreen />);
      expect(screen.getByText('FINAL SCORE')).toBeInTheDocument();
      expect(screen.getByText('LEVEL REACHED')).toBeInTheDocument();
    });

    it('renders the play again button', () => {
      render(<GameOverScreen />);
      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('menu-button', 'restart-button');
    });

    it('renders the keyboard hint', () => {
      render(<GameOverScreen />);
      expect(screen.getByText('Press ENTER to play again')).toBeInTheDocument();
    });

    it('renders keyboard hint with correct class', () => {
      render(<GameOverScreen />);
      const hint = screen.getByText('Press ENTER to play again');
      expect(hint).toHaveClass('game-over-hint');
    });
  });

  // ============================================
  // Score Display Tests
  // ============================================
  describe('Score Display', () => {
    it('displays score of 0 when no points scored', () => {
      render(<GameOverScreen />, { initialState: { score: 0 } });
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays the current score from store', () => {
      render(<GameOverScreen />, { initialState: { score: 12500 } });
      expect(screen.getByText('12500')).toBeInTheDocument();
    });

    it('displays large scores correctly', () => {
      render(<GameOverScreen />, { initialState: { score: 999999 } });
      expect(screen.getByText('999999')).toBeInTheDocument();
    });

    it('score value has correct CSS class', () => {
      render(<GameOverScreen />, { initialState: { score: 5000 } });
      const scoreValue = screen.getByText('5000');
      expect(scoreValue).toHaveClass('stat-value', 'score-value');
    });

    it('final score label has correct CSS class', () => {
      render(<GameOverScreen />);
      const label = screen.getByText('FINAL SCORE');
      expect(label).toHaveClass('stat-label');
    });
  });

  // ============================================
  // Level Display Tests
  // ============================================
  describe('Level Display', () => {
    it('displays level 1 by default', () => {
      render(<GameOverScreen />, { initialState: { level: 1 } });
      const levelValue = screen.getByText('LEVEL REACHED').closest('.stat-row').querySelector('.stat-value');
      expect(levelValue).toHaveTextContent('1');
    });

    it('displays the current level from store', () => {
      render(<GameOverScreen />, { initialState: { level: 5 } });
      const levelValue = screen.getByText('LEVEL REACHED').closest('.stat-row').querySelector('.stat-value');
      expect(levelValue).toHaveTextContent('5');
    });

    it('displays high levels correctly', () => {
      render(<GameOverScreen />, { initialState: { level: 99 } });
      const levelValue = screen.getByText('LEVEL REACHED').closest('.stat-row').querySelector('.stat-value');
      expect(levelValue).toHaveTextContent('99');
    });

    it('level reached label has correct CSS class', () => {
      render(<GameOverScreen />);
      const label = screen.getByText('LEVEL REACHED');
      expect(label).toHaveClass('stat-label');
    });

    it('level value has correct CSS class', () => {
      render(<GameOverScreen />, { initialState: { level: 3 } });
      const levelValue = screen.getByText('LEVEL REACHED').closest('.stat-row').querySelector('.stat-value');
      expect(levelValue).toHaveClass('stat-value');
    });
  });

  // ============================================
  // Play Again Button Interaction Tests
  // ============================================
  describe('Play Again Button', () => {
    it('calls resetGame when clicked', async () => {
      const user = userEvent.setup();
      render(<GameOverScreen />, { initialState: { status: GameStatus.GAME_OVER, score: 5000 } });

      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      await user.click(button);

      // resetGame should return status to MODE_SELECT
      const { useGameStore } = await import('../store/gameStore.js');
      const state = useGameStore.getState();
      expect(state.status).toBe(GameStatus.MODE_SELECT);
    });

    it('resets score to 0 when play again is clicked', async () => {
      const user = userEvent.setup();
      render(<GameOverScreen />, { initialState: { score: 25000 } });

      await user.click(screen.getByRole('button', { name: 'PLAY AGAIN' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().score).toBe(0);
    });

    it('preserves high score when play again is clicked', async () => {
      const user = userEvent.setup();
      render(<GameOverScreen />, { initialState: { score: 5000 }, highScore: 10000 });

      await user.click(screen.getByRole('button', { name: 'PLAY AGAIN' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().highScore).toBe(10000);
    });

    it('resets level to 1 when play again is clicked', async () => {
      const user = userEvent.setup();
      render(<GameOverScreen />, { initialState: { level: 7 } });

      await user.click(screen.getByRole('button', { name: 'PLAY AGAIN' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().level).toBe(1);
    });

    it('resets lives to 3 when play again is clicked', async () => {
      const user = userEvent.setup();
      render(<GameOverScreen />, { initialState: { lives: 0 } });

      await user.click(screen.getByRole('button', { name: 'PLAY AGAIN' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().lives).toBe(3);
    });
  });

  // ============================================
  // State Integration Tests
  // ============================================
  describe('State Integration', () => {
    it('updates displayed score when store changes', async () => {
      const { rerender } = render(<GameOverScreen />, { initialState: { score: 1000 } });
      expect(screen.getByText('1000')).toBeInTheDocument();

      act(() => {
        setGameStoreState({ score: 2000 });
      });
      rerender(<GameOverScreen />);
      expect(screen.getByText('2000')).toBeInTheDocument();
    });

    it('updates displayed level when store changes', async () => {
      const { rerender } = render(<GameOverScreen />, { initialState: { level: 2 } });
      const getLevelValue = () => screen.getByText('LEVEL REACHED').closest('.stat-row').querySelector('.stat-value');
      expect(getLevelValue()).toHaveTextContent('2');

      act(() => {
        setGameStoreState({ level: 3 });
      });
      rerender(<GameOverScreen />);
      expect(getLevelValue()).toHaveTextContent('3');
    });

    it('displays correct stats for game over at level 1', () => {
      render(<GameOverScreen />, {
        initialState: {
          status: GameStatus.GAME_OVER,
          score: 500,
          level: 1
        }
      });

      expect(screen.getByText('500')).toBeInTheDocument();
      const levelValue = screen.getByText('LEVEL REACHED').closest('.stat-row').querySelector('.stat-value');
      expect(levelValue).toHaveTextContent('1');
    });

    it('displays correct stats for game over at high level', () => {
      render(<GameOverScreen />, {
        initialState: {
          status: GameStatus.GAME_OVER,
          score: 150000,
          level: 15
        }
      });

      expect(screen.getByText('150000')).toBeInTheDocument();
      const levelValue = screen.getByText('LEVEL REACHED').closest('.stat-row').querySelector('.stat-value');
      expect(levelValue).toHaveTextContent('15');
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('play again button is focusable', () => {
      render(<GameOverScreen />);
      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('play again button can be activated with Enter key', async () => {
      const user = userEvent.setup();
      render(<GameOverScreen />, { initialState: { status: GameStatus.GAME_OVER } });

      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      button.focus();
      await user.keyboard('{Enter}');

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().status).toBe(GameStatus.MODE_SELECT);
    });

    it('play again button can be activated with Space key', async () => {
      const user = userEvent.setup();
      render(<GameOverScreen />, { initialState: { status: GameStatus.GAME_OVER } });

      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      button.focus();
      await user.keyboard(' ');

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().status).toBe(GameStatus.MODE_SELECT);
    });

    it('has semantic heading for game over title', () => {
      render(<GameOverScreen />);
      const heading = screen.getByRole('heading', { name: 'GAME OVER' });
      expect(heading).toBeInTheDocument();
    });
  });

  // ============================================
  // Component Structure Tests
  // ============================================
  describe('Component Structure', () => {
    it('has correct DOM hierarchy for final stats', () => {
      render(<GameOverScreen />);
      const container = screen.getByText('GAME OVER').parentElement;
      const finalStats = container.querySelector('.final-stats');
      expect(finalStats).toBeInTheDocument();
      expect(finalStats.querySelectorAll('.stat-row')).toHaveLength(2);
    });

    it('score stat row comes before level stat row', () => {
      render(<GameOverScreen />, { initialState: { score: 1234, level: 5 } });
      const statRows = document.querySelectorAll('.stat-row');
      expect(statRows[0]).toHaveTextContent('FINAL SCORE');
      expect(statRows[1]).toHaveTextContent('LEVEL REACHED');
    });

    it('button comes after final stats', () => {
      render(<GameOverScreen />);
      const container = screen.getByText('GAME OVER').parentElement;
      const children = Array.from(container.children);
      const statsIndex = children.findIndex(el => el.classList.contains('final-stats'));
      const buttonIndex = children.findIndex(el => el.classList.contains('restart-button'));
      expect(buttonIndex).toBeGreaterThan(statsIndex);
    });

    it('hint comes after button', () => {
      render(<GameOverScreen />);
      const container = screen.getByText('GAME OVER').parentElement;
      const children = Array.from(container.children);
      const buttonIndex = children.findIndex(el => el.classList.contains('restart-button'));
      const hintIndex = children.findIndex(el => el.classList.contains('game-over-hint'));
      expect(hintIndex).toBeGreaterThan(buttonIndex);
    });
  });
});
