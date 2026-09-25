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
