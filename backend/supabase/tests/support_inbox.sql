-- Support inbox regression script (checklist 11.3, migration 0026). Same conventions as rls_attacks.sql:
-- impersonates seeded accounts in one transaction and ALWAYS ends with an exception, so nothing is
-- committed. The error text is the report; every line should say "ok".
-- Needs: testuser1, testuser2, superadmin.

do $$
declare u1 uuid; u2 uuid; adm uuid; n int; r text := ''; req uuid; msg text;
begin
  select id into u1 from profiles where username='testuser1';
  select id into u2 from profiles where username='testuser2';
  select id into adm from profiles where username='superadmin';

  ----- member opens a request for themselves -----
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into support_requests (user_id) values (u1) returning id into req;
  r := r || 'member opens own request (ok) | ';

  begin insert into support_requests (user_id) values (u1); r := r || 'DUPLICATE OPEN ALLOWED(!) | ';
  exception when unique_violation then r := r || 'second open request refused (ok) | '; end;

  begin insert into support_requests (user_id) values (u2); r := r || 'OPENED FOR SOMEONE ELSE(!) | ';
  exception when others then r := r || 'cannot open for another member (ok) | '; end;

  begin insert into support_requests (user_id, status) values (u1, 'closed'); r := r || 'INSERTED AS CLOSED(!) | ';
  exception when others then r := r || 'cannot insert pre-closed (ok) | '; end;

  ----- member cannot close it, cannot impersonate staff -----
  update support_requests set status='closed' where id=req;
  get diagnostics n = row_count;
  r := r || case when n=0 then 'member cannot close (ok) | ' else 'MEMBER CLOSED IT(!) | ' end;

  begin insert into support_messages (user_id, sender, body) values (u1, 'agent', 'I am staff');
        r := r || 'MEMBER POSTED AS AGENT(!) | ';
  exception when others then r := r || 'member cannot post as agent (ok) | '; end;
  insert into support_messages (user_id, sender, body) values (u1, 'user', 'help please');
  insert into support_messages (user_id, sender, body) values (u1, 'bot', 'handed over');
  r := r || 'member can still post user/bot rows (ok) | ';

  ----- another member sees nothing -----
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  select count(*) into n from support_requests; r := r || case when n=0 then 'other member sees no requests (ok) | ' else 'LEAK requests(!) | ' end;
  select count(*) into n from support_messages; r := r || case when n=0 then 'other member sees no messages (ok) | ' else 'LEAK messages(!) | ' end;
  reset role;

  ----- superadmin: sees, replies, notifies, closes -----
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from support_requests where status='open'; r := r || case when n=1 then 'admin sees open request (ok) | ' else 'ADMIN SEES ' || n || '(!) | ' end;
  insert into support_messages (user_id, sender, body) values (u1, 'agent', 'Hi, how can I help?');
  r := r || 'admin replies as agent (ok) | ';
  update support_requests set status='closed', closed_at=now(), closed_by=adm where id=req;
  get diagnostics n = row_count; r := r || case when n=1 then 'admin closes (ok) | ' else 'ADMIN COULD NOT CLOSE(!) | ' end;
  reset role; perform set_config('request.jwt.claims', '', true);

  select count(*) into n from notifications where user_id=u1 and type='system' and title='Support replied' and body='Hi, how can I help?';
  r := r || case when n=1 then 'reply notified the member (ok) | ' else 'NO NOTIFICATION(' || n || ')(!) | ' end;
  select count(*) into n from notifications where user_id=adm;
  r := r || case when n=0 then 'staff not notified of own reply (ok) | ' else 'UNEXPECTED admin notification(!) | ' end;

  ----- member can open a NEW request once the old one is closed; a member message does not notify -----
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into support_requests (user_id) values (u1);
  r := r || 'reopen after close (ok) | ';
  select count(*) into n from support_messages where user_id=u1 and sender='agent'; r := r || 'member reads staff reply: ' || n || ' (ok if 1) | ';
  reset role; perform set_config('request.jwt.claims', '', true);

  raise exception 'REPORT: %', r;
end $$;
