/**
 * Libra - Debate Summary Screen (Modern Redesign)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  Animated,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { DebateColors } from '@/constants/theme';
import { useDebateStore } from '@/store/debateStore';

const { width } = Dimensions.get('window');
const isDesktop = width >= 768;

export default function SummaryScreen() {
  const { session, reset, speakerNames, speakerAggregates } = useDebateStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const pathname = usePathname();
  
  const [summaries, setSummaries] = useState<{ A: string | null; B: string | null }>({ A: null, B: null });
  const [loadingSummaries, setLoadingSummaries] = useState(false);

  useEffect(() => {
    // Staggered entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
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
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(card1Anim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(card2Anim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  // Redirect if no session
  useEffect(() => {
    if (pathname === '/summary' && !session) {
      const id = setTimeout(() => router.replace('/'), 0);
      return () => clearTimeout(id);
    }
  }, [pathname, session]);

  // Generate AI summaries when component mounts
  useEffect(() => {
    if (session && speakerAggregates) {
      generateSummaries();
    }
  }, []);

  const generateSummaries = async () => {
    if (!speakerAggregates) return;
    
    setLoadingSummaries(true);
    try {
      const [summaryA, summaryB] = await Promise.all([
        fetchSummary(speakerAggregates.A, speaker1Name),
        fetchSummary(speakerAggregates.B, speaker2Name),
      ]);
      setSummaries({ A: summaryA, B: summaryB });
    } catch (error) {
      console.error('Failed to generate summaries:', error);
    } finally {
      setLoadingSummaries(false);
    }
  };

  const fetchSummary = async (transcript: string, speaker: string): Promise<string> => {
    if (!transcript || !transcript.trim()) {
      return 'No transcript available.';
    }
    try {
      const res = await fetch('http://localhost:5001/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, speaker }),
      });
      if (!res.ok) {
        return 'Failed to generate summary.';
      }
      const data = await res.json();
      return data.summary || 'No summary available.';
    } catch {
      return 'Error generating summary.';
    }
  };

  if (!session) {
    return null;
  }

  const allTurns = session?.turns ?? [];
  const speaker1Turns = allTurns.filter((t) => t.speaker === 'A');
  const speaker2Turns = allTurns.filter((t) => t.speaker === 'B');

  // Aggregate fallacies
  const speaker1Fallacies = speaker1Turns.flatMap((t) => t.fallacies);
  const speaker2Fallacies = speaker2Turns.flatMap((t) => t.fallacies);

  // Get ONLY false claims
  const speaker1FalseClaims = speaker1Turns
    .flatMap((t) => t.factChecks)
    .filter((fc) => fc.verdict === 'false');
  const speaker2FalseClaims = speaker2Turns
    .flatMap((t) => t.factChecks)
    .filter((fc) => fc.verdict === 'false');

  const handleStartNewDebate = () => {
    reset();
    router.replace('/');
  };

  const speaker1Name = speakerNames?.A || 'Speaker A';
  const speaker2Name = speakerNames?.B || 'Speaker B';

  return (
    <View style={styles.container}>
      {/* Animated gradient background */}
      <LinearGradient
        colors={['#1a0b2e', '#2d1b4e', '#1a0b2e']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Floating orbs */}
      <View style={styles.orbContainer}>
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={[styles.orb, styles.orb3]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Hero Header */}
        <Animated.View 
          style={[
            styles.heroHeader, 
            { 
              opacity: fadeAnim, 
              transform: [{ scale: scaleAnim }] 
            }
          ]}
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Debate Complete</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{allTurns.length}</Text>
              <Text style={styles.statLabel}>Turns</Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Speaker Cards */}
          <View
            style={[
              styles.cardsContainer,
              isDesktop ? styles.cardsRow : styles.cardsColumn,
            ]}
          >
            {/* Speaker 1 Card */}
            <Animated.View 
              style={[
                styles.speakerCard, 
                isDesktop && styles.speakerCardHalf,
                {
                  opacity: card1Anim,
                  transform: [{
                    translateY: card1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }],
                },
              ]}
            >
              <LinearGradient
                colors={['#B81D1D', '#780C0C', '#B81D1D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              
              <View style={styles.cardContent}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.speakerBadge}>
                    <Text style={styles.speakerNumber}>1</Text>
                  </View>
                  <Text style={styles.speakerName}>{speaker1Name}</Text>
                </View>

                {/* AI Summary Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                  </View>
                  <View style={styles.contentBox}>
                    {loadingSummaries ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.loadingText}>Generating summary...</Text>
                      </View>
                    ) : (
                      <Markdown style={markdownStyles}>
                        {summaries.A || 'No summary available'}
                      </Markdown>
                    )}
                  </View>
                </View>

                {/* Fallacies Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Logical Fallacies</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{speaker1Fallacies.length}</Text>
                    </View>
                  </View>
                  <View style={styles.contentBox}>
                    {speaker1Fallacies.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No fallacies detected</Text>
                      </View>
                    ) : (
                      speaker1Fallacies.map((fallacy, idx) => (
                        <View key={idx} style={styles.fallacyItem}>
                          <View style={styles.fallacyDot} />
                          <View style={styles.fallacyContent}>
                            <Text style={styles.fallacyType}>{fallacy.type}</Text>
                            {fallacy.quote && (
                              <Text style={styles.fallacyQuote}>"{fallacy.quote}"</Text>
                            )}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>

                {/* False Claims Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>False Claims</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{speaker1FalseClaims.length}</Text>
                    </View>
                  </View>
                  <View style={styles.contentBox}>
                    {speaker1FalseClaims.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No false claims detected</Text>
                      </View>
                    ) : (
                      speaker1FalseClaims.map((fc, idx) => (
                        <View key={idx} style={styles.claimItem}>
                          <Text style={styles.claimText}>"{fc.claim}"</Text>
                          <Text style={styles.claimExplanation}>{fc.explanation}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Speaker 2 Card */}
            <Animated.View 
              style={[
                styles.speakerCard, 
                isDesktop && styles.speakerCardHalf,
                {
                  opacity: card2Anim,
                  transform: [{
                    translateY: card2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  }],
                },
              ]}
            >
              <LinearGradient
                colors={['#1D1DB8', '#0C1778', '#1D1DB8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              />
              
              <View style={styles.cardContent}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.speakerBadge}>
                    <Text style={styles.speakerNumber}>2</Text>
                  </View>
                  <Text style={styles.speakerName}>{speaker2Name}</Text>
                </View>

                {/* AI Summary Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                  </View>
                  <View style={styles.contentBox}>
                    {loadingSummaries ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.loadingText}>Generating summary...</Text>
                      </View>
                    ) : (
                      <Markdown style={markdownStyles}>
                        {summaries.B || 'No summary available'}
                      </Markdown>
                    )}
                  </View>
                </View>

                {/* Fallacies Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Logical Fallacies</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{speaker2Fallacies.length}</Text>
                    </View>
                  </View>
                  <View style={styles.contentBox}>
                    {speaker2Fallacies.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No fallacies detected</Text>
                      </View>
                    ) : (
                      speaker2Fallacies.map((fallacy, idx) => (
                        <View key={idx} style={styles.fallacyItem}>
                          <View style={styles.fallacyDot} />
                          <View style={styles.fallacyContent}>
                            <Text style={styles.fallacyType}>{fallacy.type}</Text>
                            {fallacy.quote && (
                              <Text style={styles.fallacyQuote}>"{fallacy.quote}"</Text>
                            )}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>

                {/* False Claims Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>False Claims</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{speaker2FalseClaims.length}</Text>
                    </View>
                  </View>
                  <View style={styles.contentBox}>
                    {speaker2FalseClaims.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No false claims detected</Text>
                      </View>
                    ) : (
                      speaker2FalseClaims.map((fc, idx) => (
                        <View key={idx} style={styles.claimItem}>
                          <Text style={styles.claimText}>"{fc.claim}"</Text>
                          <Text style={styles.claimExplanation}>{fc.explanation}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Action Button */}
        <Animated.View style={[styles.fabContainer, { opacity: fadeAnim }]}>
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              pressed && styles.fabPressed,
            ]}
            onPress={handleStartNewDebate}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Text style={styles.fabText}>New Debate</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0118',
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.15,
  },
  orb1: {
    width: 400,
    height: 400,
    backgroundColor: '#3b82f6',
    top: -100,
    left: -150,
  },
  orb2: {
    width: 350,
    height: 350,
    backgroundColor: '#ef4444',
    bottom: -100,
    right: -150,
  },
  orb3: {
    width: 300,
    height: 300,
    backgroundColor: '#8b5cf6',
    top: '40%',
    left: '50%',
    marginLeft: -150,
    marginTop: -150,
  },
  safeArea: {
    flex: 1,
  },
  heroHeader: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 54,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 24,
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardsContainer: {
    width: '100%',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  cardsColumn: {
    flexDirection: 'column',
    gap: 16,
  },
  speakerCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  speakerCardHalf: {
    flex: 1,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  speakerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  speakerNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  speakerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  contentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  summaryText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 22,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  fallacyItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  fallacyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginTop: 7,
  },
  fallacyContent: {
    flex: 1,
  },
  fallacyType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  fallacyQuote: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  claimItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  claimText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
    lineHeight: 20,
  },
  claimExplanation: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  fab: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
      },
    }),
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  fabIcon: {
    fontSize: 20,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});

// Markdown styles for AI summary
const markdownStyles = StyleSheet.create({
  body: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 22,
  },
  heading1: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  heading2: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  strong: {
    color: '#ffffff',
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  bullet_list: {
    marginTop: 4,
    marginBottom: 4,
  },
  ordered_list: {
    marginTop: 4,
    marginBottom: 4,
  },
  list_item: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 8,
  },
});
