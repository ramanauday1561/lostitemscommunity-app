import { test, expect } from '@playwright/test';

/**
 * The welcome picture is a square sized to the smaller of the width and height left for it, so it can
 * never run into the headline on short or small screens. No login needed.
 */
const SIZES: [number, number][] = [[320, 480], [360, 560], [375, 667], [390, 844], [430, 932], [412, 500], [700, 480]];

for (const [width, height] of SIZES) {
  test(`welcome picture does not overlap the text at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.getByText(/WELCOME TO LOST ITEMS COMMUNITY/i).first().waitFor({ timeout: 20000 });
    await page.waitForTimeout(500);

    const m = await page.evaluate(() => {
      const kicker = [...document.querySelectorAll('div,span')]
        .find((e) => e.children.length === 0 && /^WELCOME TO LOST ITEMS COMMUNITY$/i.test((e.textContent || '').trim()));
      const pics = [...document.querySelectorAll('img')].filter((i) => i.getBoundingClientRect().width > 60);
      const pic = pics[pics.length - 1];
      const k = kicker?.getBoundingClientRect();
      const p = pic?.getBoundingClientRect();
      return { kickerTop: k?.top ?? null, picTop: p?.top ?? null, picBottom: p?.bottom ?? null, picWidth: p?.width ?? null };
    });

    expect(m.kickerTop).not.toBeNull();
    if (m.picBottom !== null) {
      // The picture, when shown, sits wholly above the copy and wholly on screen.
      expect(m.picBottom).toBeLessThanOrEqual(m.kickerTop! + 0.5);
      expect(m.picTop!).toBeGreaterThanOrEqual(0);
      // It is a square card inside a square: never wider than the screen minus its margins.
      expect(m.picWidth!).toBeLessThanOrEqual(width - 48);
    }
  });
}
