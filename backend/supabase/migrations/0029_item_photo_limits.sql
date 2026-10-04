-- Server-side limits for item photos. The app shrinks every photo to <=1280px
-- JPEG (~150-400 KB) before upload; the bucket refuses anything that bypasses
-- that: over 2 MB, or not JPEG/PNG/WebP.
update storage.buckets
   set file_size_limit = 2 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'item-photos';
