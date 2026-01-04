/**
 * Tests for GameCompleteScreen component.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent, resetGameStore, setGameStoreState, act } from '../test/test-utils.jsx';
import GameCompleteScreen from './GameCompleteScreen.jsx';
import { GameStatus } from '../store/gameStore.js';

describe('GameCompleteScreen', () => {
  beforeEach(() => {
    resetGameStore();
  });

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('renders the congratulations title', () => {
      render(<GameCompleteScreen />);
      expect(screen.getByText('CONGRATULATIONS!')).toBeInTheDocument();
    });

    it('renders the game complete subtitle', () => {
      render(<GameCompleteScreen />);
      expect(screen.getByText('GAME COMPLETE')).toBeInTheDocument();
    });

    it('renders with menu-overlay class', () => {
      render(<GameCompleteScreen />);
      const container = screen.getByText('CONGRATULATIONS!').closest('.menu-overlay');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('game-complete-screen');
    });

    it('renders the congratulations title with correct class', () => {
      render(<GameCompleteScreen />);
      const title = screen.getByText('CONGRATULATIONS!');
      expect(title).toHaveClass('game-complete-title');
    });

    it('renders the game complete subtitle with correct class', () => {
      render(<GameCompleteScreen />);
      const subtitle = screen.getByText('GAME COMPLETE');
      expect(subtitle).toHaveClass('game-complete-subtitle');
    });

    it('renders the final stats section', () => {
      render(<GameCompleteScreen />);
      expect(screen.getByText('FINAL SCORE')).toBeInTheDocument();
      expect(screen.getByText('HIGH SCORE')).toBeInTheDocument();
    });

    it('renders the play again button', () => {
      render(<GameCompleteScreen />);
      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('menu-button', 'play-again-button');
    });

    it('renders the keyboard hint', () => {
      render(<GameCompleteScreen />);
      expect(screen.getByText('Press ENTER to play again')).toBeInTheDocument();
    });

    it('renders keyboard hint with correct class', () => {
      render(<GameCompleteScreen />);
      const hint = screen.getByText('Press ENTER to play again');
      expect(hint).toHaveClass('game-complete-hint');
    });
  });

  // ============================================
  // Score Display Tests
  // ============================================
  describe('Score Display', () => {
    it('displays score of 0 when no points scored', () => {
      render(<GameCompleteScreen />, { initialState: { score: 0 } });
      const scoreRow = screen.getByText('FINAL SCORE').closest('.stat-row');
      expect(scoreRow.querySelector('.score-value')).toHaveTextContent('0');
    });

    it('displays the current score from store', () => {
      render(<GameCompleteScreen />, { initialState: { score: 12500 } });
      const scoreRow = screen.getByText('FINAL SCORE').closest('.stat-row');
      expect(scoreRow.querySelector('.score-value')).toHaveTextContent('12500');
    });

    it('displays large scores correctly', () => {
      render(<GameCompleteScreen />, { initialState: { score: 999999 } });
      const scoreRow = screen.getByText('FINAL SCORE').closest('.stat-row');
      expect(scoreRow.querySelector('.score-value')).toHaveTextContent('999999');
    });

    it('score value has correct CSS class', () => {
      render(<GameCompleteScreen />, { initialState: { score: 5000 } });
      const scoreRow = screen.getByText('FINAL SCORE').closest('.stat-row');
      const scoreValue = scoreRow.querySelector('.stat-value');
      expect(scoreValue).toHaveClass('stat-value', 'score-value');
    });

    it('final score label has correct CSS class', () => {
      render(<GameCompleteScreen />);
      const label = screen.getByText('FINAL SCORE');
      expect(label).toHaveClass('stat-label');
    });
  });

  // ============================================
  // High Score Display Tests
  // ============================================
  describe('High Score Display', () => {
    it('displays high score of 0 when no high score', () => {
      render(<GameCompleteScreen />, { highScore: 0 });
      const highScoreRow = screen.getByText('HIGH SCORE').closest('.stat-row');
      expect(highScoreRow.querySelector('.high-score-value')).toHaveTextContent('0');
    });

    it('displays the current high score from store', () => {
      render(<GameCompleteScreen />, { highScore: 50000 });
      const highScoreRow = screen.getByText('HIGH SCORE').closest('.stat-row');
      expect(highScoreRow.querySelector('.high-score-value')).toHaveTextContent('50000');
    });

    it('displays large high scores correctly', () => {
      render(<GameCompleteScreen />, { highScore: 999999 });
      const highScoreRow = screen.getByText('HIGH SCORE').closest('.stat-row');
      expect(highScoreRow.querySelector('.high-score-value')).toHaveTextContent('999999');
    });

    it('high score value has correct CSS class', () => {
      render(<GameCompleteScreen />, { highScore: 10000 });
      const highScoreRow = screen.getByText('HIGH SCORE').closest('.stat-row');
      const highScoreValue = highScoreRow.querySelector('.stat-value');
      expect(highScoreValue).toHaveClass('stat-value', 'high-score-value');
    });

    it('high score label has correct CSS class', () => {
      render(<GameCompleteScreen />);
      const label = screen.getByText('HIGH SCORE');
      expect(label).toHaveClass('stat-label');
    });
  });

  // ============================================
  // Play Again Button Interaction Tests
  // ============================================
  describe('Play Again Button', () => {
    it('calls resetGame when clicked', async () => {
      const user = userEvent.setup();
      render(<GameCompleteScreen />, { initialState: { score: 5000 } });

      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      await user.click(button);

      // resetGame should return status to MODE_SELECT
      const { useGameStore } = await import('../store/gameStore.js');
      const state = useGameStore.getState();
      expect(state.status).toBe(GameStatus.MODE_SELECT);
    });

    it('resets score to 0 when play again is clicked', async () => {
      const user = userEvent.setup();
      render(<GameCompleteScreen />, { initialState: { score: 25000 } });

      await user.click(screen.getByRole('button', { name: 'PLAY AGAIN' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().score).toBe(0);
    });

    it('preserves high score when play again is clicked', async () => {
      const user = userEvent.setup();
      render(<GameCompleteScreen />, { initialState: { score: 5000 }, highScore: 10000 });

      await user.click(screen.getByRole('button', { name: 'PLAY AGAIN' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().highScore).toBe(10000);
    });

    it('resets level to 1 when play again is clicked', async () => {
      const user = userEvent.setup();
      render(<GameCompleteScreen />, { initialState: { level: 10 } });

      await user.click(screen.getByRole('button', { name: 'PLAY AGAIN' }));

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().level).toBe(1);
    });

    it('resets lives to 3 when play again is clicked', async () => {
      const user = userEvent.setup();
      render(<GameCompleteScreen />, { initialState: { lives: 0 } });

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
      const { rerender } = render(<GameCompleteScreen />, { initialState: { score: 1000 } });
      const getScoreValue = () => screen.getByText('FINAL SCORE').closest('.stat-row').querySelector('.score-value');
      expect(getScoreValue()).toHaveTextContent('1000');

      act(() => {
        setGameStoreState({ score: 2000 });
      });
      rerender(<GameCompleteScreen />);
      expect(getScoreValue()).toHaveTextContent('2000');
    });

    it('updates displayed high score when store changes', async () => {
      const { rerender } = render(<GameCompleteScreen />, { highScore: 5000 });
      const getHighScoreValue = () => screen.getByText('HIGH SCORE').closest('.stat-row').querySelector('.high-score-value');
      expect(getHighScoreValue()).toHaveTextContent('5000');

      act(() => {
        setGameStoreState({ highScore: 10000 });
      });
      rerender(<GameCompleteScreen />);
      expect(getHighScoreValue()).toHaveTextContent('10000');
    });

    it('displays correct stats for game complete', () => {
      render(<GameCompleteScreen />, {
        initialState: {
          score: 150000
        },
        highScore: 200000
      });

      const scoreRow = screen.getByText('FINAL SCORE').closest('.stat-row');
      expect(scoreRow.querySelector('.score-value')).toHaveTextContent('150000');
      const highScoreRow = screen.getByText('HIGH SCORE').closest('.stat-row');
      expect(highScoreRow.querySelector('.high-score-value')).toHaveTextContent('200000');
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('play again button is focusable', () => {
      render(<GameCompleteScreen />);
      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('play again button can be activated with Enter key', async () => {
      const user = userEvent.setup();
      render(<GameCompleteScreen />);

      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      button.focus();
      await user.keyboard('{Enter}');

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().status).toBe(GameStatus.MODE_SELECT);
    });

    it('play again button can be activated with Space key', async () => {
      const user = userEvent.setup();
      render(<GameCompleteScreen />);

      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      button.focus();
      await user.keyboard(' ');

      const { useGameStore } = await import('../store/gameStore.js');
      expect(useGameStore.getState().status).toBe(GameStatus.MODE_SELECT);
    });

    it('has semantic heading for congratulations title', () => {
      render(<GameCompleteScreen />);
      const heading = screen.getByRole('heading', { name: 'CONGRATULATIONS!' });
      expect(heading).toBeInTheDocument();
    });

    it('has semantic heading for game complete subtitle', () => {
      render(<GameCompleteScreen />);
      const heading = screen.getByRole('heading', { name: 'GAME COMPLETE' });
      expect(heading).toBeInTheDocument();
    });
  });

  // ============================================
  // Component Structure Tests
  // ============================================
  describe('Component Structure', () => {
    it('has correct DOM hierarchy for final stats', () => {
      render(<GameCompleteScreen />);
      const container = screen.getByText('CONGRATULATIONS!').parentElement;
      const finalStats = container.querySelector('.final-stats');
      expect(finalStats).toBeInTheDocument();
      expect(finalStats.querySelectorAll('.stat-row')).toHaveLength(2);
    });

    it('score stat row comes before high score stat row', () => {
      render(<GameCompleteScreen />, { initialState: { score: 1234 }, highScore: 5000 });
      const statRows = document.querySelectorAll('.stat-row');
      expect(statRows[0]).toHaveTextContent('FINAL SCORE');
      expect(statRows[1]).toHaveTextContent('HIGH SCORE');
    });

    it('button comes after final stats', () => {
      render(<GameCompleteScreen />);
      const container = screen.getByText('CONGRATULATIONS!').parentElement;
      const children = Array.from(container.children);
      const statsIndex = children.findIndex(el => el.classList.contains('final-stats'));
      const buttonIndex = children.findIndex(el => el.classList.contains('play-again-button'));
      expect(buttonIndex).toBeGreaterThan(statsIndex);
    });

    it('hint comes after button', () => {
      render(<GameCompleteScreen />);
      const container = screen.getByText('CONGRATULATIONS!').parentElement;
      const children = Array.from(container.children);
      const buttonIndex = children.findIndex(el => el.classList.contains('play-again-button'));
      const hintIndex = children.findIndex(el => el.classList.contains('game-complete-hint'));
      expect(hintIndex).toBeGreaterThan(buttonIndex);
    });

    it('congratulations title comes before game complete subtitle', () => {
      render(<GameCompleteScreen />);
      const container = screen.getByText('CONGRATULATIONS!').parentElement;
      const children = Array.from(container.children);
      const titleIndex = children.findIndex(el => el.classList.contains('game-complete-title'));
      const subtitleIndex = children.findIndex(el => el.classList.contains('game-complete-subtitle'));
      expect(subtitleIndex).toBeGreaterThan(titleIndex);
    });
  });
});
