/**
 * Libra - Analysis Screen (Per-Turn Summary)
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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { DebateColors } from '@/constants/theme';
import { useDebateStore } from '@/store/debateStore';

const { width } = Dimensions.get('window');

export default function AnalysisScreen() {
  const { currentTurn, completeTurn, nextSpeaker, endDebate } = useDebateStore();
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Gradient animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  if (!currentTurn) {
    router.replace('/');
    return null;
  }

  const speakerNum = currentTurn.speaker === 'A' ? 1 : 2;

  const handleNextSpeaker = () => {
    completeTurn();
    nextSpeaker();
    router.push('/turn');
  };

  const handleEndDebate = () => {
    completeTurn();
    endDebate();
    router.push('/summary');
  };

  const fallacies = currentTurn.fallacies ?? [];
  const factChecks = currentTurn.factChecks ?? [];
  const verdictColor = (v: 'true' | 'false' | 'misleading' | 'unverifiable') => {
    if (v === 'true') return DebateColors.status.true;
    if (v === 'false') return DebateColors.status.false;
    if (v === 'misleading') return DebateColors.status.warning;
    return DebateColors.status.uncertain;
  };
  const verdictLabel = (v: 'true' | 'false' | 'misleading' | 'unverifiable') => {
    if (v === 'true') return 'TRUE';
    if (v === 'false') return 'FALSE';
    if (v === 'misleading') return 'MISLEADING';
    return 'UNCERTAIN';
  };

  const speakerColors =
    currentTurn.speaker === 'A'
      ? DebateColors.speaker1
      : DebateColors.speaker2;

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated gradient background */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}>
        <LinearGradient
          colors={[speakerColors.primary, speakerColors.secondary, DebateColors.background.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Header with animated number badge */}
      <Animated.View
        style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Speaker {speakerNum}</Text>
            <Text style={styles.headerSubtitle}>Analysis Complete</Text>
          </View>
          <View style={[styles.speakerBadge, { backgroundColor: speakerColors.primary }]}>
            <Text style={styles.badgeNumber}>{speakerNum}</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Logical Fallacies - Clean Cards */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sectionHeaderClean}>
            <Text style={styles.sectionTitleLarge}>Logical Fallacies</Text>
            <View style={[styles.countPill, { backgroundColor: DebateColors.status.warning }]}>
              <Text style={styles.countPillText}>{fallacies.length}</Text>
            </View>
          </View>
          {fallacies.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardTitle}>✓ No Fallacies Detected</Text>
              <Text style={styles.emptyCardText}>Your argument appears logically sound.</Text>
            </View>
          ) : (
            fallacies.map((fallacy, index) => (
            <Animated.View
              key={fallacy.id}
              style={[
                styles.cleanCard,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, (index + 1) * 5],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.cardLeftAccent} />
              <View style={styles.cleanCardContent}>
                <Text style={styles.cleanCardTitle}>{fallacy.type}</Text>
                <Text style={styles.cleanCardText}>{fallacy.explanation}</Text>
              </View>
            </Animated.View>
          )))}
        </Animated.View>

        {/* Fact Checks - Clean List */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sectionHeaderClean}>
            <Text style={styles.sectionTitleLarge}>Fact Checks</Text>
            <View style={[styles.countPill, { backgroundColor: speakerColors.primary }]}>
              <Text style={styles.countPillText}>{factChecks.length}</Text>
            </View>
          </View>
          {factChecks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardTitle}>✓ No Claims Detected</Text>
              <Text style={styles.emptyCardText}>No verifiable claims were made in this turn.</Text>
            </View>
          ) : (
            factChecks.map((fact, index) => (
            <Animated.View
              key={fact.id}
              style={[
                styles.cleanCard,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, (index + 1) * 5],
                    }),
                  }],
                },
              ]}
            >
              <View
                style={[
                  styles.cardLeftAccent,
                  { backgroundColor: verdictColor(fact.verdict) },
                ]}
              />
              <View style={styles.cleanCardContent}>
                <View style={styles.factHeaderRow}>
                  <Text style={styles.cleanCardTitle}>{fact.claim}</Text>
                  <View
                    style={[
                      styles.statusTag,
                      { backgroundColor: verdictColor(fact.verdict) },
                    ]}
                  >
                    <Text style={styles.statusTagText}>
                      {verdictLabel(fact.verdict)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cleanCardText}>{fact.explanation}</Text>
              </View>
            </Animated.View>
          )))}
        </Animated.View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: speakerColors.primary },
            pressed && styles.buttonPressed,
          ]}
          onPress={handleNextSpeaker}
        >
          <Text style={styles.primaryButtonText}>Next Speaker</Text>
          <Text style={styles.arrow}>→</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleEndDebate}
        >
          <Text style={styles.secondaryButtonText}>End Debate</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    paddingTop: 60,
    backgroundColor: 'transparent',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: DebateColors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: DebateColors.text.tertiary,
    letterSpacing: 0.2,
  },
  speakerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  countBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  countText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DebateColors.text.primary,
    letterSpacing: -0.3,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    backgroundColor: DebateColors.accent.cyan,
  },
  transcriptText: {
    fontSize: 16,
    fontWeight: '400',
    color: DebateColors.text.primary,
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  // Clean Section Header (horizontal layout with pill)
  sectionHeaderClean: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: DebateColors.text.primary,
    letterSpacing: -0.5,
  },
  countPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 44,
    alignItems: 'center',
  },
  countPillText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Clean Cards (aligned, left accent bar)
  cleanCard: {
    backgroundColor: DebateColors.background.card,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DebateColors.background.border,
  },
  cardLeftAccent: {
    width: 4,
    backgroundColor: DebateColors.status.warning,
  },
  cleanCardContent: {
    flex: 1,
    padding: 20,
  },
  cleanCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: DebateColors.text.primary,
    marginBottom: 8,
    lineHeight: 24,
  },
  cleanCardText: {
    fontSize: 14,
    color: DebateColors.text.secondary,
    lineHeight: 20,
  },
  // Fact Check Specific
  factHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  actions: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: DebateColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginRight: 8,
  },
  arrow: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: DebateColors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptyCard: {
    backgroundColor: DebateColors.background.card,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: DebateColors.background.border,
    alignItems: 'center',
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DebateColors.status.verified,
    marginBottom: 8,
  },
  emptyCardText: {
    fontSize: 14,
    color: DebateColors.text.tertiary,
    textAlign: 'center',
  },
});

