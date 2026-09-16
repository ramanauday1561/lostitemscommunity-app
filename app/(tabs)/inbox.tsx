import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenPlaceholder } from '@/components/ui';
import { colors } from '@/theme/tokens';

export default function Inbox() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScreenPlaceholder name="Messages Inbox" phase="Phase 3 — Messaging" />
    </SafeAreaView>
  );
}
