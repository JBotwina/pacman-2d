/**
 * Tests for StartScreen component.
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, userEvent, resetGameStore } from '../test/test-utils.jsx';
import StartScreen from './StartScreen.jsx';
import { useGameStore, GameStatus, GameMode } from '../store/gameStore.js';

describe('StartScreen', () => {
  beforeEach(() => {
    resetGameStore();
  });

  describe('Single Player Mode', () => {
    const singlePlayerInitialState = { gameMode: GameMode.SINGLE_PLAYER, status: GameStatus.IDLE };

    it('displays PAC-MAN title', () => {
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(screen.getByText('PAC-MAN')).toBeInTheDocument();
    });

    it('displays 1 PLAYER MODE indicator', () => {
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(screen.getByText('1 PLAYER MODE')).toBeInTheDocument();
    });

    it('displays controls header', () => {
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(screen.getByText('CONTROLS')).toBeInTheDocument();
    });

    it('displays player 1 controls (ESDF)', () => {
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(screen.getByText('E')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
    });

    it('displays control descriptions', () => {
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(screen.getAllByText('Up').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Left').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Down').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Right').length).toBeGreaterThanOrEqual(1);
    });

    it('does not display PLAYER 1 label in single player mode', () => {
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(screen.queryByText('PLAYER 1')).not.toBeInTheDocument();
    });

    it('does not display player 2 controls in single player mode', () => {
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(screen.queryByText('PLAYER 2')).not.toBeInTheDocument();
      expect(screen.queryByText('I')).not.toBeInTheDocument();
      expect(screen.queryByText('J')).not.toBeInTheDocument();
      expect(screen.queryByText('K')).not.toBeInTheDocument();
      expect(screen.queryByText('L')).not.toBeInTheDocument();
    });

    it('displays ESC pause control', () => {
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(screen.getByText('ESC')).toBeInTheDocument();
      expect(screen.getByText('Pause Game')).toBeInTheDocument();
    });

    it('displays START GAME button', () => {
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(screen.getByRole('button', { name: 'START GAME' })).toBeInTheDocument();
    });

    it('displays start hint', () => {
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(screen.getByText('Press ENTER or click to start')).toBeInTheDocument();
    });

    it('calls startGame when START GAME button is clicked', async () => {
      const user = userEvent.setup();
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      const button = screen.getByRole('button', { name: 'START GAME' });
      await user.click(button);

      expect(useGameStore.getState().status).toBe(GameStatus.RUNNING);
    });
  });

  describe('Two Player Mode', () => {
    const twoPlayerInitialState = { gameMode: GameMode.TWO_PLAYER, status: GameStatus.IDLE };

    it('displays 2 PLAYER MODE indicator', () => {
      render(<StartScreen />, { initialState: twoPlayerInitialState });

      expect(screen.getByText('2 PLAYER MODE')).toBeInTheDocument();
    });

    it('displays PLAYER 1 label', () => {
      render(<StartScreen />, { initialState: twoPlayerInitialState });

      expect(screen.getByText('PLAYER 1')).toBeInTheDocument();
    });

    it('displays PLAYER 2 label', () => {
      render(<StartScreen />, { initialState: twoPlayerInitialState });

      expect(screen.getByText('PLAYER 2')).toBeInTheDocument();
    });

    it('displays player 2 controls (IJKL)', () => {
      render(<StartScreen />, { initialState: twoPlayerInitialState });

      expect(screen.getByText('I')).toBeInTheDocument();
      expect(screen.getByText('J')).toBeInTheDocument();
      expect(screen.getByText('K')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();
    });

    it('displays control descriptions for both players', () => {
      render(<StartScreen />, { initialState: twoPlayerInitialState });

      // Should have 2 sets of Up/Left/Down/Right
      expect(screen.getAllByText('Up').length).toBe(2);
      expect(screen.getAllByText('Left').length).toBe(2);
      expect(screen.getAllByText('Down').length).toBe(2);
      expect(screen.getAllByText('Right').length).toBe(2);
    });

    it('calls startGame when START GAME button is clicked', async () => {
      const user = userEvent.setup();
      render(<StartScreen />, { initialState: twoPlayerInitialState });

      await user.click(screen.getByRole('button', { name: 'START GAME' }));

      expect(useGameStore.getState().status).toBe(GameStatus.RUNNING);
    });
  });

  describe('CSS Classes', () => {
    const singlePlayerInitialState = { gameMode: GameMode.SINGLE_PLAYER, status: GameStatus.IDLE };

    it('applies menu-overlay class', () => {
      const { container } = render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(container.querySelector('.menu-overlay')).toBeInTheDocument();
    });

    it('applies start-screen class', () => {
      const { container } = render(<StartScreen />, { initialState: singlePlayerInitialState });

      expect(container.querySelector('.start-screen')).toBeInTheDocument();
    });

    it('applies start-button class to button', () => {
      render(<StartScreen />, { initialState: singlePlayerInitialState });

      const button = screen.getByRole('button', { name: 'START GAME' });
      expect(button).toHaveClass('start-button');
    });
  });
});
