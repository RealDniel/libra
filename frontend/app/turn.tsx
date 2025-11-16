/**
 * Libra - Turn Screen (Recording)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { DebateColors } from '@/constants/theme';
import { useDebateStore } from '@/store/debateStore';
import { Audio } from 'expo-av';

export default function TurnScreen() {
  const currentTurn = useDebateStore((state) => state.currentTurn);
  const updateTimer = useDebateStore((state) => state.updateTimer);
  const setRecording = useDebateStore((state) => state.setRecording);
  const setUploading = useDebateStore((state) => state.setUploading);
  const setTranscript = useDebateStore((state) => state.setTranscript);
  const setError = useDebateStore((state) => state.setError);
  const setAnalysis = useDebateStore((state) => state.setAnalysis);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [uploading, setUploadingLocal] = useState(false);
  const { currentTurn, updateTimer, setRecording, speakerNames } = useDebateStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathname = usePathname();

  const speakerNum = currentTurn?.speaker === 'A' ? 1 : 2;
  if (!currentTurn) {
    router.replace('/');
    return null;
  }

  const colors =
    currentTurn?.speaker === 'A'
      ? DebateColors.speaker1
      : DebateColors.speaker2;

  const isRecording = currentTurn?.status === 'recording';
  const isIdle = currentTurn?.status === 'idle';
  // Get the speaker name from store, with fallback
  const speakerName = currentTurn.speaker === 'A' 
    ? (speakerNames?.A || 'Speaker A')
    : (speakerNames?.B || 'Speaker B');

  const isRecording = currentTurn.status === 'recording';
  const isIdle = currentTurn.status === 'idle';
  const isBusy = uploading || isRecording;

  // Debug logging
  useEffect(() => {
    console.log('📊 Turn status changed:', currentTurn.status);
    console.log('⏱️ Time remaining:', currentTurn.timeRemaining);
    console.log('🎙️ isRecording:', isRecording, 'isIdle:', isIdle);
  }, [currentTurn.status, currentTurn.timeRemaining, isRecording, isIdle]);

  // Format time as mm:ss
  const timeRemaining = currentTurn?.timeRemaining ?? 0;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
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

  // Redirect when no current turn (must occur in an effect, not during render)
  useEffect(() => {
    if (pathname === '/turn' && !currentTurn) {
      router.replace('/');
    }
  }, [pathname, currentTurn]);

  // Timer countdown
  useEffect(() => {
    if (isRecording && timeRemaining > 0) {
      timerInterval.current = setInterval(() => {
        updateTimer(timeRemaining - 1);
        if (timeRemaining <= 1) {
          handleStop();
        }
      }, 1000);
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isRecording, timeRemaining]);

  const handleMicPress = () => {
    if (isIdle) {
      // Start recording
      handleStart();
    } else if (isRecording) {
      // Stop recording
      handleStop();
    }
  };

  const handleStart = async () => {
    try {
      console.log('🎤 Starting recording...');
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        console.log('❌ Mic permission denied');
        setError('Microphone permission denied');
        return;
      }
      console.log('✅ Mic permission granted');
      // Platform-specific audio mode (web doesn't support iOS/Android settings)
      if (Platform.OS === 'web') {
        // Web mode - minimal settings
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
        });
      } else {
        // Native iOS/Android mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
      }
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await recording.startAsync();
      recordingRef.current = recording;
      console.log('✅ Recording started, updating store...');
      setRecording(true);
      console.log('✅ Store updated, status should be recording');
    } catch (e: any) {
      console.error('❌ Recording failed:', e);
      setError(`Failed to start recording: ${e.message || 'Unknown error'}`);
    }
  };

  const handleStop = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    stopAndUpload();
  };

  const stopAndUpload = async () => {
    try {
      console.log('⏹️ Stopping recording...');
      const recording = recordingRef.current;
      if (!recording) {
        console.log('⚠️ No recording ref found');
        setRecording(false);
        return;
      }
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI() || undefined;
      console.log('✅ Recording stopped, URI:', uri);
      setRecording(false, uri);

      // Upload
      console.log('📤 Starting upload...');
      setUploading();
      setUploadingLocal(true);
      
      // Web vs Native file upload handling
      let res: Response;
      const backendUrl = 'http://localhost:5001/api/transcribe';
      console.log('📡 Uploading to:', backendUrl);
      
      if (Platform.OS === 'web' && uri) {
        // Web: fetch the blob and send it as a file
        console.log('🌐 Web upload: fetching blob...');
        const blobRes = await fetch(uri);
        const blob = await blobRes.blob();
        console.log('📦 Blob size:', blob.size, 'type:', blob.type);
        
        const form = new FormData();
        form.append('audio', blob, 'turn.webm'); // Web records as webm
        
        res = await fetch(backendUrl, {
          method: 'POST',
          body: form,
        });
      } else {
        // Native: use RN FormData shim
        const form = new FormData();
        form.append('audio', {
          // @ts-ignore RN FormData file shim
          uri,
          name: 'turn.m4a',
          type: 'audio/m4a',
        } as any);
        
        res = await fetch(backendUrl, {
          method: 'POST',
          body: form,
        });
      }
      const text = await res.text();
      console.log('📥 Backend response:', res.status, text.substring(0, 100));
      if (!res.ok) {
        try {
          const json = JSON.parse(text);
          console.error('❌ Transcription error:', json.error);
          setError(json.error || 'Transcription failed');
        } catch {
          console.error('❌ Transcription failed (non-JSON response)');
          setError('Transcription failed');
        }
        setUploadingLocal(false);
        return;
      }
      const data = JSON.parse(text);
      const transcript = data.transcript || '';
      console.log('✅ Transcript received:', transcript.substring(0, 50) + '...');
      setTranscript(transcript);
      
      // Analyze: fallacies then fact-checks
      console.log('🔍 Running analysis...');
      const fallacies = await analyzeFallacies(transcript, currentTurn.speaker);
      const factChecks = await factcheckTranscript(transcript);
      console.log('✅ Analysis complete. Fallacies:', fallacies.length, 'Fact checks:', factChecks.length);
      setAnalysis(fallacies, factChecks);
      setUploadingLocal(false);

      // Go to analysis screen for the rest of the pipeline
      console.log('🚀 Navigating to analysis...');
      router.push('/analysis');
    } catch (e: any) {
      console.error('❌ Upload/analysis failed:', e);
      setUploadingLocal(false);
      setError(`Failed: ${e.message || 'Unknown error'}`);
    } finally {
      recordingRef.current = null;
    }
  };

  const analyzeFallacies = async (text: string, speaker: 'A' | 'B') => {
    try {
      const res = await fetch('http://localhost:5001/api/fallacies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, speaker }),
      });
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return Array.isArray(data.fallacies) ? data.fallacies : [];
    } catch {
      return [];
    }
  };

  const factcheckTranscript = async (text: string) => {
    try {
      const res = await fetch('http://localhost:5001/api/factcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        console.log('❌ Factcheck API failed:', res.status);
        return [];
      }
      const data = await res.json();
      console.log('📊 Factcheck response:', data);
      
      // Accept either a single result or list; normalize to array of FactCheck
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.factChecks)) {
        console.log(`✅ Returning ${data.factChecks.length} fact checks`);
        return data.factChecks;
      }
      if (data.claim || data.verdict) return [data];
      console.log('⚠️ No fact checks found in response');
      return [];
    } catch (e) {
      console.error('❌ Factcheck error:', e);
      return [];
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[...colors.gradient].reverse() as any}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.speakerTitle}>{speakerName}</Text>
            <Animated.Text
              style={[
                styles.timer,
                isRecording && timeRemaining <= 10 && styles.timerWarning,
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
                pressed && !isBusy && styles.micButtonPressed,
              ]}
              onPress={handleMicPress}
              disabled={uploading}
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
                  {uploading ? 'Uploading...' : isIdle ? 'Start' : 'Stop & Analyze'}
                </Text>
              </Animated.View>
            </Pressable>
          </View>

          {/* Status */}
          <View style={styles.footer}>
            <Text style={styles.status}>
              {uploading
                ? 'Uploading audio...'
                : isRecording
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