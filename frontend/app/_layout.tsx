/**
 * Libra - Root Layout
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <>
      <Stack 
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0E1A' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="turn" />
        <Stack.Screen name="analysis" />
        <Stack.Screen name="summary" />
        <Stack.Screen name="history" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
