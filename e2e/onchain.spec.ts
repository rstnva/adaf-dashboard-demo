import { test, expect } from '@playwright/test';

const RESPONSES: Record<string, unknown> = {
  '7': [
    {
      protocol: 'Lido',
      tvl: 100_000_000,
      change7d: 2.5,
      change30d: 6.1,
      category: 'liquid-staking',
      chain: 'Ethereum',
    },
  ],
  '14': [
    {
      protocol: 'Aave',
      tvl: 75_000_000,
      change7d: -1.2,
      change30d: 3.4,
      category: 'lending',
      chain: 'Polygon',
    },
  ],
  '30': [
    {
      protocol: 'MakerDAO',
      tvl: 125_000_000,
      change7d: 0.4,
      change30d: 4.8,
      category: 'cdp',
      chain: 'Ethereum',
    },
  ],
};

test.describe('On-Chain dashboard UX', () => {
  test.use({ baseURL: 'http://localhost:3000' });

  test('persists widget layout and reuses cached heatmap ranges', async ({ page }) => {
    const requestCounter: Record<string, number> = { '7': 0, '14': 0, '30': 0 };

    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.route('**/api/read/onchain/tvl-heatmap**', async route => {
      const url = new URL(route.request().url());
      const days = url.searchParams.get('days') ?? '14';
      requestCounter[days] = (requestCounter[days] ?? 0) + 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(RESPONSES[days] ?? []),
      });
    });

    await page.goto('/onchain');

    await expect(page.getByRole('heading', { name: 'TVL Heatmap' })).toBeVisible();

    const grid = page.locator('[data-onchain-order]');
    await expect.poll(async () => grid.getAttribute('data-onchain-order')).not.toBeNull();

    await expect.poll(() => requestCounter['7']).toBeGreaterThan(0);
    await expect.poll(() => requestCounter['14']).toBeGreaterThan(0);
    await expect.poll(() => requestCounter['30']).toBeGreaterThan(0);

    const baselineCounts = { ...requestCounter };

    const orderBefore = await grid.getAttribute('data-onchain-order');
    expect(orderBefore).not.toBeNull();

    const button30 = page.getByRole('button', { name: '30d' });
    await button30.hover();
    await button30.click();
    await expect(page.getByText('Protocol value distribution (30d)')).toBeVisible();
    await page.waitForTimeout(120);
    expect(requestCounter['30']).toBe(baselineCounts['30']);

    const button7 = page.getByRole('button', { name: '7d' });
    await button7.hover();
    await button7.click();
    await expect(page.getByText('Protocol value distribution (7d)')).toBeVisible();
    await page.waitForTimeout(120);
    expect(requestCounter['7']).toBe(baselineCounts['7']);

    const button14 = page.getByRole('button', { name: '14d' });
    await button14.hover();
    await button14.click();
    await expect(page.getByText('Protocol value distribution (14d)')).toBeVisible();
    await page.waitForTimeout(120);
    expect(requestCounter['14']).toBe(baselineCounts['14']);

    const heatmapCard = page.locator('[data-widget-key="tvl-heatmap"]');
    const stablecoinCard = page.locator('[data-widget-key="stablecoin-flows"]');

    await expect(heatmapCard).toBeVisible();
    await expect(stablecoinCard).toBeVisible();

    const heatmapBox = await heatmapCard.boundingBox();
    const stablecoinBox = await stablecoinCard.boundingBox();
    if (!heatmapBox || !stablecoinBox) {
      throw new Error('Unable to determine widget positions for drag and drop');
    }

    await page.mouse.move(stablecoinBox.x + stablecoinBox.width / 2, stablecoinBox.y + 10);
    await page.mouse.down();
    await page.mouse.move(heatmapBox.x + heatmapBox.width / 2, heatmapBox.y + 10, { steps: 12 });
    await page.mouse.up();

    await expect.poll(async () => grid.getAttribute('data-onchain-order')).not.toEqual(orderBefore);
    const orderAfterDrag = await grid.getAttribute('data-onchain-order');
    expect(orderAfterDrag).not.toBeNull();

    const storedLayout = await page.evaluate(() => localStorage.getItem('onchain-sleeve-layout-v1'));
    expect(storedLayout).toBe(orderAfterDrag);

    await page.reload();

    await expect.poll(async () => page.locator('[data-onchain-order]').getAttribute('data-onchain-order')).toEqual(orderAfterDrag);
  });
});
