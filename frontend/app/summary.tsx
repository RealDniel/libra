/**
 * Libra - Debate Summary Screen
 */

import React, { useEffect, useRef, useMemo } from 'react';
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
import { router, usePathname } from 'expo-router';
import { DebateColors } from '@/constants/theme';
import { useDebateStore } from '@/store/debateStore';

export default function SummaryScreen() {
  const { session, reset, speakerNames } = useDebateStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pathname = usePathname();

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

  // Redirect if no session
  useEffect(() => {
    if (pathname === '/summary' && !session) {
      const id = setTimeout(() => router.replace('/'), 0);
      return () => clearTimeout(id);
    }
  }, [pathname, session]);

  if (!session) {
    return null;
  }

  const allTurns = session?.turns ?? [];
  const speaker1Turns = allTurns.filter((t) => t.speaker === 'A');
  const speaker2Turns = allTurns.filter((t) => t.speaker === 'B');

  // Aggregate all fallacies per speaker
  const speaker1Fallacies = useMemo(() => {
    const fallacies: any[] = [];
    for (const turn of speaker1Turns) {
      fallacies.push(...turn.fallacies);
    }
    return fallacies;
  }, [speaker1Turns]);

  const speaker2Fallacies = useMemo(() => {
    const fallacies: any[] = [];
    for (const turn of speaker2Turns) {
      fallacies.push(...turn.fallacies);
    }
    return fallacies;
  }, [speaker2Turns]);

  // Aggregate all fact-checks
  const allFactChecks = useMemo(() => {
    const factChecks: any[] = [];
    for (const turn of allTurns) {
      for (const fc of turn.factChecks) {
        factChecks.push({ ...fc, speaker: turn.speaker });
      }
    }
    return factChecks;
  }, [allTurns]);

  // Count verdicts
  const falseCount = allFactChecks.filter((fc) => fc.verdict === 'false').length;
  const verifiedCount = allFactChecks.filter((fc) => fc.verdict === 'verified' || fc.verdict === 'true').length;
  const unverifiableCount = allFactChecks.filter((fc) => fc.verdict === 'unverifiable').length;

  const handleStartNewDebate = () => {
    reset();
    router.replace('/');
  };

  const speaker1Name = speakerNames?.A || 'Speaker A';
  const speaker2Name = speakerNames?.B || 'Speaker B';

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[DebateColors.accent.purple, DebateColors.background.primary] as any}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Hero Header */}
      <Animated.View
        style={[styles.heroHeader, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        <View style={styles.trophyIcon}>
          <Text style={styles.trophyEmoji}>🏆</Text>
        </View>
        <Text style={styles.heroTitle}>Debate{'\n'}Complete</Text>
        <Text style={styles.heroSubtitle}>{allTurns.length} turns analyzed</Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Speaker 1 Summary */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.sectionHeader, { backgroundColor: DebateColors.speaker1.primary }]}>
            <View style={styles.speakerIconContainer}>
              <View style={[styles.speakerIcon, { backgroundColor: DebateColors.speaker1.secondary }]}>
                <Text style={styles.speakerIconText}>1</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>{speaker1Name}</Text>
          </View>

          {/* Fallacies */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Logical Fallacies</Text>
              <View style={[styles.badge, { backgroundColor: DebateColors.status.warning }]}>
                <Text style={styles.badgeText}>{speaker1Fallacies.length}</Text>
              </View>
            </View>
            {speaker1Fallacies.length === 0 ? (
              <Text style={styles.emptyText}>✓ No fallacies detected</Text>
            ) : (
              speaker1Fallacies.map((fallacy, index) => (
                <View key={index} style={styles.fallacyItem}>
                  <Text style={styles.fallacyType}>• {fallacy.type}</Text>
                  {fallacy.quote && (
                    <Text style={styles.fallacyQuote}>"{fallacy.quote}"</Text>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Main Points - Placeholder for now */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Key Arguments</Text>
            </View>
            <Text style={styles.placeholderText}>AI-generated summary coming soon...</Text>
          </View>
        </Animated.View>

        {/* Speaker 2 Summary */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.sectionHeader, { backgroundColor: DebateColors.speaker2.primary }]}>
            <View style={styles.speakerIconContainer}>
              <View style={[styles.speakerIcon, { backgroundColor: DebateColors.speaker2.secondary }]}>
                <Text style={styles.speakerIconText}>2</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>{speaker2Name}</Text>
          </View>

          {/* Fallacies */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Logical Fallacies</Text>
              <View style={[styles.badge, { backgroundColor: DebateColors.status.warning }]}>
                <Text style={styles.badgeText}>{speaker2Fallacies.length}</Text>
              </View>
            </View>
            {speaker2Fallacies.length === 0 ? (
              <Text style={styles.emptyText}>✓ No fallacies detected</Text>
            ) : (
              speaker2Fallacies.map((fallacy, index) => (
                <View key={index} style={styles.fallacyItem}>
                  <Text style={styles.fallacyType}>• {fallacy.type}</Text>
                  {fallacy.quote && (
                    <Text style={styles.fallacyQuote}>"{fallacy.quote}"</Text>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Main Points - Placeholder for now */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Key Arguments</Text>
            </View>
            <Text style={styles.placeholderText}>AI-generated summary coming soon...</Text>
          </View>
        </Animated.View>

        {/* Fact-Check Summary */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.sectionHeader, { backgroundColor: DebateColors.accent.purple }]}>
            <Text style={styles.sectionTitle}>Fact-Check Summary</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statCircle, { backgroundColor: DebateColors.status.false }]}>
                  <Text style={styles.statNumber}>{falseCount}</Text>
                </View>
                <Text style={styles.statLabel}>False</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statCircle, { backgroundColor: DebateColors.status.verified }]}>
                  <Text style={styles.statNumber}>{verifiedCount}</Text>
                </View>
                <Text style={styles.statLabel}>Verified</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statCircle, { backgroundColor: DebateColors.status.uncertain }]}>
                  <Text style={styles.statNumber}>{unverifiableCount}</Text>
                </View>
                <Text style={styles.statLabel}>Unverifiable</Text>
              </View>
            </View>
          </View>

          {/* Show false claims in detail */}
          {falseCount > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>False Claims</Text>
              </View>
              {allFactChecks
                .filter((fc) => fc.verdict === 'false')
                .map((fc, index) => (
                  <View key={index} style={styles.factCheckItem}>
                    <View style={styles.factCheckHeader}>
                      <Text style={styles.factCheckSpeaker}>
                        {fc.speaker === 'A' ? speaker1Name : speaker2Name}
                      </Text>
                    </View>
                    <Text style={styles.factCheckClaim}>"{fc.claim}"</Text>
                    <Text style={styles.factCheckExplanation}>{fc.explanation}</Text>
                  </View>
                ))}
            </View>
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
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
          <Text style={styles.actionButtonText}>New Debate</Text>
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
  trophyEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '400',
    color: DebateColors.text.primary,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 52,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: DebateColors.text.tertiary,
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  speakerIconContainer: {
    width: 32,
    height: 32,
  },
  speakerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: DebateColors.text.primary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DebateColors.text.primary,
    flex: 1,
  },
  card: {
    backgroundColor: DebateColors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DebateColors.background.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DebateColors.text.primary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: DebateColors.text.primary,
  },
  emptyText: {
    fontSize: 14,
    color: DebateColors.status.verified,
    fontStyle: 'italic',
  },
  fallacyItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: DebateColors.background.border,
  },
  fallacyType: {
    fontSize: 14,
    fontWeight: '600',
    color: DebateColors.text.primary,
    marginBottom: 4,
  },
  fallacyQuote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: DebateColors.text.secondary,
    marginLeft: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: DebateColors.text.tertiary,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: DebateColors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: DebateColors.text.secondary,
  },
  factCheckItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: DebateColors.background.border,
  },
  factCheckHeader: {
    marginBottom: 8,
  },
  factCheckSpeaker: {
    fontSize: 12,
    fontWeight: '600',
    color: DebateColors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  factCheckClaim: {
    fontSize: 14,
    fontWeight: '600',
    color: DebateColors.text.primary,
    marginBottom: 6,
  },
  factCheckExplanation: {
    fontSize: 13,
    color: DebateColors.text.secondary,
    lineHeight: 18,
  },
  actions: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  actionButton: {
    backgroundColor: DebateColors.accent.purple,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DebateColors.accent.purple,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DebateColors.text.primary,
    letterSpacing: 0.5,
  },
});
