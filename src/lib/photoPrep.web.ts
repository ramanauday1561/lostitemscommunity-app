import { MAX_UPLOAD_BYTES, photoProblem, shrinkPhoto } from './image';
import type { PickedAsset, PreparedPhoto } from './photoPrep.types';

/** Web: re-encode on a canvas (see shrinkPhoto) and keep the result as a Blob. */
export async function preparePhoto(asset: PickedAsset): Promise<PreparedPhoto | { error: string }> {
  const picked = await (await fetch(asset.uri)).blob();
  const problem = photoProblem(picked.type || asset.mimeType || '', picked.size);
  if (problem) return { error: problem };

  const blob = await shrinkPhoto(picked);
  if (blob.size > MAX_UPLOAD_BYTES) return { error: 'That photo is still too large after shrinking — try another.' };

  const shrunk = blob !== picked;
  const base = (asset.fileName || `photo-${Date.now()}`).replace(/\.[^.]+$/, '');
  const name = shrunk ? `${base}.jpg` : (asset.fileName || `photo-${Date.now()}.jpg`);
  const preview = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(blob) : asset.uri;
  return { body: blob, type: blob.type || 'image/jpeg', size: blob.size, name, preview };
}
