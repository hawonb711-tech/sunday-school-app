import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  style?: ViewStyle | ViewStyle[];
  noPadding?: boolean;
}

export default function GlassCard({
  children,
  intensity = 60,
  tint = 'light',
  style,
  noPadding = false,
}: Props) {
  return (
    <View style={[styles.wrapper, style]}>
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[styles.blur, noPadding ? null : styles.padding]}
      >
        <View style={styles.overlay}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  blur: {
    overflow: 'hidden',
  },
  padding: {
    padding: 18,
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
