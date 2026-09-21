import { View, Text } from 'react-native';
import { Button, Chip } from 'heroui-native';

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text>HeroUI web smoke test</Text>
      <Chip><Chip.Label>Active</Chip.Label></Chip>
      <Button>Tap</Button>
    </View>
  );
}
