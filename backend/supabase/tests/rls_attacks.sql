-- Row-level-security regression script (checklist 14.7).
--
-- Impersonates the seeded test accounts inside ONE transaction and always ends by raising an
-- exception, so nothing is ever committed. Run it against the project after any change to
-- policies, guard triggers or the notification/count triggers:
--
--   Supabase MCP / dashboard SQL editor: paste and run. The error text IS the report:
--   "RESULT: T1 un-flag: blocked | ... | L1 owner marks reunited: ok | ..."
--
-- Expected: every Tn says "blocked" (T7: "anon profiles=0"), every Ln says "ok" (or a sane number),
-- and no entry contains "(!)" or "BROKEN". Needs: users testuser1, testuser2, superadmin; item
-- LOST-1031 (reporter testuser1) with an existing conversation to testuser2; item FOUND-2018
-- (reporter testuser1) with NO conversation yet.
--
-- Gotcha baked in below: after `reset role`, request.jwt.claims is still set, so any fixture step
-- that should run as the database owner must clear it first (set_config(..., '', true)).

do $$
declare u1 uuid; u2 uuid; adm uuid; item uuid; found_item uuid; th uuid; conv uuid; msg uuid; msg2 uuid;
        n int; r text := ''; hc int; pc0 int; pc1 int;
begin
  select id into u1 from profiles where username='testuser1';
  select id into u2 from profiles where username='testuser2';
  select id into adm from profiles where username='superadmin';
  select id into item from items where display_id='LOST-1031';
  select id into found_item from items where display_id='FOUND-2018';
  select id into conv from conversations where item_id=item limit 1;
  insert into messages (conversation_id, sender_id, body) values (conv, u1, 'original words from user1') returning id into msg;
  insert into messages (conversation_id, sender_id, body) values (conv, u2, 'from user2') returning id into msg2;

  ---------------- ATTACKS (expect blocked) ----------------
  update items set status='flagged' where id=item;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin update items set status='active' where id=item; r := r || 'T1 un-flag: ALLOWED(!) | '; exception when others then r := r || 'T1 un-flag: blocked | '; end;
  begin update items set display_id='FOUND-9999' where id=item; r := r || 'T2 display_id: ALLOWED(!) | '; exception when others then r := r || 'T2 display_id: blocked | '; end;
  reset role; perform set_config('request.jwt.claims', '', true);
  update items set status='active' where id=item;

  insert into forum_threads (author_id, title, body) values (u1, 'attack-test', 'x') returning id into th;
  update forum_threads set status='suspended' where id=th;
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin update forum_threads set status='live' where id=th; r := r || 'T3a un-suspend: ALLOWED(!) | '; exception when others then r := r || 'T3a un-suspend: blocked | '; end;
  begin update forum_threads set helpful_count=999 where id=th; r := r || 'T3b forge votes: ALLOWED(!) | '; exception when others then r := r || 'T3b forge votes: blocked | '; end;
  reset role; perform set_config('request.jwt.claims', '', true);
  update forum_threads set status='live' where id=th;

  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin update messages set body='tampered' where id=msg; get diagnostics n = row_count; r := r || 'T4a edit other''s message: ' || case when n=1 then 'ALLOWED(!)' else 'blocked(0 rows)' end || ' | '; exception when others then r := r || 'T4a edit other''s message: blocked | '; end;
  begin update messages set body='tampered' where id=msg2; r := r || 'T4b edit OWN message: ALLOWED(!) | '; exception when others then r := r || 'T4b edit own message: blocked | '; end;
  begin update messages set read_at=now() where id=msg2; r := r || 'T4c mark OWN message read: ALLOWED(!) | '; exception when others then r := r || 'T4c mark own message read: blocked | '; end;
  begin insert into conversations (item_id, reporter_id, claimant_id) values (found_item, adm, u2); r := r || 'T5 spoofed reporter: ALLOWED(!) | '; exception when others then r := r || 'T5 spoofed reporter: blocked | '; end;
  begin insert into moderation_flags (target_type, target_id, reason, status, flagged_by) values ('forum_thread', th, 'forged', 'removed', null); r := r || 'T6a anonymous pre-removed flag: ALLOWED(!) | '; exception when others then r := r || 'T6a anonymous pre-removed flag: blocked | '; end;
  begin insert into moderation_flags (target_type, target_id, reason, status, flagged_by) values ('forum_thread', th, 'forged2', 'removed', u2); r := r || 'T6b self-attributed but pre-removed: ALLOWED(!) | '; exception when others then r := r || 'T6b self-attributed but pre-removed: blocked | '; end;
  reset role; perform set_config('request.jwt.claims', '', true);
  set local role anon; select count(*) into n from profiles; reset role;
  r := r || 'T7 anon profiles=' || n || ' | ';

  ---------------- LEGIT FLOWS (expect allowed) ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin update items set status='reunited' where id=item; r := r || 'L1 owner marks reunited: ok | '; exception when others then r := r || 'L1 owner marks reunited: BROKEN | '; end;
  begin update forum_threads set title='edited title' where id=th; r := r || 'L2 author edits title: ok | '; exception when others then r := r || 'L2 author edits title: BROKEN | '; end;
  select post_count into pc0 from profiles where id=u1;
  begin insert into forum_threads (author_id, title, body) values (u1, 'second', 'y'); select post_count into pc1 from profiles where id=u1; r := r || 'L10 post_count ' || pc0 || '->' || pc1 || ' | '; exception when others then r := r || 'L10 BROKEN | '; end;
  begin update profiles set guidelines_accepted_at = now() where id=u1; r := r || 'L9 accept guidelines: ok | '; exception when others then r := r || 'L9 BROKEN | '; end;
  reset role; perform set_config('request.jwt.claims', '', true);

  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into forum_thread_votes (thread_id, user_id) values (th, u2);
  reset role; perform set_config('request.jwt.claims', '', true);
  select helpful_count into hc from forum_threads where id=th;
  r := r || 'L3 non-author vote -> helpful_count=' || hc || ' (expect 1) | ';
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin update messages set read_at=now() where id=msg; get diagnostics n = row_count; r := r || 'L4 mark other''s message read: ' || case when n=1 then 'ok' else 'BROKEN(0 rows)' end || ' | '; exception when others then r := r || 'L4 BROKEN | '; end;
  begin insert into conversations (item_id, reporter_id, claimant_id) values (found_item, u1, u2); r := r || 'L5 legit claim: ok | '; exception when others then r := r || 'L5 legit claim: BROKEN | '; end;
  begin insert into moderation_flags (target_type, target_id, reason, flagged_by) values ('forum_thread', th, 'member report', u2); r := r || 'L7 member files own flag: ok | '; exception when others then r := r || 'L7 BROKEN | '; end;
  select count(*) into n from profiles; r := r || 'L8 member reads profiles=' || n || ' | ';
  reset role; perform set_config('request.jwt.claims', '', true);

  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin insert into moderation_flags (target_type, target_id, reason, flagged_by) values ('item', item, 'admin flag', adm); update items set status='flagged' where id=item; update items set status='active' where id=item; r := r || 'L6 admin flags then restores an item: ok | '; exception when others then r := r || 'L6 admin flow: BROKEN(' || sqlerrm || ') | '; end;
  reset role;

  raise exception 'RESULT: %', r;
end $$;
