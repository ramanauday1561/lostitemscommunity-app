import type { Page } from '@playwright/test';

/** Draws a 1600x1200 PNG (bigger than the app's 1280px cap, so the shrink step runs) with the label on it. */
async function makePhoto(page: Page, label: string): Promise<Buffer> {
  const dataUrl = await page.evaluate((text) => {
    const hue = [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
    const c = document.createElement('canvas');
    c.width = 1600; c.height = 1200;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 1600, 1200);
    grad.addColorStop(0, `hsl(${hue} 55% 62%)`); grad.addColorStop(1, `hsl(${(hue + 50) % 360} 60% 38%)`);
    g.fillStyle = grad; g.fillRect(0, 0, 1600, 1200);
    g.fillStyle = 'rgba(255,255,255,.88)';
    g.beginPath(); g.arc(800, 470, 230, 0, Math.PI * 2); g.fill();
    g.fillStyle = `hsl(${hue} 55% 30%)`; g.font = 'bold 150px sans-serif'; g.textAlign = 'center';
    g.fillText(text.trim().charAt(0).toUpperCase(), 800, 525);
    g.fillStyle = '#fff'; g.font = 'bold 76px sans-serif';
    g.fillText(text.length > 28 ? `${text.slice(0, 27)}…` : text, 800, 930);
    return c.toDataURL('image/png');
  }, label);
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

/** Clicks "Add a photo" in the Report sheet and hands the picker a generated image. */
export async function attachPhoto(page: Page, label: string): Promise<void> {
  const buffer = await makePhoto(page, label);
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Add a photo', { exact: true }).click(),
  ]);
  await chooser.setFiles({ name: 'photo.png', mimeType: 'image/png', buffer });
  await page.getByText('Change photo', { exact: true }).waitFor({ timeout: 15000 });
}
