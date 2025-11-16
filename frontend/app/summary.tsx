/**
 * Libra - Debate Summary Screen
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { DebateColors } from '@/constants/theme';
import { useDebateStore } from '@/store/debateStore';

export default function SummaryScreen() {
  const { session, reset } = useDebateStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!session) {
    router.replace('/');
    return null;
  }

  const handleStartNewDebate = () => {
    reset();
    router.replace('/');
  };

  // Calculate stats
  const totalTurns = session.turns.length;
  const totalFallacies = session.turns.reduce(
    (acc, turn) => acc + turn.fallacies.length,
    0
  );
  const totalFactChecks = session.turns.reduce(
    (acc, turn) => acc + turn.factChecks.length,
    0
  );

  // Group turns by speaker
  const speaker1Turns = session.turns.filter((t) => t.speaker === 'A');
  const speaker2Turns = session.turns.filter((t) => t.speaker === 'B');

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[DebateColors.accent.purple, DebateColors.background.primary]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Hero Header */}
      <Animated.View
        style={[styles.heroHeader, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        <View style={styles.trophyIcon}>
          <View style={styles.trophyInner} />
        </View>
        <Text style={styles.heroTitle}>Debate{'\n'}Complete</Text>
        <Text style={styles.heroSubtitle}>{totalTurns} turns · Analysis ready</Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Big Hero Stats */}
        <Animated.View
          style={[styles.heroStats, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.mainStat}>
            <Text style={styles.mainStatNumber}>{totalFallacies}</Text>
            <Text style={styles.mainStatLabel}>Logical Fallacies</Text>
            <View style={[styles.statUnderline, { backgroundColor: DebateColors.status.warning }]} />
          </View>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatNumber}>{totalFactChecks}</Text>
            <Text style={styles.mainStatLabel}>Fact Checks</Text>
            <View style={[styles.statUnderline, { backgroundColor: DebateColors.speaker1.primary }]} />
          </View>
        </Animated.View>

        {/* Speaker Sections - Timeline Style */}
        <Animated.View style={[styles.timelineContainer, { opacity: fadeAnim }]}>
          {/* Speaker 1 */}
          <LinearGradient
            colors={[...DebateColors.speaker1.gradient].reverse()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.speakerCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.speakerBadge}>
                <Text style={styles.badgeText}>1</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.speakerName}>Speaker 1</Text>
                <Text style={styles.speakerMeta}>{speaker1Turns.length} turns</Text>
              </View>
            </View>
            {speaker1Turns.length > 0 && (
              <View style={styles.cardStats}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>
                    {speaker1Turns.reduce((acc, t) => acc + t.fallacies.length, 0)}
                  </Text>
                  <Text style={styles.miniStatLabel}>Fallacies</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>
                    {speaker1Turns.reduce((acc, t) => acc + t.factChecks.length, 0)}
                  </Text>
                  <Text style={styles.miniStatLabel}>Fact Checks</Text>
                </View>
              </View>
            )}
          </LinearGradient>

          {/* Speaker 2 */}
          <LinearGradient
            colors={[...DebateColors.speaker2.gradient].reverse()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.speakerCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.speakerBadge}>
                <Text style={styles.badgeText}>2</Text>
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.speakerName}>Speaker 2</Text>
                <Text style={styles.speakerMeta}>{speaker2Turns.length} turns</Text>
              </View>
            </View>
            {speaker2Turns.length > 0 && (
              <View style={styles.cardStats}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>
                    {speaker2Turns.reduce((acc, t) => acc + t.fallacies.length, 0)}
                  </Text>
                  <Text style={styles.miniStatLabel}>Fallacies</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniStatValue}>
                    {speaker2Turns.reduce((acc, t) => acc + t.factChecks.length, 0)}
                  </Text>
                  <Text style={styles.miniStatLabel}>Fact Checks</Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Action Button */}
      <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleStartNewDebate}
        >
          <Text style={styles.actionButtonText}>Start New Debate</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DebateColors.background.primary,
  },
  heroHeader: {
    paddingTop: 60,
    paddingHorizontal: 32,
    paddingBottom: 30,
    alignItems: 'center',
  },
  trophyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 3,
    borderColor: DebateColors.accent.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  trophyInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DebateColors.accent.purple,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: DebateColors.text.primary,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 52,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: DebateColors.text.tertiary,
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    paddingVertical: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainStat: {
    alignItems: 'center',
  },
  mainStatNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: DebateColors.text.primary,
    letterSpacing: -2,
    marginBottom: 8,
  },
  mainStatLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DebateColors.text.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  statUnderline: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  timelineContainer: {
    gap: 20,
  },
  speakerCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  speakerBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  badgeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardHeaderText: {
    flex: 1,
  },
  speakerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  speakerMeta: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.2,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 20,
  },
  miniStat: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -1,
  },
  miniStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  actions: {
    padding: 24,
    paddingBottom: 32,
    backgroundColor: DebateColors.background.primary,
  },
  actionButton: {
    backgroundColor: DebateColors.accent.purple,
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: DebateColors.accent.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

