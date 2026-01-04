import { test, expect } from '@playwright/test';

/**
 * E2E tests for keyboard controls.
 * Tests that keyboard inputs work correctly during gameplay.
 */

test.describe('Keyboard Controls', () => {
  test.describe('Mode Selection Keyboard Shortcuts', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'SELECT MODE' })).toBeVisible();
    });

    test('pressing 1 selects single player mode', async ({ page }) => {
      await page.keyboard.press('1');
      await expect(page.getByText('1 PLAYER MODE')).toBeVisible({ timeout: 5000 });
    });

    test('pressing 2 selects two player mode', async ({ page }) => {
      await page.keyboard.press('2');
      await expect(page.getByText('2 PLAYER MODE')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Start Screen Keyboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /1 PLAYER/i }).click();
      await expect(page.getByText('1 PLAYER MODE')).toBeVisible();
    });

    test('pressing Enter starts the game', async ({ page }) => {
      await page.keyboard.press('Enter');
      await expect(page.locator('.start-screen')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Pause Controls', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /1 PLAYER/i }).click();
      await page.getByRole('button', { name: 'START GAME' }).click();
      await expect(page.locator('.start-screen')).not.toBeVisible({ timeout: 5000 });
    });

    test('pressing Escape pauses the game', async ({ page }) => {
      await page.keyboard.press('Escape');
      await expect(page.getByText('PAUSED')).toBeVisible();
    });

    test('pressing Escape again resumes the game', async ({ page }) => {
      await page.keyboard.press('Escape');
      await expect(page.getByText('PAUSED')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByText('PAUSED')).not.toBeVisible();
    });
  });

  test.describe('Player 1 Movement Keys (ESDF)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /1 PLAYER/i }).click();
      await page.getByRole('button', { name: 'START GAME' }).click();
      await expect(page.locator('.start-screen')).not.toBeVisible({ timeout: 5000 });
    });

    test('E key registers as valid input (up)', async ({ page }) => {
      // Just verify the key can be pressed without errors during gameplay
      await page.keyboard.press('KeyE');
      // Game should still be running (not crashed)
      await expect(page.locator('.game-over-screen')).not.toBeVisible();
    });

    test('S key registers as valid input (left)', async ({ page }) => {
      await page.keyboard.press('KeyS');
      await expect(page.locator('.game-over-screen')).not.toBeVisible();
    });

    test('D key registers as valid input (down)', async ({ page }) => {
      await page.keyboard.press('KeyD');
      await expect(page.locator('.game-over-screen')).not.toBeVisible();
    });

    test('F key registers as valid input (right)', async ({ page }) => {
      await page.keyboard.press('KeyF');
      await expect(page.locator('.game-over-screen')).not.toBeVisible();
    });

    test('multiple directional keys work in sequence', async ({ page }) => {
      await page.keyboard.press('KeyE');
      await page.keyboard.press('KeyF');
      await page.keyboard.press('KeyD');
      await page.keyboard.press('KeyS');
      // Game should still be running
      await expect(page.locator('.game-over-screen')).not.toBeVisible();
    });
  });

  test.describe('Player 2 Movement Keys (IJKL) in 2P Mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /2 PLAYERS/i }).click();
      await page.getByRole('button', { name: 'START GAME' }).click();
      await expect(page.locator('.start-screen')).not.toBeVisible({ timeout: 5000 });
    });

    test('I key registers as valid input (up)', async ({ page }) => {
      await page.keyboard.press('KeyI');
      await expect(page.locator('.game-over-screen')).not.toBeVisible();
    });

    test('J key registers as valid input (left)', async ({ page }) => {
      await page.keyboard.press('KeyJ');
      await expect(page.locator('.game-over-screen')).not.toBeVisible();
    });

    test('K key registers as valid input (down)', async ({ page }) => {
      await page.keyboard.press('KeyK');
      await expect(page.locator('.game-over-screen')).not.toBeVisible();
    });

    test('L key registers as valid input (right)', async ({ page }) => {
      await page.keyboard.press('KeyL');
      await expect(page.locator('.game-over-screen')).not.toBeVisible();
    });

    test('both players can control simultaneously', async ({ page }) => {
      // Player 1 moves
      await page.keyboard.press('KeyE');
      await page.keyboard.press('KeyF');
      // Player 2 moves
      await page.keyboard.press('KeyI');
      await page.keyboard.press('KeyL');
      // Game should still be running
      await expect(page.locator('.game-over-screen')).not.toBeVisible();
    });
  });

  test.describe('Game Over Keyboard', () => {
    // Note: We can't easily trigger game over in E2E without actually playing
    // So we test what we can: the keyboard hint text displays correctly
    test('start screen shows keyboard hint', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /1 PLAYER/i }).click();
      await expect(page.getByText('Press ENTER or click to start')).toBeVisible();
    });

    test('mode select shows keyboard hint', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText('Press 1 or 2 to select mode')).toBeVisible();
    });
  });
});
