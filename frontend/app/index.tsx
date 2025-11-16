/**
 * Libra - Home Screen
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { DebateColors } from '@/constants/theme';
import { useDebateStore } from '@/store/debateStore';

export default function HomeScreen() {
  const { startDebate, startTurn, reset } = useDebateStore();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Subtle rotation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleNewDebate = () => {
    reset();
    startDebate();
    startTurn('A'); // Start with Speaker A
    router.push('/turn');
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Background floating elements */}
      <View style={styles.backgroundElements}>
        <Animated.View
          style={[
            styles.floatingCircle,
            styles.circle1,
            { transform: [{ translateY: floatAnim }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingCircle,
            styles.circle2,
            { transform: [{ translateY: floatAnim }] },
          ]}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          {/* Logo with animations */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { rotate },
                  { translateY: floatAnim },
                ],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>L</Text>
            </View>
          </Animated.View>
          
          <Text style={styles.title}>Libra</Text>
          <Text style={styles.subtitle}>
            Real-time debate analysis{'\n'}and fact-checking
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNewDebate}
          >
            <Text style={styles.buttonText}>Start New Debate</Text>
          </Pressable>
          
          <View style={styles.betaTag}>
            <Text style={styles.betaText}>BETA</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DebateColors.background.primary,
    position: 'relative',
  },
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: DebateColors.speaker1.primary,
    top: -100,
    left: -80,
  },
  circle2: {
    width: 250,
    height: 250,
    backgroundColor: DebateColors.speaker2.primary,
    bottom: -50,
    right: -100,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 32,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DebateColors.background.secondary,
    borderWidth: 2,
    borderColor: DebateColors.background.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: DebateColors.speaker1.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 56,
    fontWeight: '300',
    color: DebateColors.text.primary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 42,
    fontWeight: '200',
    color: DebateColors.text.primary,
    marginBottom: 12,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: DebateColors.text.tertiary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: DebateColors.speaker1.primary,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: DebateColors.speaker1.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: DebateColors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  betaTag: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: DebateColors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DebateColors.background.border,
  },
  betaText: {
    fontSize: 11,
    fontWeight: '700',
    color: DebateColors.text.tertiary,
    letterSpacing: 2,
  },
});

