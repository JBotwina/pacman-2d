import { test, expect } from '@playwright/test';

/**
 * E2E tests for mode selection screen.
 * Tests the initial game state and mode selection functionality.
 */

test.describe('Mode Selection Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays PAC-MAN title on load', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'PAC-MAN' })).toBeVisible();
  });

  test('displays SELECT MODE header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'SELECT MODE' })).toBeVisible();
  });

  test('displays 1 PLAYER button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /1 PLAYER/i })).toBeVisible();
  });

  test('displays 2 PLAYERS button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /2 PLAYERS/i })).toBeVisible();
  });

  test('displays keyboard hint', async ({ page }) => {
    await expect(page.getByText('Press 1 or 2 to select mode')).toBeVisible();
  });

  test('clicking 1 PLAYER navigates to start screen', async ({ page }) => {
    await page.getByRole('button', { name: /1 PLAYER/i }).click();

    // Should see start screen with 1 PLAYER MODE
    await expect(page.getByText('1 PLAYER MODE')).toBeVisible();
  });

  test('clicking 2 PLAYERS navigates to start screen', async ({ page }) => {
    await page.getByRole('button', { name: /2 PLAYERS/i }).click();

    // Should see start screen with 2 PLAYER MODE
    await expect(page.getByText('2 PLAYER MODE')).toBeVisible();
  });

  test('pressing 1 selects single player mode', async ({ page }) => {
    // Wait for app to be ready
    await expect(page.getByRole('heading', { name: 'SELECT MODE' })).toBeVisible();
    await page.keyboard.press('1');

    // Should see start screen with 1 PLAYER MODE
    await expect(page.getByText('1 PLAYER MODE')).toBeVisible({ timeout: 10000 });
  });

  test('pressing 2 selects two player mode', async ({ page }) => {
    // Wait for app to be ready
    await expect(page.getByRole('heading', { name: 'SELECT MODE' })).toBeVisible();
    await page.keyboard.press('2');

    // Should see start screen with 2 PLAYER MODE
    await expect(page.getByText('2 PLAYER MODE')).toBeVisible({ timeout: 10000 });
  });

  test('1P mode shows single player controls', async ({ page }) => {
    await page.getByRole('button', { name: /1 PLAYER/i }).click();

    // Should show controls section
    await expect(page.getByText('CONTROLS')).toBeVisible();

    // Should show ESDF keys
    await expect(page.getByText('E').first()).toBeVisible();

    // Should NOT show PLAYER 1 label (only shown in 2P)
    await expect(page.getByText('PLAYER 1')).not.toBeVisible();
  });

  test('2P mode shows both player controls', async ({ page }) => {
    await page.getByRole('button', { name: /2 PLAYERS/i }).click();

    // Should show player labels
    await expect(page.getByText('PLAYER 1')).toBeVisible();
    await expect(page.getByText('PLAYER 2')).toBeVisible();
  });

  test('start screen shows START GAME button', async ({ page }) => {
    await page.getByRole('button', { name: /1 PLAYER/i }).click();

    await expect(page.getByRole('button', { name: 'START GAME' })).toBeVisible();
  });

  test('start screen shows start hint', async ({ page }) => {
    await page.getByRole('button', { name: /1 PLAYER/i }).click();

    await expect(page.getByText('Press ENTER or click to start')).toBeVisible();
  });
});
