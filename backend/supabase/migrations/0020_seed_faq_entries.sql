-- Phase 11: seed the support bot's FAQ.
--
-- These five entries are the app's own help copy (reporting, claiming, safety), not demo data, and
-- the support sheet now answers from this table instead of a hard-coded list -- so an empty table
-- means no chips and only the "I'm not sure" fallback. Inserted only when the table is empty, so
-- re-running (or an operator who has already edited the FAQ) is safe.

do $$
begin
  if not exists (select 1 from public.faq_entries) then
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
  end if;
end $$;
