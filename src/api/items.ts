import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { Item, Kind, Status } from '../data/constants';

type ItemRow = Database['public']['Tables']['items']['Row'] & {
  reporter: { handle: string } | { handle: string }[] | null;
};

const KIND_LABEL: Record<Database['public']['Enums']['item_kind'], Kind> = { lost: 'Lost', found: 'Found' };
const STATUS_LABEL: Record<Database['public']['Enums']['item_status'], Status> = {
  active: 'Active', resolved: 'Resolved', reunited: 'Reunited', flagged: 'Flagged',
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function reporterHandle(reporter: ItemRow['reporter']): string {
  if (!reporter) return '';
  return Array.isArray(reporter) ? (reporter[0]?.handle ?? '') : reporter.handle;
}

const STATUS_DB: Record<Status, Database['public']['Enums']['item_status']> = {
  Active: 'active', Resolved: 'resolved', Reunited: 'reunited', Flagged: 'flagged',
};

export function toFrontendItem(row: ItemRow): Item {
  return {
    id: row.display_id,
    title: row.title,
    location: row.location_text,
    date: formatDate(row.occurred_on ?? row.created_at),
    status: STATUS_LABEL[row.status],
    kind: KIND_LABEL[row.kind],
    icon: row.icon,
    by: reporterHandle(row.reporter),
    desc: row.description ?? '',
    coords: row.location_lat != null && row.location_lng != null ? `${row.location_lat}, ${row.location_lng}` : null,
    dbId: row.id,
    reporterId: row.reporter_id,
  };
}

export interface ListItemsParams {
  kind: 'lost' | 'found';
  /** 'All' | 'My posts' | 'Active' | 'Resolved' | 'Reunited' | 'Flagged' -- the Pill labels, verbatim. */
  filter: string;
  query?: string;
  userId?: string | null;
}

/** Powers the Lost/Found registry. RLS already scopes flagged items to their
 *  reporter and superadmins, so this query needs no role-branching itself. */
export async function listItems(params: ListItemsParams): Promise<Item[]> {
  let q = supabase
    .from('items')
    .select('*, reporter:profiles!items_reporter_id_fkey(handle)')
    .eq('kind', params.kind)
    .order('created_at', { ascending: false })
    .limit(50);

  if (params.filter === 'My posts') {
    if (!params.userId) return [];
    q = q.eq('reporter_id', params.userId);
  } else if (params.filter !== 'All') {
    q = q.eq('status', params.filter.toLowerCase() as Database['public']['Enums']['item_status']);
  }

  const term = params.query?.trim();
  if (term) {
    const escaped = term.replace(/[%,]/g, '');
    q = q.or(`title.ilike.%${escaped}%,location_text.ilike.%${escaped}%,display_id.ilike.%${escaped}%`);
  }

  const { data, error } = await q;
  if (error || !data) return [];
  return (data as ItemRow[]).map(toFrontendItem);
}

export interface CreateItemInput {
  kind: 'lost' | 'found';
  category: string;
  title: string;
  locationText: string;
  lat: number | null;
  lng: number | null;
  /** Free-text from the report form; parsed loosely, falls back to today. */
  occurredOn: string | null;
  description: string | null;
  reporterId: string;
}

/** `display_id` is intentionally sent as `null` (cast around the generated
 *  Insert type, which doesn't know about the trigger default) so the
 *  `set_item_display_id` trigger assigns the next LOST-###/FOUND-### id --
 *  see 0009_functions_and_triggers.sql. */
export async function createItem(input: CreateItemInput): Promise<Item> {
  const occurred = input.occurredOn ? new Date(input.occurredOn) : null;
  const occurredOn = occurred && !isNaN(occurred.getTime()) ? occurred.toISOString().slice(0, 10) : null;

  const row: Database['public']['Tables']['items']['Insert'] = {
    display_id: null as unknown as string,
    kind: input.kind,
    category: input.category as Database['public']['Enums']['item_category'],
    title: input.title,
    location_text: input.locationText,
    location_lat: input.lat,
    location_lng: input.lng,
    occurred_on: occurredOn,
    description: input.description,
    reporter_id: input.reporterId,
  };

  const { data, error } = await supabase
    .from('items')
    .insert(row)
    .select('*, reporter:profiles!items_reporter_id_fkey(handle)')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Could not submit the report.');
  return toFrontendItem(data as ItemRow);
}

export async function updateItemStatus(dbId: string, status: Status): Promise<void> {
  const { error } = await supabase.from('items').update({ status: STATUS_DB[status] }).eq('id', dbId);
  if (error) throw new Error(error.message);
}

export async function deleteItem(dbId: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', dbId);
  if (error) throw new Error(error.message);
}

/** Unique on (item_id, claimant_id) -- a second claim by the same person is a
 *  no-op rather than a duplicate conversation (see 0004_conversations_messages.sql). */
export async function claimItem(itemDbId: string, reporterId: string, claimantId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .upsert(
      { item_id: itemDbId, reporter_id: reporterId, claimant_id: claimantId },
      { onConflict: 'item_id,claimant_id', ignoreDuplicates: true },
    );
  if (error) throw new Error(error.message);
}

/** Admin-only (see Detail.tsx's `v.isAdmin` gate). Records the flag and marks
 *  the item `flagged` so it drops out of the public registry until a
 *  superadmin resolves it via `resolve_moderation_flag` (Phase 7). */
export async function flagItem(itemDbId: string, reason: string, flaggedBy: string): Promise<void> {
  const { error: flagError } = await supabase
    .from('moderation_flags')
    .insert({ target_type: 'item', target_id: itemDbId, reason, flagged_by: flaggedBy });
  if (flagError) throw new Error(flagError.message);
  await updateItemStatus(itemDbId, 'Flagged');
}

/** Uploads to the `item-photos` bucket under `<uploader>/<item>/<n>.<ext>` (matches
 *  the storage RLS policy's `(storage.foldername(name))[1] = auth.uid()` check --
 *  see 0011_storage.sql) and records the row the Detail sheet would read back. */
export async function uploadItemPhoto(itemDbId: string, uploaderId: string, blob: Blob, fileName: string): Promise<void> {
  const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
  const path = `${uploaderId}/${itemDbId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('item-photos').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
  });
  if (uploadError) throw new Error(uploadError.message);
  const { error: rowError } = await supabase.from('item_photos').insert({ item_id: itemDbId, storage_path: path });
  if (rowError) throw new Error(rowError.message);
}
