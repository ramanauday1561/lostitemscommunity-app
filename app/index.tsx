import { Redirect } from 'expo-router';

// AuthGate in _layout.tsx does the real routing; this just picks a landing spot.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
