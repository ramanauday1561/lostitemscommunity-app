import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenPlaceholder } from '@/components/ui';
import { colors } from '@/theme/tokens';

export default function Forum() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScreenPlaceholder name="Community Forum" phase="Phase 4 — Forum" />
    </SafeAreaView>
  );
}
