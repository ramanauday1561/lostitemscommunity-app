-- Rate-limit regression script (checklist 14.1). Same conventions as rls_attacks.sql: impersonates
-- the seeded accounts inside one transaction and ALWAYS ends with an exception, so nothing is
-- committed. The error text is the report; expect every line to say "ok".
-- Needs: testuser1, testuser2, superadmin; LOST-1031 with a conversation to testuser2.

do $$
declare u1 uuid; u2 uuid; adm uuid; item uuid; conv uuid; i int; n int; r text := ''; blocked boolean; att int; msg text;

begin
  select id into u1 from profiles where username='testuser1';
  select id into u2 from profiles where username='testuser2';
  select id into adm from profiles where username='superadmin';
  select id into item from items where display_id='LOST-1031';
  select id into conv from conversations where item_id=item limit 1;

  ----- forum_threads: limit 5/hour -----
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  n := 0; blocked := false;
  for i in 1..8 loop
    begin insert into forum_threads (author_id, title, body) values (u2, 'rl ' || i, 'x'); n := n + 1;
    exception when others then blocked := true; msg := sqlerrm; exit; end;
  end loop;
  r := r || 'threads: ' || n || ' accepted then ' || case when blocked then 'blocked' else 'NOT BLOCKED(!)' end || ' (' || case when n=5 then 'ok' else 'WRONG LIMIT(!)' end || ') | ';
  r := r || 'message: ' || case when msg like '%too often%' then 'friendly(ok)' else 'UNEXPECTED(' || coalesce(msg,'null') || ')' end || ' | ';
  reset role; perform set_config('request.jwt.claims', '', true);
  select attempts into att from auth_throttle where key = 'u:' || u2 || ':forum_threads';
  r := r || 'blocked attempt not counted: attempts=' || att || ' (ok if 5) | ';

  ----- isolation: another user is unaffected -----
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin insert into forum_threads (author_id, title, body) values (u1, 'other user', 'x'); r := r || 'isolation: user1 unaffected (ok) | ';
  exception when others then r := r || 'isolation: user1 WRONGLY blocked(!) | '; end;
  reset role; perform set_config('request.jwt.claims', '', true);

  ----- messages: limit 30/minute -----
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  n := 0; blocked := false;
  for i in 1..40 loop
    begin insert into messages (conversation_id, sender_id, body) values (conv, u2, 'rl ' || i); n := n + 1;
    exception when others then blocked := true; exit; end;
  end loop;
  r := r || 'messages: ' || n || ' accepted then ' || case when blocked then 'blocked' else 'NOT BLOCKED(!)' end || ' (' || case when n=30 then 'ok' else 'WRONG LIMIT(!)' end || ') | ';
  reset role; perform set_config('request.jwt.claims', '', true);

  ----- items: limit 10/hour -----
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  n := 0; blocked := false;
  for i in 1..14 loop
    begin insert into items (kind, category, title, location_text, reporter_id) values ('lost', 'Other', 'rl item ' || i, 'somewhere', u2); n := n + 1;
    exception when others then blocked := true; msg := sqlerrm; exit; end;
  end loop;
  r := r || 'items: ' || n || ' accepted then ' || case when blocked then 'blocked' else 'NOT BLOCKED(!)' end || ' (' || case when n=10 then 'ok' else 'WRONG LIMIT(!)' || coalesce(msg,'') end || ') | ';
  reset role; perform set_config('request.jwt.claims', '', true);

  ----- superadmin exempt -----
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  n := 0;
  for i in 1..8 loop
    begin insert into forum_threads (author_id, title, body) values (adm, 'admin ' || i, 'x'); n := n + 1; exception when others then exit; end;
  end loop;
  r := r || 'superadmin: ' || n || ' of 8 accepted (ok if 8) | ';
  reset role; perform set_config('request.jwt.claims', '', true);

  ----- service role / no JWT exempt -----
  n := 0;
  for i in 1..8 loop
    begin insert into forum_threads (author_id, title, body) values (u2, 'svc ' || i, 'x'); n := n + 1; exception when others then exit; end;
  end loop;
  r := r || 'no-JWT/service: ' || n || ' of 8 accepted (ok if 8) | ';

  ----- window reset -----
  update auth_throttle set window_start = now() - interval '2 hours' where key = 'u:' || u2 || ':forum_threads';
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin insert into forum_threads (author_id, title, body) values (u2, 'after window', 'x'); r := r || 'window reset: accepted again (ok) | ';
  exception when others then r := r || 'window reset: STILL BLOCKED(!) | '; end;
  reset role;

  raise exception 'RESULT: %', r;
end $$;
