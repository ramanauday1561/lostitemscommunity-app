/** Photo rules shared by the picker, the uploader and the storage bucket
 *  (0029_item_photo_limits.sql keeps the bucket's own limits in step). */
export const MAX_PICK_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_EDGE = 1280;
export const JPEG_QUALITY = 0.72;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Scales (w, h) down so the longer edge is at most `max`; never scales up. */
export function fitWithin(w: number, h: number, max: number = MAX_EDGE): { w: number; h: number } {
  const longest = Math.max(w, h);
  if (longest <= max) return { w, h };
  const k = max / longest;
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

/** Why a picked file can't be used, or null when it's fine. */
export function photoProblem(type: string, size: number): string | null {
  if (type && !ALLOWED_TYPES.includes(type)) return 'Please choose a JPEG, PNG or WebP photo.';
  if (size > MAX_PICK_BYTES) return 'That photo is over 10 MB — please pick a smaller one.';
  return null;
}

/** Re-encodes as a JPEG no longer than MAX_EDGE on its longest side. Web only
 *  (canvas); elsewhere the picker's own `quality` setting does the compression.
 *  Returns the original blob if the browser can't decode it or the result isn't smaller. */
export async function shrinkPhoto(blob: Blob): Promise<Blob> {
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') return blob;
  try {
    const bitmap = await createImageBitmap(blob);
    const { w, h } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return blob;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); // PNG transparency -> white, not black
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', JPEG_QUALITY));
    return out && out.size < blob.size ? out : blob;
  } catch {
    return blob;
  }
}
