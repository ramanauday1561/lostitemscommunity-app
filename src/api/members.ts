import { supabase } from '../lib/supabase';

export interface Member {
  id: string;
  username: string;
  handle: string;
  display_name: string;
  email: string;
  role: 'user' | 'superadmin';
  is_suspended: boolean;
  post_count: number;
  created_at: string;
  guidelines_accepted_at: string | null;
}

// Load all members (superadmin only)
export async function loadMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Search members by username, handle, or display_name
export async function searchMembers(query: string): Promise<Member[]> {
  if (!query.trim()) {
    return loadMembers();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(
      `username.ilike.%${query}%,handle.ilike.%${query}%,display_name.ilike.%${query}%`
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Suspend a member
export async function suspendMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: true })
    .eq('id', memberId);

  if (error) throw error;
}

// Restore a suspended member
export async function restoreMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: false })
    .eq('id', memberId);

  if (error) throw error;
}

// Remove a member (soft delete to deleted_profiles)
export async function removeMember(memberId: string): Promise<void> {
  // This would typically be done via an RPC function for atomicity
  // For now, we update is_suspended and note that the member should be
  // moved to deleted_profiles in production via an Edge Function
  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: true })
    .eq('id', memberId);

  if (error) throw error;

  // Note: In production, also call supabase.auth.admin.deleteUser()
  // via an Edge Function to disable login
}

// Get member details
export async function getMember(memberId: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', memberId)
    .single();

  if (error) return null;
  return data;
}
