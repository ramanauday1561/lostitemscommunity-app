-- Storage buckets for the "Add a photo" flow (Report.tsx) and profile avatars.
-- Both buckets are public-read (item photos and avatars are shown to any
-- signed-in member) with writes scoped to the owning user by folder
-- convention: <bucket>/<user_id>/<file>.

insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy item_photos_bucket_read on storage.objects
  for select using (bucket_id = 'item-photos');
create policy item_photos_bucket_write on storage.objects
  for insert with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy item_photos_bucket_delete on storage.objects
  for delete using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_bucket_read on storage.objects
  for select using (bucket_id = 'avatars');
create policy avatars_bucket_write on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_bucket_update on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
