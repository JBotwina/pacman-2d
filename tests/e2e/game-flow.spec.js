import { test, expect } from '@playwright/test';

/**
 * E2E tests for game flow.
 * Tests starting, pausing, resuming, and restarting the game.
 */

test.describe('Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for mode select to be ready
    await expect(page.getByRole('heading', { name: 'SELECT MODE' })).toBeVisible();
  });

  test.describe('Starting the Game', () => {
    test('can start single player game via button click', async ({ page }) => {
      // Select 1P mode
      await page.getByRole('button', { name: /1 PLAYER/i }).click();
      await expect(page.getByText('1 PLAYER MODE')).toBeVisible();

      // Click START GAME
      await page.getByRole('button', { name: 'START GAME' }).click();

      // Game should be running - mode overlay should be hidden
      await expect(page.locator('.mode-indicator')).not.toBeVisible({ timeout: 10000 });
    });

    test('can start two player game via button click', async ({ page }) => {
      // Select 2P mode
      await page.getByRole('button', { name: /2 PLAYERS/i }).click();
      await expect(page.getByText('2 PLAYER MODE')).toBeVisible();

      // Click START GAME
      await page.getByRole('button', { name: 'START GAME' }).click();

      // Game should be running - start screen should be hidden
      await expect(page.locator('.start-screen')).not.toBeVisible({ timeout: 10000 });
    });

    test('can start game via Enter key', async ({ page }) => {
      // Select mode first
      await page.getByRole('button', { name: /1 PLAYER/i }).click();
      await expect(page.getByText('1 PLAYER MODE')).toBeVisible();

      // Press Enter to start
      await page.keyboard.press('Enter');

      // Game should be running
      await expect(page.locator('.start-screen')).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Pause and Resume', () => {
    test.beforeEach(async ({ page }) => {
      // Start a game first
      await page.getByRole('button', { name: /1 PLAYER/i }).click();
      await page.getByRole('button', { name: 'START GAME' }).click();
      // Wait for game to be running
      await expect(page.locator('.start-screen')).not.toBeVisible({ timeout: 10000 });
    });

    test('can pause game with Escape key', async ({ page }) => {
      await page.keyboard.press('Escape');

      // Should show pause overlay
      await expect(page.getByText('PAUSED')).toBeVisible();
    });

    test('pause overlay shows resume button', async ({ page }) => {
      await page.keyboard.press('Escape');

      await expect(page.getByRole('button', { name: /RESUME/i })).toBeVisible();
    });

    test('can resume game by clicking resume button', async ({ page }) => {
      await page.keyboard.press('Escape');
      await expect(page.getByText('PAUSED')).toBeVisible();

      await page.getByRole('button', { name: /RESUME/i }).click();

      // Pause overlay should be hidden
      await expect(page.getByText('PAUSED')).not.toBeVisible();
    });

    test('can resume game with Escape key', async ({ page }) => {
      await page.keyboard.press('Escape');
      await expect(page.getByText('PAUSED')).toBeVisible();

      await page.keyboard.press('Escape');

      // Pause overlay should be hidden
      await expect(page.getByText('PAUSED')).not.toBeVisible();
    });

    test('pause overlay shows quit option', async ({ page }) => {
      await page.keyboard.press('Escape');

      await expect(page.getByRole('button', { name: /QUIT/i })).toBeVisible();
    });

    test('can quit game from pause menu', async ({ page }) => {
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /QUIT/i }).click();

      // Should return to mode select
      await expect(page.getByRole('heading', { name: 'SELECT MODE' })).toBeVisible();
    });
  });

  test.describe('Full Game Flow', () => {
    test('complete flow: mode select -> start -> pause -> resume -> quit', async ({ page }) => {
      // Mode select
      await page.getByRole('button', { name: /1 PLAYER/i }).click();
      await expect(page.getByText('1 PLAYER MODE')).toBeVisible();

      // Start game
      await page.getByRole('button', { name: 'START GAME' }).click();
      await expect(page.locator('.start-screen')).not.toBeVisible({ timeout: 10000 });

      // Pause
      await page.keyboard.press('Escape');
      await expect(page.getByText('PAUSED')).toBeVisible();

      // Resume
      await page.getByRole('button', { name: /RESUME/i }).click();
      await expect(page.getByText('PAUSED')).not.toBeVisible();

      // Pause again and quit
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /QUIT/i }).click();

      // Back to mode select
      await expect(page.getByRole('heading', { name: 'SELECT MODE' })).toBeVisible();
    });

    test('can start a new game after quitting', async ({ page }) => {
      // Start and quit a game
      await page.getByRole('button', { name: /1 PLAYER/i }).click();
      await page.getByRole('button', { name: 'START GAME' }).click();
      await expect(page.locator('.start-screen')).not.toBeVisible({ timeout: 10000 });

      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /QUIT/i }).click();

      // Start a new game
      await page.getByRole('button', { name: /2 PLAYERS/i }).click();
      await expect(page.getByText('2 PLAYER MODE')).toBeVisible();

      await page.getByRole('button', { name: 'START GAME' }).click();
      await expect(page.locator('.start-screen')).not.toBeVisible({ timeout: 10000 });
    });
  });
});
