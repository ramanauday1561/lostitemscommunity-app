import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/time';

export interface ForumThread {
  id: string;
  title: string;
  body: string;
  tag: 'Sighting' | 'Question' | 'Reunited';
  status: 'live' | 'suspended';
  author_id: string;
  author_handle: string;
  author_display_name: string;
  created_at: string;
  reply_count: number;
  helpful_vote_count: number;
  user_voted_helpful: boolean;
}

export interface ForumReply {
  id: string;
  thread_id: string;
  body: string;
  author_id: string;
  author_handle: string;
  author_display_name: string;
  created_at: string;
}

/** Load all forum threads, optionally filtered by tag. Row-level security decides what the caller may see
 *  (live threads, their own, and everything for a superadmin) so a suspended thread stays reachable for the
 *  admin who has to restore it; the screen hides suspended threads from members.
 *  Returns threads with author profiles, reply counts, and helpful vote tracking. */
export async function loadThreads(userId: string, tag?: string): Promise<ForumThread[]> {
  let query = supabase
    .from('forum_threads')
    .select(`
      id,
      title,
      body,
      tag,
      status,
      author_id,
      created_at,
      helpful_count,
      author:profiles!author_id(handle, display_name),
      replies:forum_replies(id),
      thread_votes:forum_thread_votes!left(user_id)
    `)
    .order('created_at', { ascending: false });

  if (tag && (tag === 'Sighting' || tag === 'Question' || tag === 'Reunited')) {
    query = query.eq('tag', tag);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return ((data ?? []) as any[]).map((t) => {
    const author = Array.isArray(t.author) ? t.author[0] : t.author;
    const replies = t.replies || [];
    const votes = t.thread_votes || [];
    const userVoted = votes.some((v: any) => v.user_id === userId);

    return {
      id: t.id,
      title: t.title,
      body: t.body,
      tag: t.tag,
      status: t.status,
      author_id: t.author_id,
      author_handle: author?.handle || 'Unknown',
      author_display_name: author?.display_name || 'Unknown',
      created_at: formatTime(t.created_at),
      reply_count: replies.length,
      helpful_vote_count: t.helpful_count || 0,
      user_voted_helpful: userVoted,
    };
  });
}

/** Load all replies for a thread, ordered by created_at.
 *  Returns replies with author profiles. */
export async function loadReplies(threadId: string, userId: string): Promise<ForumReply[]> {
  const { data, error } = await supabase
    .from('forum_replies')
    .select(`
      id,
      thread_id,
      body,
      author_id,
      created_at,
      author:profiles!author_id(handle, display_name)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return (data as any[]).map((r) => {
    const author = Array.isArray(r.author) ? r.author[0] : r.author;

    return {
      id: r.id,
      thread_id: r.thread_id,
      body: r.body,
      author_id: r.author_id,
      author_handle: author?.handle || 'Unknown',
      author_display_name: author?.display_name || 'Unknown',
      created_at: formatTime(r.created_at),
    };
  });
}

/** Create a new forum thread. */
export async function createThread(userId: string, title: string, text: string, tag: 'Sighting' | 'Question' | 'Reunited'): Promise<void> {
  if (!title.trim() || !text.trim()) return;

  const { error } = await supabase.from('forum_threads').insert({
    author_id: userId,
    title: title.trim(),
    body: text.trim(),
    tag,
    status: 'live',
  });

  if (error) throw new Error(error.message);
}

/** Reply to a forum thread. */
export async function replyToThread(threadId: string, userId: string, body: string): Promise<void> {
  if (!body.trim()) return;

  const { error } = await supabase.from('forum_replies').insert({
    thread_id: threadId,
    author_id: userId,
    body: body.trim(),
  });

  if (error) throw new Error(error.message);
}

/** Toggle helpful vote on a thread.
 *  If user already voted, removes the vote. Otherwise adds it. */
export async function toggleThreadHelpful(threadId: string, userId: string): Promise<void> {
  // Check if user already voted
  const { data: existing, error: queryError } = await supabase
    .from('forum_thread_votes')
    .select('thread_id')
    .eq('thread_id', threadId)
    .eq('user_id', userId)
    .maybeSingle();

  if (queryError) throw new Error(queryError.message);

  if (existing) {
    // Remove vote
    const { error } = await supabase
      .from('forum_thread_votes')
      .delete()
      .eq('thread_id', threadId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  } else {
    // Add vote
    const { error } = await supabase.from('forum_thread_votes').insert({
      thread_id: threadId,
      user_id: userId,
    });
    if (error) throw new Error(error.message);
  }
}

/** Admin: Suspend a thread (hide from regular users) */
export async function suspendThread(threadId: string): Promise<void> {
  const { error } = await supabase
    .from('forum_threads')
    .update({ status: 'suspended' })
    .eq('id', threadId);
  if (error) throw new Error(error.message);
}

/** Admin: Restore a suspended thread */
export async function restoreThread(threadId: string): Promise<void> {
  const { error } = await supabase
    .from('forum_threads')
    .update({ status: 'live' })
    .eq('id', threadId);
  if (error) throw new Error(error.message);
}

/** Admin: Delete a thread permanently */
export async function deleteThread(threadId: string): Promise<void> {
  const { error } = await supabase
    .from('forum_threads')
    .delete()
    .eq('id', threadId);
  if (error) throw new Error(error.message);
}
