-- Moderation resolution regression script (migrations 0027/0028). Rolled back; the error text is the report.
-- Needs: testuser1 (item owner), superadmin.
do $$
declare u1 uuid; adm uuid; it uuid; f1 uuid; f2 uuid; n int; st text; r text := '';
begin
  select id into u1 from profiles where username='testuser1';
  select id into adm from profiles where username='superadmin';

  insert into items (reporter_id, kind, category, title, location_text, display_id)
    values (u1, 'lost', 'Other', 'moderation test item', 'nowhere', 'LOST-T1') returning id into it;

  ----- admin flags it (as the UI does), twice -----
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into moderation_flags (target_type, target_id, reason, flagged_by) values ('item', it, 'r', adm) returning id into f1;
  update items set status = 'flagged' where id = it;
  begin insert into moderation_flags (target_type, target_id, reason, flagged_by) values ('item', it, 'r2', adm);
        r := r || 'DUPLICATE PENDING FLAG ALLOWED(!) | ';
  exception when unique_violation then r := r || 'second pending flag refused (ok) | '; end;

  ----- a non-admin cannot resolve -----
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  begin perform resolve_moderation_flag(f1, true); r := r || 'MEMBER RESOLVED(!) | ';
  exception when others then r := r || 'member cannot resolve (ok) | '; end;

  ----- admin approves: flag closed, item active again, owner told -----
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  perform resolve_moderation_flag(f1, true);
  reset role; perform set_config('request.jwt.claims', '', true);
  select status into st from items where id = it; r := r || 'after approve item is ' || st || case when st='active' then ' (ok)' else ' (WRONG)' end || ' | ';
  select count(*) into n from notifications where user_id=u1 and title='Review complete: your post stays up'; r := r || 'approve notified owner: ' || n || ' (ok if 1) | ';
  select count(*) into n from audit_log where action='moderation.approve' and metadata->>'flag_id' = f1::text; r := r || 'audit row: ' || n || ' (ok if 1) | ';

  ----- flag again, admin removes: item deleted, owner STILL has the notification -----
  perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into moderation_flags (target_type, target_id, reason, flagged_by) values ('item', it, 'again', adm) returning id into f2;
  perform resolve_moderation_flag(f2, false);
  reset role; perform set_config('request.jwt.claims', '', true);
  select count(*) into n from items where id = it; r := r || 'after remove item rows: ' || n || ' (ok if 0) | ';
  select count(*) into n from notifications where user_id=u1 and title='A moderator removed your post' and item_id is null;
  r := r || 'removal notification survives the delete: ' || n || ' (ok if 1) | ';

  raise exception 'REPORT: %', r;
end $$;
