/**
 * Libra - Debate History Screen
 * View past debate summaries from the database
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { DebateColors } from '@/constants/theme';

interface Fallacy {
  type: string;
  severity: string;
  explanation: string;
  quote?: string;
}

interface Turn {
  TURN_NUMBER: number;
  SPEAKER: string;
  TRANSCRIPT: string;
  FALLACIES?: Fallacy[];
  TIMESTAMP: string;
}

interface DebateRecord {
  DEBATE_ID: string;
  TOPIC: string;
  SPEAKER_A: string;
  SPEAKER_B: string;
  CREATED_AT: string;
  TOTAL_TURNS: number;
  STATUS: string;
  turns?: Turn[];
}

export default function HistoryScreen() {
  const [debates, setDebates] = useState<DebateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDebate, setExpandedDebate] = useState<string | null>(null);

  const fetchDebates = async () => {
    try {
      setError(null);
      const res = await fetch('http://localhost:5001/api/list_debates?limit=50');
      
      if (!res.ok) {
        throw new Error('Failed to fetch debates');
      }
      
      const data = await res.json();
      setDebates(data.debates || []);
    } catch (err: any) {
      console.error('Error fetching debates:', err);
      setError(err.message || 'Failed to load debates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDebates();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDebates();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'high':
      case 'critical':
        return '#FF4444';
      case 'medium':
      case 'moderate':
        return '#FFA726';
      case 'low':
      case 'minor':
        return '#FDD835';
      default:
        return '#9E9E9E';
    }
  };

  const toggleSummary = async (debateId: string) => {
    if (expandedDebate === debateId) {
      setExpandedDebate(null);
      return;
    }

    // Fetch full debate details if not already loaded
    const debate = debates.find(d => d.DEBATE_ID === debateId);
    if (debate && !debate.turns) {
      try {
        console.log(`Fetching debate details for ${debateId}...`);
        const response = await fetch(`http://localhost:5001/api/get_debate/${debateId}`);
        if (response.ok) {
          const fullDebate = await response.json();
          console.log('Full debate data:', fullDebate);
          console.log('Turns:', fullDebate.turns);
          // Update the debate with turns
          setDebates(prev => prev.map(d => 
            d.DEBATE_ID === debateId 
              ? { ...d, turns: fullDebate.turns || [] }
              : d
          ));
        } else {
          console.error('Failed to fetch debate:', response.status);
        }
      } catch (error) {
        console.error('Error fetching debate details:', error);
      }
    }
    
    setExpandedDebate(debateId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DebateColors.accent.purple} />
          <Text style={styles.loadingText}>Loading debate history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Debate History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DebateColors.accent.purple}
          />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Make sure the backend server is running and Snowflake is configured.
            </Text>
          </View>
        )}

        {!error && debates.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No debates yet</Text>
            <Text style={styles.emptyHint}>
              Complete a debate session to see it appear here
            </Text>
          </View>
        )}

        {!error && debates.length > 0 && (
          <View style={styles.debatesList}>
            <Text style={styles.listHeader}>
              {debates.length} debate{debates.length !== 1 ? 's' : ''} saved
            </Text>
            
            {debates.map((debate, index) => (
              <View key={debate.DEBATE_ID || index} style={styles.debateCard}>
                <View style={styles.debateHeader}>
                  <Text style={styles.debateTopic} numberOfLines={1}>
                    {debate.TOPIC || 'Untitled Debate'}
                  </Text>
                  <View style={styles.turnBadge}>
                    <Text style={styles.turnBadgeText}>
                      {debate.TOTAL_TURNS} {debate.TOTAL_TURNS === 1 ? 'turn' : 'turns'}
                    </Text>
                  </View>
                </View>

                <View style={styles.speakersRow}>
                  <View style={styles.speaker}>
                    <View style={[styles.speakerDot, { backgroundColor: DebateColors.speaker1.primary }]} />
                    <Text style={styles.speakerName} numberOfLines={1}>
                      {debate.SPEAKER_A || 'Speaker A'}
                    </Text>
                  </View>
                  <Text style={styles.vs}>vs</Text>
                  <View style={styles.speaker}>
                    <View style={[styles.speakerDot, { backgroundColor: DebateColors.speaker2.primary }]} />
                    <Text style={styles.speakerName} numberOfLines={1}>
                      {debate.SPEAKER_B || 'Speaker B'}
                    </Text>
                  </View>
                </View>

                {/* Transcript & Fallacies Section - Expandable */}
                <Pressable
                  style={({ pressed }) => [
                    styles.summaryButton,
                    pressed && styles.summaryButtonPressed,
                  ]}
                  onPress={() => toggleSummary(debate.DEBATE_ID)}
                >
                  <Text style={styles.summaryButtonText}>
                    {expandedDebate === debate.DEBATE_ID ? '📖 Hide Transcript' : '📜 View Transcript & Fallacies'}
                  </Text>
                  <Text style={styles.summaryButtonIcon}>
                    {expandedDebate === debate.DEBATE_ID ? '▼' : '▶'}
                  </Text>
                </Pressable>

                {expandedDebate === debate.DEBATE_ID && (
                  <View style={styles.transcriptContainer}>
                    <Text style={styles.transcriptHeader}>Debate Transcript</Text>
                    
                    {!debate.turns && (
                      <View style={styles.loadingTurns}>
                        <ActivityIndicator size="small" color={DebateColors.accent.purple} />
                        <Text style={styles.loadingTurnsText}>Loading transcript...</Text>
                      </View>
                    )}
                    
                    {debate.turns && debate.turns.length === 0 && (
                      <View style={styles.noTurnsContainer}>
                        <Text style={styles.noTurnsText}>No transcript data available</Text>
                        <Text style={styles.noTurnsHint}>This debate may not have been fully recorded</Text>
                      </View>
                    )}
                    
                    {debate.turns && debate.turns.map((turn, idx) => {
                      const speakerColor = turn.SPEAKER === debate.SPEAKER_A 
                        ? DebateColors.speaker1 
                        : DebateColors.speaker2;
                      
                      return (
                        <View key={idx} style={styles.turnCard}>
                          {/* Turn Header */}
                          <View style={styles.turnHeader}>
                            <View style={styles.turnSpeaker}>
                              <View style={[styles.speakerDot, { backgroundColor: speakerColor.primary }]} />
                              <Text style={styles.turnSpeakerName}>{turn.SPEAKER}</Text>
                            </View>
                            <Text style={styles.turnNumber}>Turn {turn.TURN_NUMBER}</Text>
                          </View>

                          {/* Transcript */}
                          <View style={[styles.transcriptBox, { borderLeftColor: speakerColor.primary }]}>
                            <Text style={styles.transcriptText}>{turn.TRANSCRIPT}</Text>
                          </View>

                          {/* Fallacies */}
                          {turn.FALLACIES && turn.FALLACIES.length > 0 && (
                            <View style={styles.fallaciesContainer}>
                              <Text style={styles.fallaciesLabel}>
                                ⚠️ Fallacies Detected ({turn.FALLACIES.length})
                              </Text>
                              {turn.FALLACIES.map((fallacy, fIdx) => (
                                <View key={fIdx} style={styles.fallacyCard}>
                                  <View style={styles.fallacyHeader}>
                                    <Text style={styles.fallacyType}>{fallacy.type}</Text>
                                    <View style={[
                                      styles.severityBadge,
                                      { backgroundColor: getSeverityColor(fallacy.severity) }
                                    ]}>
                                      <Text style={styles.severityText}>{fallacy.severity}</Text>
                                    </View>
                                  </View>
                                  <Text style={styles.fallacyExplanation}>{fallacy.explanation}</Text>
                                  {fallacy.quote && (
                                    <View style={styles.quoteBox}>
                                      <Text style={styles.quoteText}>"{fallacy.quote}"</Text>
                                    </View>
                                  )}
                                </View>
                              ))}
                            </View>
                          )}

                          {turn.FALLACIES && turn.FALLACIES.length === 0 && (
                            <View style={styles.noFallaciesBox}>
                              <Text style={styles.noFallaciesText}>✅ No fallacies detected</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.debateFooter}>
                  <Text style={styles.debateDate}>
                    {formatDate(debate.CREATED_AT)}
                  </Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{debate.STATUS}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DebateColors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: DebateColors.text.tertiary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DebateColors.background.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DebateColors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.7,
    backgroundColor: DebateColors.background.tertiary,
  },
  backButtonText: {
    fontSize: 24,
    color: DebateColors.text.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DebateColors.text.primary,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: DebateColors.background.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: DebateColors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: DebateColors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: DebateColors.text.secondary,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: DebateColors.text.tertiary,
    textAlign: 'center',
  },
  debatesList: {
    gap: 16,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: DebateColors.text.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  debateCard: {
    backgroundColor: DebateColors.background.secondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: DebateColors.background.border,
    gap: 16,
  },
  debateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  debateTopic: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: DebateColors.text.primary,
  },
  turnBadge: {
    backgroundColor: DebateColors.background.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DebateColors.accent.purple,
  },
  turnBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: DebateColors.accent.purple,
    letterSpacing: 0.3,
  },
  speakersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  speaker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DebateColors.background.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  speakerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  speakerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: DebateColors.text.secondary,
  },
  vs: {
    fontSize: 12,
    fontWeight: '700',
    color: DebateColors.text.tertiary,
    letterSpacing: 1,
  },
  debateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debateDate: {
    fontSize: 13,
    color: DebateColors.text.tertiary,
    fontWeight: '400',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: DebateColors.background.tertiary,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: DebateColors.text.tertiary,
    textTransform: 'capitalize',
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DebateColors.background.tertiary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DebateColors.accent.purple,
  },
  summaryButtonPressed: {
    opacity: 0.7,
    backgroundColor: DebateColors.background.border,
  },
  summaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DebateColors.accent.purple,
    letterSpacing: 0.3,
  },
  summaryButtonIcon: {
    fontSize: 12,
    color: DebateColors.accent.purple,
  },
  transcriptContainer: {
    gap: 12,
    padding: 16,
    backgroundColor: DebateColors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DebateColors.background.border,
  },
  transcriptHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: DebateColors.text.primary,
    marginBottom: 8,
  },
  turnCard: {
    backgroundColor: DebateColors.background.secondary,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  turnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turnSpeaker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  turnSpeakerName: {
    fontSize: 14,
    fontWeight: '700',
    color: DebateColors.text.primary,
  },
  turnNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: DebateColors.text.tertiary,
    textTransform: 'uppercase',
  },
  transcriptBox: {
    backgroundColor: DebateColors.background.primary,
    borderLeftWidth: 3,
    padding: 12,
    borderRadius: 8,
  },
  transcriptText: {
    fontSize: 14,
    lineHeight: 20,
    color: DebateColors.text.secondary,
  },
  fallaciesContainer: {
    gap: 8,
    marginTop: 4,
  },
  fallaciesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fallacyCard: {
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  fallacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fallacyType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF9800',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  fallacyExplanation: {
    fontSize: 13,
    lineHeight: 18,
    color: DebateColors.text.secondary,
  },
  quoteBox: {
    backgroundColor: DebateColors.background.primary,
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#FF9800',
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: DebateColors.text.tertiary,
  },
  noFallaciesBox: {
    padding: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  noFallaciesText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  loadingTurns: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingTurnsText: {
    fontSize: 14,
    color: DebateColors.text.tertiary,
  },
  noTurnsContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: DebateColors.background.secondary,
    borderRadius: 8,
    gap: 8,
  },
  noTurnsText: {
    fontSize: 14,
    fontWeight: '600',
    color: DebateColors.text.secondary,
  },
  noTurnsHint: {
    fontSize: 12,
    color: DebateColors.text.tertiary,
    textAlign: 'center',
  },
});
