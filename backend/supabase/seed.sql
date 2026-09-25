-- Local dev seed. Mirrors src/data/constants.ts so the backend and the
-- frontend's mock state show the same records while the app is wired up
-- screen by screen. Not applied to production -- see backend/README.md.

-- 1. auth users + profiles -------------------------------------------------
-- The standard local-Supabase recipe for seeding auth.users directly
-- (password for every seed account: "Password1!", matching the prototype's
-- quick-login hint).
do $$
declare
  pass text := crypt('Password1!', gen_salt('bf'));
  uid_superadmin uuid := '00000000-0000-0000-0000-000000000001';
  uid_user       uuid := '00000000-0000-0000-0000-000000000002';
  uid_newuser    uuid := '00000000-0000-0000-0000-000000000003';
  uid_alexj      uuid := '00000000-0000-0000-0000-000000000004';
  uid_subway     uuid := '00000000-0000-0000-0000-000000000005';
  uid_emilyc     uuid := '00000000-0000-0000-0000-000000000006';
  uid_okafor     uuid := '00000000-0000-0000-0000-000000000007';
  uid_rivera     uuid := '00000000-0000-0000-0000-000000000008';
  uid_cafe5th    uuid := '00000000-0000-0000-0000-000000000009';
  uid_lotb       uuid := '00000000-0000-0000-0000-00000000000a';
  uid_campus     uuid := '00000000-0000-0000-0000-00000000000b';
  uid_pham       uuid := '00000000-0000-0000-0000-00000000000c';
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
  values
    (uid_superadmin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@lostitems.community', pass, now(), '{"username":"superadmin","handle":"superadmin","display_name":"Super Admin"}', now(), now()),
    (uid_user, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user@lostitems.community', pass, now(), '{"username":"user","handle":"simple.user","display_name":"Simple User"}', now(), now()),
    (uid_newuser, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'newuser@lostitems.community', pass, now(), '{"username":"newuser","handle":"newuser","display_name":"Nadia Iqbal"}', now(), now()),
    (uid_alexj, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alex.j@example.com', pass, now(), '{"username":"alex.j","handle":"alex.j","display_name":"Alex Jordan"}', now(), now()),
    (uid_subway, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'subway.finder@example.com', pass, now(), '{"username":"subway.finder","handle":"subway.finder","display_name":"Subway Finder"}', now(), now()),
    (uid_emilyc, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emily.c@example.com', pass, now(), '{"username":"emily.c","handle":"emily.c","display_name":"Emily Chen"}', now(), now()),
    (uid_okafor, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm.okafor@example.com', pass, now(), '{"username":"m.okafor","handle":"m.okafor","display_name":"Marina Okafor"}', now(), now()),
    (uid_rivera, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'j.rivera@example.com', pass, now(), '{"username":"j.rivera","handle":"j.rivera","display_name":"J. Rivera"}', now(), now()),
    (uid_cafe5th, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cafe.5th@example.com', pass, now(), '{"username":"cafe.5th","handle":"cafe.5th","display_name":"Cafe on 5th"}', now(), now()),
    (uid_lotb, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lotb.security@example.com', pass, now(), '{"username":"lotb.security","handle":"lotb.security","display_name":"Lot B Security"}', now(), now()),
    (uid_campus, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'campus.desk@example.com', pass, now(), '{"username":"campus.desk","handle":"campus.desk","display_name":"Campus Desk"}', now(), now()),
    (uid_pham, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd.pham@example.com', pass, now(), '{"username":"d.pham","handle":"d.pham","display_name":"D. Pham"}', now(), now());
  -- public.profiles rows are created automatically by on_auth_user_created.
end $$;

update public.profiles set role = 'superadmin' where handle = 'superadmin';
update public.profiles set guidelines_accepted_at = now() where handle = 'simple.user';
update public.profiles set is_suspended = true where handle = 'subway.finder';

-- 2. items -------------------------------------------------------------
insert into public.items (kind, status, title, category, icon, location_text, occurred_on, description, reporter_id)
select 'lost', 'flagged', 'Samsung Galaxy S24', 'Electronics', 'smartphone', 'Bus 14, evening route', '2024-06-05',
  'Left on the rack above the seat. Black case, cracked corner.', id
from public.profiles where handle = 'alex.j';

insert into public.items (kind, status, title, category, icon, location_text, occurred_on, description, reporter_id)
select 'lost', 'active', 'Prescription glasses', 'Other', 'visibility', 'City library, 2nd floor', '2024-06-04',
  'Tortoise frames in a hard black case.', id
from public.profiles where handle = 'm.okafor';

insert into public.items (kind, status, title, category, icon, location_text, occurred_on, description, reporter_id)
select 'lost', 'active', 'Blue Jansport backpack', 'Bags', 'backpack', 'Central Station platform 3', '2024-06-02',
  'Notebook and a grey hoodie inside.', id
from public.profiles where handle = 'simple.user';

insert into public.items (kind, status, title, category, icon, location_text, occurred_on, description, reporter_id)
select 'lost', 'reunited', 'Grey tabby cat, no collar', 'Pets', 'pets', 'Oak Street', '2024-05-29',
  'Answers to Miso. Found by a neighbour two streets away.', id
from public.profiles where handle = 'd.pham';

insert into public.items (kind, status, title, category, icon, location_text, occurred_on, description, reporter_id)
select 'found', 'active', 'Black Wallet', 'Wallets', 'account_balance_wallet', 'Riverside Park bench', '2024-06-11',
  'Handed in at the park office. Cards inside, no cash. Owner name partially legible.', id
from public.profiles where handle = 'j.rivera';

insert into public.items (kind, status, title, category, icon, location_text, occurred_on, description, reporter_id)
select 'found', 'active', 'Silver Watch', 'Other', 'watch', 'Coffee shop on 5th Ave', '2024-06-09',
  'Left on a window table. Metal strap, small scratch on the clasp.', id
from public.profiles where handle = 'cafe.5th';

insert into public.items (kind, status, title, category, icon, location_text, occurred_on, description, reporter_id)
select 'found', 'active', 'iPhone 15', 'Electronics', 'smartphone', 'Union Square subway station', '2024-06-06',
  'Locked screen, blue case. Held at the station desk pending verification.', id
from public.profiles where handle = 'subway.finder';

insert into public.items (kind, status, title, category, icon, location_text, occurred_on, description, reporter_id)
select 'found', 'resolved', 'Car Keys with Fob', 'Keys', 'key', 'Parking lot B', '2024-05-31',
  'Returned to owner after fob serial matched the report.', id
from public.profiles where handle = 'lotb.security';

insert into public.items (kind, status, title, category, icon, location_text, occurred_on, description, reporter_id)
select 'found', 'active', 'Student ID Card', 'Documents', 'badge', 'City College cafeteria', '2024-05-28',
  'Card is intact. Waiting for the registered student to claim it.', id
from public.profiles where handle = 'campus.desk';

-- 3. the pending moderation flag for the Samsung Galaxy S24 --------------
insert into public.moderation_flags (target_type, target_id, reason, status, flagged_by)
select 'item', i.id, 'Unverified ownership claim', 'pending', p.id
from public.items i join public.profiles p on p.handle = 'alex.j'
where i.title = 'Samsung Galaxy S24';

-- 4. forum -----------------------------------------------------------------
insert into public.forum_threads (author_id, tag, status, title, body)
select id, 'Sighting', 'live', 'Rolex Submariner -- possible match at Central Station',
  'Great news! I think I saw this matching description at the Central Station desk. Worth calling before you travel over.'
from public.profiles where handle = 'simple.user';

insert into public.forum_replies (thread_id, author_id, body)
select t.id, p.id, 'I was there this morning -- the desk does hold watches in a sealed bag. Ask for the lost property window, not the ticket office.'
from public.forum_threads t, public.profiles p
where t.title like 'Rolex Submariner%' and p.handle = 'alex.j';

insert into public.forum_threads (author_id, tag, status, title, body)
select id, 'Reunited', 'live', 'MacBook Pro 16 returned to its owner',
  'Verified ownership serial number matches. Owner contacted successfully and collected it this morning.'
from public.profiles where handle = 'emily.c';

insert into public.forum_threads (author_id, tag, status, title, body)
select id, 'Question', 'live', 'How long does the desk hold handed-in items?',
  'Dropped a wallet at the park office last week and it is still showing Active. Does the holding period reset after a claim?'
from public.profiles where handle = 'm.okafor';

-- 5. ad campaigns & placements --------------------------------------------
insert into public.ad_campaigns (key, name, advertiser, icon, rate_label, cpm) values
  ('keysmart',   'KeySmart tags -- 20% off',   'KeySmart',   'key',          '$14 CPM', 14),
  ('citylock',   'CityLock 24h locksmith',     'CityLock',   'lock',         '$22 CPM', 22),
  ('phonemedic', 'PhoneMedic screen repair',   'PhoneMedic', 'smartphone',   '$18 CPM', 18),
  ('trackr',     'Trackr bag tracker bundle',  'Trackr',     'my_location',  '$26 CPM', 26);

insert into public.ad_placements (campaign_id, screen, slot, format, size, duration_days, starts_at, is_live, revenue, impressions, ctr)
select id, 'Home', 'Below community activity', 'Native strip', '320 x 104', 30, current_date - 12, true, 1240, 41200, 2.4
from public.ad_campaigns where key = 'keysmart';

insert into public.ad_placements (campaign_id, screen, slot, format, size, duration_days, starts_at, is_live, revenue, impressions, ctr)
select id, 'Registry', 'In-feed, after 4th listing', 'In-feed card', 'In-feed', 14, current_date - 8, true, 2860, 88400, 3.1
from public.ad_campaigns where key = 'citylock';

insert into public.ad_placements (campaign_id, screen, slot, format, size, duration_days, starts_at, is_live, revenue, impressions, ctr)
select id, 'Forum', 'Above the first thread', 'In-feed card', 'In-feed', 7, current_date - 7, false, 430, 12900, 1.2
from public.ad_campaigns where key = 'phonemedic';

insert into public.ad_placements (campaign_id, screen, slot, format, size, duration_days, starts_at, is_live, revenue, impressions, ctr)
select id, 'Report success', 'Confirmation sheet', 'Single offer', '320 x 88', 30, current_date - 6, true, 1980, 9400, 5.6
from public.ad_campaigns where key = 'trackr';

-- 6. FAQ ---------------------------------------------------------------
insert into public.faq_entries (question, keywords, answer, position) values
  ('How do I report an item?', array['report','post','upload','submit'],
   'Super easy! Tap the + button, upload a photo, add a description (colour, brand, location found), and submit. You''ll get notifications when potential owners reach out. The whole process takes less than 2 minutes!', 1),
  ('How can I claim an item?', array['claim','mine','owner','collect'],
   'Found your lost item? Open the item and use our secure messaging to contact the finder. Verify ownership by describing unique features only you would know, then arrange a safe meetup in a public place to collect it.', 2),
  ('What if I can''t find my lost item?', array['can''t find','cannot find','no match','nothing','missing'],
   'Don''t give up! Create a lost item post with detailed descriptions, photos and location. Enable notifications to get instant alerts when matching items are reported, and check back regularly -- new items are added daily.', 3),
  ('Is the platform free?', array['free','cost','price','pay','fee','premium'],
   'Absolutely! Lost Items Community is 100% free forever. No hidden fees, no premium plans, no catch. Create unlimited posts, search the entire registry, and message other users completely free.', 4),
  ('Is meeting a stranger safe?', array['safe','safety','meet','stranger','scam'],
   'Always meet in a busy public place during daylight, bring someone with you if you can, and never send money upfront. Verify ownership in chat first -- and report anything suspicious so a moderator can review it.', 5);

-- 7. flagged keywords (Admin > Analysis) ------------------------------
insert into public.moderation_keywords (keyword, hit_count) values
  ('payment upfront', 7), ('send deposit', 4), ('meet alone', 2);

-- 8. post_count overrides -- applied last, after every forum insert above,
-- so these final numbers (matching MEMBERS in src/data/constants.ts) aren't
-- clobbered by the bump_post_count trigger firing on the seeded threads/replies.
update public.profiles set post_count = 11 where handle = 'alex.j';
update public.profiles set post_count = 34 where handle = 'subway.finder';
update public.profiles set post_count = 6  where handle = 'emily.c';
update public.profiles set post_count = 4  where handle = 'simple.user';
update public.profiles set post_count = 2  where handle = 'm.okafor';
