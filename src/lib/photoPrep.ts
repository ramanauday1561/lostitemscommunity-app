import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { fitWithin, JPEG_QUALITY, MAX_PICK_BYTES, MAX_UPLOAD_BYTES } from './image';
import type { PickedAsset, PreparedPhoto } from './photoPrep.types';

/** iOS/Android: shrink the picked photo to a JPEG no longer than MAX_EDGE on its longest side, and hand the upload
 *  an ArrayBuffer (React Native's Blob uploads can arrive empty; an ArrayBuffer is what Supabase documents for RN). */
export async function preparePhoto(asset: PickedAsset): Promise<PreparedPhoto | { error: string }> {
  if (asset.fileSize && asset.fileSize > MAX_PICK_BYTES) return { error: 'That photo is over 10 MB — please pick a smaller one.' };

  const ctx = ImageManipulator.manipulate(asset.uri);
  if (asset.width && asset.height) {
    const { w, h } = fitWithin(asset.width, asset.height);
    if (w !== asset.width || h !== asset.height) ctx.resize(w >= h ? { width: w } : { height: h });
  }
  const image = await ctx.renderAsync();
  const out = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY, base64: true });
  if (!out.base64) return { error: 'Could not prepare that photo. Please try another.' };

  const body = decode(out.base64);
  if (body.byteLength > MAX_UPLOAD_BYTES) return { error: 'That photo is still too large after shrinking — try another.' };
  const base = (asset.fileName || `photo-${Date.now()}`).replace(/\.[^.]+$/, '');
  return { body, type: 'image/jpeg', size: body.byteLength, name: `${base}.jpg`, preview: out.uri };
}
