/**
 * Libra - Landing Page with History Button
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useDebateStore } from '@/store/debateStore';

const Colors = {
  background: {
    primary: '#0a0515',
    secondary: '#1a1228',
    tertiary: '#2a1f3d',
  },
  purple: {
    main: '#7c3aed',
    light: '#a78bfa',
    dark: '#5b21b6',
    glow: 'rgba(124, 58, 237, 0.4)',
  },
  accent: {
    blue: '#3b82f6',
    red: '#ef4444',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
  },
};

export default function HomeScreen() {
  const store = useDebateStore();
  const [speakingTime, setSpeakingTime] = useState(2);
  const [speakerAName, setSpeakerAName] = useState('Speaker A');
  const [speakerBName, setSpeakerBName] = useState('Speaker B');
  const [editingModal, setEditingModal] = useState(null);
  const [tempName, setTempName] = useState('');
  
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orb1, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(orb2, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleNewDebate = () => {
    store.reset();
    if (store.setSpeakerNames) {
      store.setSpeakerNames({ A: speakerAName, B: speakerBName });
    }
    if (store.setTurnDuration) {
      store.setTurnDuration(speakingTime * 60);
    }
    store.startDebate();
    store.startTurn('A', speakingTime * 60, speakerAName, speakerBName);
    router.push('/turn');
  };

  const incrementTime = () => {
    setSpeakingTime(prev => Math.min(prev + 1, 99));
  };

  const decrementTime = () => {
    setSpeakingTime(prev => Math.max(prev - 1, 1));
  };

  const handleEditSpeaker = (speaker) => {
    setEditingModal(speaker);
    setTempName(speaker === 'A' ? speakerAName : speakerBName);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      if (editingModal === 'A') {
        setSpeakerAName(tempName.trim());
      } else if (editingModal === 'B') {
        setSpeakerBName(tempName.trim());
      }
    }
    setEditingModal(null);
    setTempName('');
  };

  const handleCancelEdit = () => {
    setEditingModal(null);
    setTempName('');
  };

  const orb1Rotate = orb1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const orb2Rotate = orb2.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundElements}>
        <Animated.View
          style={[
            styles.orb,
            styles.orb1,
            { transform: [{ rotate: orb1Rotate }] },
          ]}
        />
        <Animated.View
          style={[
            styles.orb,
            styles.orb2,
            { transform: [{ rotate: orb2Rotate }] },
          ]}
        />
        <View style={styles.glowOverlay} />
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: floatAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.logoContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View>
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
              />
            </View>
          </Animated.View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Libra</Text>
            <View style={styles.titleUnderline} />
          </View>

          <Text style={styles.subtitle}>
            Real-time debate analysis & fact-checking
          </Text>

          <View style={styles.featureContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.featureBadge,
                pressed && styles.featureBadgePressed,
              ]}
              onPress={() => handleEditSpeaker('A')}
            >
              <View style={[styles.colorDot, { backgroundColor: Colors.accent.blue }]} />
              <Text style={styles.featureText}>{speakerAName}</Text>
              <Text style={styles.editIcon}>✎</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              style={({ pressed }) => [
                styles.featureBadge,
                pressed && styles.featureBadgePressed,
              ]}
              onPress={() => handleEditSpeaker('B')}
            >
              <View style={[styles.colorDot, { backgroundColor: Colors.accent.red }]} />
              <Text style={styles.featureText}>{speakerBName}</Text>
              <Text style={styles.editIcon}>✎</Text>
            </Pressable>
          </View>

          <View style={styles.timeInputContainer}>
            <View style={styles.timeSelectorWrapper}>
              <Pressable
                style={({ pressed }) => [
                  styles.arrowButton,
                  pressed && styles.arrowButtonPressed,
                ]}
                onPress={decrementTime}
              >
                <Text style={styles.arrowText}>◀</Text>
              </Pressable>

              <View style={styles.timeDisplay}>
                <Text style={styles.timeNumber}>{speakingTime}</Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.arrowButton,
                  pressed && styles.arrowButtonPressed,
                ]}
                onPress={incrementTime}
              >
                <Text style={styles.arrowText}>▶</Text>
              </Pressable>
            </View>
            
            <Text style={styles.timeUnit}>Minutes per Speaker</Text>
          </View>
        </Animated.View>

        {/* ========== BUTTONS SECTION ========== */}
        <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
          
          {/* PRIMARY: Start New Debate */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNewDebate}
          >
            <Animated.View style={[styles.buttonInner, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.primaryButtonText}>Start New Debate</Text>
              <View style={styles.buttonIcon}>
                <Text style={styles.buttonIconText}>→</Text>
              </View>
            </Animated.View>
            <View style={styles.buttonGlow} />
          </Pressable>

          {/* SECONDARY: View History */}
          <Pressable
            style={({ pressed }) => [
              styles.historyButton,
              pressed && styles.historyButtonPressed,
            ]}
            onPress={() => {
              console.log('📚 History button clicked!');
              router.push('/history');
            }}
          >
            <Text style={styles.historyButtonText}>📚 View History</Text>
          </Pressable>

          {/* Beta Tag */}
          <View style={styles.betaContainer}>
            <View style={styles.betaTag}>
              <View style={styles.betaDot} />
              <Text style={styles.betaText}>BETA</Text>
            </View>
            <Text style={styles.versionText}>Version 1.0</Text>
          </View>
        </Animated.View>
      </View>

      {/* Edit Name Modal */}
      <Modal
        visible={editingModal !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit {editingModal === 'A' ? 'Speaker A' : 'Speaker B'} Name
            </Text>
            
            <View style={styles.modalInputContainer}>
              <View style={[
                styles.modalColorDot,
                { backgroundColor: editingModal === 'A' ? Colors.accent.blue : Colors.accent.red }
              ]} />
              <TextInput
                style={styles.modalInput}
                value={tempName}
                onChangeText={setTempName}
                placeholder={editingModal === 'A' ? 'Speaker A' : 'Speaker B'}
                placeholderTextColor={Colors.text.tertiary}
                autoFocus={true}
                maxLength={20}
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.cancelButton,
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.saveButton,
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={handleSaveName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 400,
    height: 400,
    backgroundColor: Colors.accent.blue,
    opacity: 0.08,
    top: -150,
    left: -100,
  },
  orb2: {
    width: 350,
    height: 350,
    backgroundColor: Colors.accent.red,
    opacity: 0.08,
    bottom: -100,
    right: -80,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.purple.glow,
    opacity: 0.03,
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
    marginTop: 60,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 205,
    height: 110,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: '300',
    color: Colors.text.primary,
    letterSpacing: 8,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: Colors.purple.main,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.text.tertiary,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 32,
  },
  featureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureBadgePressed: {
    backgroundColor: Colors.background.tertiary,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text.secondary,
    letterSpacing: 0.5,
  },
  editIcon: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginLeft: 4,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.background.tertiary,
    marginHorizontal: 16,
  },
  timeInputContainer: {
    marginTop: 24,
    alignItems: 'center',
    width: '100%',
  },
  timeSelectorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
    gap: 16,
    marginBottom: 12,
  },
  arrowButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.purple.dark,
  },
  arrowButtonPressed: {
    backgroundColor: Colors.purple.dark,
    transform: [{ scale: 0.95 }],
  },
  arrowText: {
    fontSize: 20,
    color: Colors.purple.light,
    fontWeight: '600',
  },
  timeDisplay: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  timeNumber: {
    fontSize: 48,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: 2,
  },
  timeUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.purple.light,
    letterSpacing: 1,
    marginBottom: 6,
  },
  
  // ========== BUTTONS SECTION ==========
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    position: 'relative',
  },
  buttonInner: {
    width: '100%',
    backgroundColor: Colors.purple.main,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.purple.light,
    shadowColor: Colors.purple.main,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 15,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.purple.glow,
    borderRadius: 16,
    opacity: 0.5,
    zIndex: -1,
    transform: [{ scale: 1.1 }],
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  
  // HISTORY BUTTON - CLEARLY DEFINED
  historyButton: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
    marginBottom: 8,
  },
  historyButtonPressed: {
    opacity: 0.8,
    backgroundColor: Colors.background.tertiary,
  },
  historyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.5,
  },
  
  betaContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  betaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.purple.dark,
  },
  betaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.purple.main,
  },
  betaText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.purple.light,
    letterSpacing: 2,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.text.tertiary,
    letterSpacing: 1,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.purple.dark,
    gap: 12,
  },
  modalColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    paddingVertical: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cancelButton: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.background.tertiary,
  },
  saveButton: {
    backgroundColor: Colors.purple.main,
    borderWidth: 1,
    borderColor: Colors.purple.light,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
});
