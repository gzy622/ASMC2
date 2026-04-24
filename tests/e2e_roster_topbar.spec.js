import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'url';
import { join } from 'path';

const indexUrl = pathToFileURL(join(process.cwd(), 'index.html')).href;

test.describe('Roster topbar', () => {
    test('should use the compact topbar for roster actions and save changes', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('tracker_roster', JSON.stringify(['01 张三', '02 李四 #非英语']));
            localStorage.setItem('tracker_db', JSON.stringify([{
                id: 1,
                name: '英语作业',
                subject: '英语',
                records: {}
            }]));
        });
        await page.goto(indexUrl);
        await page.waitForFunction(() => typeof document.getElementById('btnMenu')?.onclick === 'function');

        await page.click('#btnMenu');
        await expect(page.locator('#menu')).toHaveClass(/show/);
        await page.click('button[act="studentOverview"]');

        const topbar = page.locator('.overview-edit-toolbar');
        const footer = page.locator('.modal-footer');
        const firstName = page.locator('.overview-card [data-r="name"]').first();

        await expect(topbar).toBeVisible();
        await expect(page.locator('.overview-edit-toolbar [data-act="add"]')).toBeVisible();
        await expect(page.locator('.overview-edit-toolbar [data-act="autonum"]')).toBeVisible();
        await expect(page.locator('.overview-edit-toolbar [data-act="sort-seat"]')).toBeVisible();
        await expect(page.locator('.overview-edit-toolbar [data-act="clean"]')).toBeVisible();
        await expect(page.locator('.overview-edit-toolbar [data-act="cancel"]')).toBeVisible();
        await expect(page.locator('.overview-edit-toolbar [data-act="save"]')).toBeVisible();
        await expect(footer).toHaveCSS('display', 'none');

        await firstName.fill('王五');
        await page.click('.overview-edit-toolbar [data-act="save"]');
        await expect(topbar).not.toBeVisible();

        const storedRoster = await page.evaluate(() => JSON.parse(localStorage.getItem('tracker_roster')));
        expect(storedRoster).toEqual(['01 王五', '02 李四 #非英语']);
    });
});
