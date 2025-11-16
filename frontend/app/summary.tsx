/**
 * Libra - Debate Summary Screen
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const { session, reset } = useDebateStore();
  const [selected, setSelected] = useState<{ speaker: 'A' | 'B'; category: string; sentences: string[] } | null>(null);
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

  // Always compute turns and aggregates so hooks run every render
  const allTurns = session?.turns ?? [];
  const speaker1Turns = allTurns.filter((t) => t.speaker === 'A');
  const speaker2Turns = allTurns.filter((t) => t.speaker === 'B');

  // Aggregate fallacies per speaker by category -> sentences
  const speaker1Fallacies = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const turn of speaker1Turns) {
      for (const f of turn.fallacies) {
        const key = (f as any).category || (f as any).type || 'Unknown';
        const sentences = Array.isArray((f as any).sentences) ? (f as any).sentences : ((f as any).sentence ? [(f as any).sentence] : []);
        if (!map[key]) map[key] = [];
        map[key].push(...sentences);
      }
    }
    return Object.entries(map).map(([category, sentences]) => ({ category, sentences }));
  }, [speaker1Turns]);

  const speaker2Fallacies = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const turn of speaker2Turns) {
      for (const f of turn.fallacies) {
        const key = (f as any).category || (f as any).type || 'Unknown';
        const sentences = Array.isArray((f as any).sentences) ? (f as any).sentences : ((f as any).sentence ? [(f as any).sentence] : []);
        if (!map[key]) map[key] = [];
        map[key].push(...sentences);
      }
    }
    return Object.entries(map).map(([category, sentences]) => ({ category, sentences }));
  }, [speaker2Turns]);

  // Avoid navigating during render on web – defer redirect until after mount
  useEffect(() => {
    if (pathname === '/summary' && !session) {
      const id = setTimeout(() => router.replace('/'), 0);
      return () => clearTimeout(id);
    }
  }, [pathname, session]);

  if (!session) {
    return null;
  }

  const handleStartNewDebate = () => {
    reset();
    router.replace('/');
  };

  // Calculate stats
  const totalTurns = allTurns.length;
  const totalFallacies = allTurns.reduce(
    (acc, turn) => acc + turn.fallacies.length,
    0
  );
  const totalFactChecks = allTurns.reduce(
    (acc, turn) => acc + turn.factChecks.length,
    0
  );

  // (no aggregation; original timeline view)

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
          <View style={styles.trophyInner} />
        </View>
        <Text style={styles.heroTitle}>Debate{'\n'}Complete</Text>
        <Text style={styles.heroSubtitle}>{totalTurns} turns · Analysis ready</Text>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Big Hero Stats removed by request */}

        {/* Apple Watch-like Bubble Clusters */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={{ marginBottom: 36 }}>
            <BubbleCluster
              title="Speaker 1"
              speaker="A"
              centerColor={DebateColors.speaker1.primary}
              glowColor={(DebateColors as any).speaker1?.glow || DebateColors.speaker1.primary}
              textColor={DebateColors.text.primary}
              categories={speaker1Fallacies}
              onSelect={(item) => setSelected({ speaker: 'A', ...item })}
            />
          </View>
          <View style={{ marginBottom: 12 }}>
            <BubbleCluster
              title="Speaker 2"
              speaker="B"
              centerColor={DebateColors.speaker2.primary}
              glowColor={(DebateColors as any).speaker2?.glow || DebateColors.speaker2.primary}
              textColor={DebateColors.text.primary}
              categories={speaker2Fallacies}
              onSelect={(item) => setSelected({ speaker: 'B', ...item })}
            />
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail overlay */}
      {selected && (
        <View style={styles.detailOverlay} pointerEvents="box-none">
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>
              {selected.speaker === 'A' ? 'Speaker 1' : 'Speaker 2'} · {selected.category}
            </Text>
            <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 12 }}>
              {selected.sentences.length > 0 ? (
                selected.sentences.map((s, i) => (
                  <Text key={i} style={styles.detailSentence}>• {s}</Text>
                ))
              ) : (
                <Text style={styles.detailSentence}>No example sentences captured.</Text>
              )}
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              onPress={() => setSelected(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* (no overlay in the original view) */}

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
    padding: 20,
    paddingTop: 10,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  mainStat: {
    alignItems: 'center',
  },
  mainStatNumber: {
    fontSize: 56,
    fontWeight: '400',
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
    fontWeight: '400',
    color: '#FFFFFF',
  },
  cardHeaderText: {
    flex: 1,
  },
  speakerName: {
    fontSize: 24,
    fontWeight: '400',
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
    fontWeight: '400',
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
    padding: 20,
    paddingBottom: 32,
    backgroundColor: DebateColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionButton: {
    backgroundColor: DebateColors.accent.purple,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Detail overlay
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  detailCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: DebateColors.background.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DebateColors.background.border,
    padding: 20,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DebateColors.text.primary,
    marginBottom: 12,
  },
  detailSentence: {
    fontSize: 14,
    color: DebateColors.text.secondary,
    lineHeight: 20,
  },
  closeButton: {
    marginTop: 18,
    backgroundColor: DebateColors.accent.purple,
    paddingVertical: 12,
    borderRadius: 14,
  },
  closeButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

// Bubble cluster component
function BubbleCluster(props: {
  title: string;
  speaker: 'A' | 'B';
  centerColor: string;
  glowColor: string;
  textColor: string;
  categories: { category: string; sentences: string[] }[];
  onSelect: (item: { category: string; sentences: string[] }) => void;
}) {
  const { title, centerColor, glowColor, textColor, categories, onSelect } = props;

  // orbit animation driver
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 9000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotation = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const pulsing = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  // choose a limited subset to avoid cramming too many bubbles
  const items = categories.slice(0, 10);
  const radius = 110; // orbit radius

  return (
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      <View style={{ width: '100%', maxWidth: 360, height: 260, alignItems: 'center', justifyContent: 'center' }}>
        {/* orbit group */}
        <Animated.View style={{ position: 'absolute', width: 1, height: 1, transform: [{ rotate: rotation }] }}>
          {items.map((item, index) => {
            const angle = (2 * Math.PI * index) / Math.max(1, items.length);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const size = 56 + (index % 3) * 8; // subtle variance
            return (
              <Animated.View
                key={index}
                style={{
                  position: 'absolute',
                  transform: [{ translateX: x }, { translateY: y }, { scale: pulsing }],
                }}
              >
                <Pressable
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => ({
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.18)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Text style={{
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: '700',
                    textAlign: 'center',
                    paddingHorizontal: 6,
                  }} numberOfLines={2}>
                    {item.category}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* center bubble */}
        <Animated.View
          style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: centerColor,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.45,
            shadowRadius: 24,
            elevation: 16,
            transform: [{ scale: pulsing }],
            borderWidth: 3,
            borderColor: 'rgba(255,255,255,0.18)',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '400', letterSpacing: 0.5 }}>{title}</Text>
        </Animated.View>
      </View>
    </View>
  );
}