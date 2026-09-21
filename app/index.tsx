import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { StoreProvider } from '../src/StoreProvider';
import { App } from '../src/App';
import { C } from '../src/theme/tokens';

export default function Index() {
  const [loaded] = useFonts({
    'PublicSans-400': require('../assets/fonts/PublicSans-400.ttf'),
    'PublicSans-500': require('../assets/fonts/PublicSans-500.ttf'),
    'PublicSans-600': require('../assets/fonts/PublicSans-600.ttf'),
    'PublicSans-700': require('../assets/fonts/PublicSans-700.ttf'),
    'PublicSans-800': require('../assets/fonts/PublicSans-800.ttf'),
    'IBMPlexMono-400': require('../assets/fonts/IBMPlexMono-400.ttf'),
    'IBMPlexMono-500': require('../assets/fonts/IBMPlexMono-500.ttf'),
    'IBMPlexMono-600': require('../assets/fonts/IBMPlexMono-600.ttf'),
    MaterialSymbolsRounded: require('../assets/fonts/MaterialSymbolsRounded.ttf'),
  });

  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
