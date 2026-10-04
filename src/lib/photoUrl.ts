/** Public URL of a file in the `item-photos` bucket (it is public-read, see 0011_storage.sql). Built by hand
 *  rather than through the client so list rows can map it without a network round trip. */
export function itemPhotoUrl(path: string): string {
  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  return `${base}/storage/v1/object/public/item-photos/${path.split('/').map(encodeURIComponent).join('/')}`;
}
