# Phase 6: Forum - Threads, Replies, Helpful Votes, Moderation

## Overview
Build the forum feature with real Supabase data: forum threads, replies, helpful vote tracking, and moderation status.

## What's Already Built
- ✅ Schema: forum_threads, forum_replies, forum_helpful_votes tables
- ✅ RLS policies for forum access and moderation
- ✅ UI components in src/screens/Forum.tsx (thread list, reply button, helpful button)
- ✅ Mock data in src/data/constants.ts (3 threads with replies)

## Phase 6 Work

### 1. API Layer (src/api/forum.ts) - NEW FILE
Implement four functions:

```typescript
// Load all threads, filtered by tag/status
loadThreads(userId, tag?: string): Promise<ForumThread[]>
  - Query forum_threads with profile joins for author
  - Count replies per thread
  - Track if current user marked thread as helpful
  - Format dates

// Load all replies for a thread
loadReplies(threadId, userId): Promise<ForumReply[]>
  - Query forum_replies with profile joins
  - Count helpful votes per reply
  - Track if current user voted on each reply
  - Sort by helpful count desc, then created_at asc

// User creates a new thread
createThread(userId, title, text, tag): Promise<Thread>
  - Insert into forum_threads
  - Return created thread with author profile

// User replies to thread
replyToThread(threadId, userId, body): Promise<Reply>
  - Insert into forum_replies
  - Return created reply with author profile
```

### 2. Store Integration (src/state/store.ts)
Add methods:

```typescript
loadForumSupabase = async () => {
  const threads = await api.loadThreads(userId, tag)
  setState({ threads })
}

createThreadSupabase = async () => {
  // Create with draft data from state
  await api.createThread(...)
  loadForumSupabase() // Reload
}

replyToThreadSupabase = async () => {
  // Create reply
  await api.replyToThread(...)
  loadMessagesSupabase(activeThread) // Reload replies
}

toggleThreadHelpful = async (threadId) => {
  // If not voted: insert into forum_helpful_votes (thread type)
  // If voted: delete from forum_helpful_votes
}

toggleReplyHelpful = async (replyId) => {
  // If not voted: insert into forum_helpful_votes (reply type)
  // If voted: delete from forum_helpful_votes
}
```

### 3. Selector Updates (src/state/selectors.ts)
Add bindings for:

```typescript
topics: [
  { name: 'Sighting', on: tag === 'Sighting', pick: () => setTag('Sighting') },
  { name: 'Question', on: tag === 'Question', ... },
  { name: 'Reunited', on: tag === 'Reunited', ... }
]

threads: st.threads.map(t => ({
  id: t.id,
  user: t.author_handle,
  ini: initials(t.author_handle),
  meta: `${formatTime(t.created_at)} · ${t.author_display_name}`,
  tag: t.tag,
  title: t.title,
  text: t.text,
  status: t.status,
  suspended: t.status === 'suspended',
  replyLabel: `${t.reply_count} ${t.reply_count === 1 ? 'reply' : 'replies'}`,
  helpfulCount: t.helpful_vote_count,
  isAdmin: isAdmin,
  open: () => setState({ sheet: 'forum', activeThread: t.id })
  helpful: () => toggleThreadHelpful(t.id)
}))

// For thread detail sheet:
activeThread: st.threads.find(t => t.id === st.activeThread)
replies: loadReplies when sheet opens
```

### 4. Testing Checklist
- [ ] Load forum threads from Supabase
- [ ] Filter threads by tag (Sighting/Question/Reunited)
- [ ] Open thread → see replies with helpful counts
- [ ] Helpful vote on thread (appears as user's vote, count increments)
- [ ] Helpful vote on reply (same behavior)
- [ ] Create new thread (appears in list immediately)
- [ ] Reply to thread (appears without page refresh)
- [ ] Moderation: suspended threads show visually muted (opacity, border)
- [ ] Regression: all 21 tests still pass
- [ ] End-to-end: two accounts create thread/reply, vote helpful, both see updates

## Implementation Order
1. **API layer** (forum.ts) - define the four query/mutation functions
2. **Store methods** - call API layer, manage state
3. **Selector bindings** - wire UI to store
4. **Test end-to-end** - Playwright test with two accounts

## Expected Outcome
Forum feature working end-to-end with real Supabase data, same as Phases 1-5.
