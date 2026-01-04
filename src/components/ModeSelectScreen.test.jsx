/**
 * Tests for ModeSelectScreen component.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, userEvent, resetGameStore, getGameStoreState } from '../test/test-utils.jsx';
import { GameStatus, GameMode } from '../store/gameStore.js';
import ModeSelectScreen from './ModeSelectScreen.jsx';

describe('ModeSelectScreen', () => {
  beforeEach(() => {
    resetGameStore();
  });

  // ============================================
  // Rendering Tests
  // ============================================
  describe('Rendering', () => {
    it('renders the game title', () => {
      render(<ModeSelectScreen />);

      expect(screen.getByRole('heading', { name: /PAC-MAN/i })).toBeInTheDocument();
    });

    it('renders the mode selection header', () => {
      render(<ModeSelectScreen />);

      expect(screen.getByRole('heading', { level: 2, name: /SELECT MODE/i })).toBeInTheDocument();
    });

    it('renders 1 PLAYER button', () => {
      render(<ModeSelectScreen />);

      expect(screen.getByRole('button', { name: /1 PLAYER/i })).toBeInTheDocument();
    });

    it('renders 2 PLAYERS button', () => {
      render(<ModeSelectScreen />);

      expect(screen.getByRole('button', { name: /2 PLAYERS/i })).toBeInTheDocument();
    });

    it('renders 1P mode description', () => {
      render(<ModeSelectScreen />);

      expect(screen.getByText(/Classic solo adventure/i)).toBeInTheDocument();
    });

    it('renders 2P mode description', () => {
      render(<ModeSelectScreen />);

      expect(screen.getByText(/Co-op with a friend/i)).toBeInTheDocument();
    });

    it('renders keyboard hint', () => {
      render(<ModeSelectScreen />);

      expect(screen.getByText(/Press 1 or 2 to select mode/i)).toBeInTheDocument();
    });

    it('renders single player icon', () => {
      render(<ModeSelectScreen />);

      const button = screen.getByRole('button', { name: /1 PLAYER/i });
      expect(button).toHaveTextContent('🟡');
    });

    it('renders two player icon', () => {
      render(<ModeSelectScreen />);

      const button = screen.getByRole('button', { name: /2 PLAYERS/i });
      expect(button).toHaveTextContent('🟡🔵');
    });
  });

  // ============================================
  // CSS Classes Tests
  // ============================================
  describe('CSS Classes', () => {
    it('has menu-overlay class on container', () => {
      const { container } = render(<ModeSelectScreen />);

      expect(container.querySelector('.menu-overlay')).toBeInTheDocument();
    });

    it('has mode-select-screen class on container', () => {
      const { container } = render(<ModeSelectScreen />);

      expect(container.querySelector('.mode-select-screen')).toBeInTheDocument();
    });

    it('applies mode-1p class to 1P button', () => {
      const { container } = render(<ModeSelectScreen />);

      expect(container.querySelector('.mode-1p')).toBeInTheDocument();
    });

    it('applies mode-2p class to 2P button', () => {
      const { container } = render(<ModeSelectScreen />);

      expect(container.querySelector('.mode-2p')).toBeInTheDocument();
    });
  });

  // ============================================
  // Interaction Tests
  // ============================================
  describe('Interactions', () => {
    it('calls setGameMode with 1P when clicking 1 PLAYER button', async () => {
      const user = userEvent.setup();
      render(<ModeSelectScreen />);

      const button = screen.getByRole('button', { name: /1 PLAYER/i });
      await user.click(button);

      const state = getGameStoreState();
      expect(state.gameMode).toBe(GameMode.SINGLE_PLAYER);
    });

    it('calls setGameMode with 2P when clicking 2 PLAYERS button', async () => {
      const user = userEvent.setup();
      render(<ModeSelectScreen />);

      const button = screen.getByRole('button', { name: /2 PLAYERS/i });
      await user.click(button);

      const state = getGameStoreState();
      expect(state.gameMode).toBe(GameMode.TWO_PLAYER);
    });

    it('transitions status from MODE_SELECT to IDLE when 1P selected', async () => {
      const user = userEvent.setup();
      render(<ModeSelectScreen />);

      // Verify initial state
      expect(getGameStoreState().status).toBe(GameStatus.MODE_SELECT);

      const button = screen.getByRole('button', { name: /1 PLAYER/i });
      await user.click(button);

      expect(getGameStoreState().status).toBe(GameStatus.IDLE);
    });

    it('transitions status from MODE_SELECT to IDLE when 2P selected', async () => {
      const user = userEvent.setup();
      render(<ModeSelectScreen />);

      // Verify initial state
      expect(getGameStoreState().status).toBe(GameStatus.MODE_SELECT);

      const button = screen.getByRole('button', { name: /2 PLAYERS/i });
      await user.click(button);

      expect(getGameStoreState().status).toBe(GameStatus.IDLE);
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================
  describe('Accessibility', () => {
    it('buttons are focusable', () => {
      render(<ModeSelectScreen />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('buttons can be activated with keyboard', async () => {
      const user = userEvent.setup();
      render(<ModeSelectScreen />);

      const button = screen.getByRole('button', { name: /1 PLAYER/i });
      button.focus();
      await user.keyboard('{Enter}');

      expect(getGameStoreState().gameMode).toBe(GameMode.SINGLE_PLAYER);
    });

    it('buttons can be activated with space key', async () => {
      const user = userEvent.setup();
      render(<ModeSelectScreen />);

      const button = screen.getByRole('button', { name: /2 PLAYERS/i });
      button.focus();
      await user.keyboard(' ');

      expect(getGameStoreState().gameMode).toBe(GameMode.TWO_PLAYER);
    });
  });

  // ============================================
  // Structure Tests
  // ============================================
  describe('Structure', () => {
    it('renders exactly two mode buttons', () => {
      render(<ModeSelectScreen />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('renders headings in correct hierarchy', () => {
      render(<ModeSelectScreen />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });

      expect(h1).toHaveTextContent(/PAC-MAN/i);
      expect(h2).toHaveTextContent(/SELECT MODE/i);
    });
  });
});
