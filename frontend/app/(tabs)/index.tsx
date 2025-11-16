import React from 'react';
import { StyleSheet, Pressable, View, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Libra</ThemedText>
        <ThemedText style={styles.subtitle}>
          Real-time debate analysis & fact-checking
        </ThemedText>

        {/* Start New Debate Button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push('/index')}
        >
          <Text style={styles.buttonText}>Start New Debate</Text>
        </Pressable>

        {/* View History Button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.secondaryButtonText}>📚 View History</Text>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    borderWidth: 1,
    borderColor: '#a78bfa',
  },
  secondaryButton: {
    backgroundColor: '#1a1228',
    borderWidth: 1,
    borderColor: '#2a1f3d',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cbd5e1',
    letterSpacing: 0.5,
  },
});
