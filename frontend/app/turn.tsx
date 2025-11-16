/**
 * Libra - Turn Screen (Recording)
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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { DebateColors } from '@/constants/theme';
import { useDebateStore } from '@/store/debateStore';

export default function TurnScreen() {
  const { currentTurn, updateTimer, setRecording } = useDebateStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  if (!currentTurn) {
    router.replace('/');
    return null;
  }

  const speakerNum = currentTurn.speaker === 'A' ? 1 : 2;
  const colors =
    currentTurn.speaker === 'A'
      ? DebateColors.speaker1
      : DebateColors.speaker2;

  const isRecording = currentTurn.status === 'recording';
  const isIdle = currentTurn.status === 'idle';

  // Format time as mm:ss
  const minutes = Math.floor(currentTurn.timeRemaining / 60);
  const seconds = currentTurn.timeRemaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Pulse animation for recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isRecording && currentTurn.timeRemaining > 0) {
      timerInterval.current = setInterval(() => {
        updateTimer(currentTurn.timeRemaining - 1);
        if (currentTurn.timeRemaining <= 1) {
          handleStop();
        }
      }, 1000);
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isRecording, currentTurn.timeRemaining]);

  const handleMicPress = () => {
    if (isIdle) {
      // Start recording
      setRecording(true);
    } else if (isRecording) {
      // Stop recording
      handleStop();
    }
  };

  const handleStop = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    setRecording(false);
    // Navigate to analysis
    router.push('/analysis');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[...colors.gradient].reverse()}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.speakerTitle}>Speaker {speakerNum}</Text>
            <Animated.Text
              style={[
                styles.timer,
                isRecording && currentTurn.timeRemaining <= 10 && styles.timerWarning,
              ]}
            >
              {timeDisplay}
            </Animated.Text>
          </View>

          {/* Mic Button */}
          <View style={styles.micContainer}>
            {/* Outer glow ring for recording */}
            {isRecording && (
              <Animated.View
                style={[
                  styles.glowRing,
                  {
                    backgroundColor: colors.glow,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
            )}
            
            <Pressable
              style={({ pressed }) => [
                styles.micButton,
                { 
                  backgroundColor: colors.primary,
                  shadowColor: colors.glow,
                },
                pressed && styles.micButtonPressed,
              ]}
              onPress={handleMicPress}
            >
              <Animated.View
                style={[
                  styles.micInner,
                  isRecording && { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={[styles.micIcon, { borderColor: colors.text }]}>
                  {isRecording ? (
                    <View style={[styles.stopSquare, { backgroundColor: colors.text }]} />
                  ) : (
                    <View style={[styles.micDot, { backgroundColor: colors.text }]} />
                  )}
                </View>
                <Text style={styles.micLabel}>
                  {isIdle ? 'Start' : 'Stop & Analyze'}
                </Text>
              </Animated.View>
            </Pressable>
          </View>

          {/* Status */}
          <View style={styles.footer}>
            <Text style={styles.status}>
              {isRecording
                ? 'Recording in progress... Press to stop'
                : 'Press start to begin your turn'}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
  },
  speakerTitle: {
    fontSize: 28,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 20,
    letterSpacing: 1,
  },
  timer: {
    fontSize: 72,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  timerWarning: {
    color: '#FF5A5F',
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.4,
  },
  micButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  micButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  micInner: {
    alignItems: 'center',
  },
  micIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  micDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  stopSquare: {
    width: 18,
    height: 18,
    borderRadius: 3,
  },
  micLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  status: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 32,
    letterSpacing: 0.3,
  },
});

