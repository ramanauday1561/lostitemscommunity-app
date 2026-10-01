/** "09:15" for today, "Sep 20" otherwise -- the timestamp style used across chat, forum, support and notifications. */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}
