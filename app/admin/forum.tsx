import React from 'react';
import { ScreenPlaceholder } from '@/components/ui';

/**
 * The prototype's admin bottom nav ends on Forum, pointing at the same
 * community forum members see - an admin moderates it in place rather
 * than through a separate screen. Phase 4 builds the forum itself; this
 * exists so the tab the prototype specifies is present and lands
 * somewhere honest.
 */
export default function AdminForumScreen() {
  return <ScreenPlaceholder name="Community Forum" phase="Phase 4 — Forum" />;
}
