import { test, expect } from '@playwright/test';
import { AuthPage } from './page/auth-page';

const TEST_USER = { username: 'Auth Test', email: 'auth.test@rp.com', password: 'password' };
const TEST_FURNITURE = { name: 'Furniture Upload' };
const TEST_BLUEPRINT = { name: 'New Blueprint' };

test.describe('Authentication', () => {
  test('Registration test', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.changePanel();

    await authPage.register(TEST_USER.username, TEST_USER.email, TEST_USER.password);

    await expect(page.getByText('Registered successfully!')).toBeVisible();
  });

  test('Login test', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();

    await authPage.login(TEST_USER.email, TEST_USER.password);

    await expect(page.getByText('Room Planner')).toBeVisible();
  });
});

test.describe('Feature test', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.goto();
    await authPage.login(TEST_USER.email, TEST_USER.password);
    await expect(page.getByText('Room Planner')).toBeVisible();
  });

  test('Logout test', async ({ page }) => {
    await page.getByText('LOGOUT').click();
    await expect(page.locator('#sign-in-title')).toBeVisible();
  });

  test('Add furniture test', async ({ page }) => {
    await page.getByText('NEW FURNITURE').click();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#file-input').click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles('playwright-test/test_object.glb');
    await page.locator('#furnitureName').fill(TEST_FURNITURE.name);
    await page.locator('#category-select').selectOption({ index: 1 });

    await page.getByText('submit').click();
    await expect(page.getByText('Successful upload!')).toBeVisible();

    await page.locator('#back-button').click();
    await page.getByText('Collection', { exact: true }).click();
    await expect(page.getByText(TEST_FURNITURE.name)).toBeVisible();
  });

  test('Create blueprint test', async ({ page }) => {
    page.once('dialog', async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });
    await page.getByText('New Blueprint').click();
    await expect(page.getByText('Room Editor')).toBeVisible();

    await page.locator('#blueprint-name').fill(TEST_BLUEPRINT.name);
    await page.locator('#save-blueprint').click();

    await page.locator('#back-button').click();
    await page.getByText('Designs', { exact: true }).click();
    await expect(page.getByText(TEST_BLUEPRINT.name)).toBeVisible();
  });
});
