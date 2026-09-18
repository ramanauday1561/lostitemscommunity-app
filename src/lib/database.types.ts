/**
 * Hand-maintained subset of the generated Supabase types, covering what the
 * app actually reads and writes today. Regenerate the full file any time the
 * schema changes:
 *
 *   npx supabase gen types typescript --project-id rxplhljuaqdpghvarjbb > src/lib/database.types.ts
 */

export type ItemKind = 'lost' | 'found';
export type ItemStatus = 'active' | 'resolved' | 'removed';
export type ModerationStatus = 'pending' | 'approved' | 'removed';

export type ContactSharingPref = 'after_match' | 'always' | 'never';
export type UserRole = 'member' | 'admin';

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
};

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  role: UserRole;
  contact_sharing_pref: ContactSharingPref;
  is_suspended: boolean;
  created_at: string;
};

export type Item = {
  id: string;
  short_code: string;
  reporter_id: string;
  kind: ItemKind;
  title: string;
  description: string | null;
  category_id: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  date_occurred: string | null;
  status: ItemStatus;
  moderation_status: ModerationStatus;
  flagged_count: number;
  created_at: string;
  updated_at: string;
};

/** An item row joined with its category, as the registry list renders it. */
export type ItemWithCategory = Item & {
  categories: Pick<Category, 'id' | 'name' | 'icon'> | null;
};

