import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

interface Props {
  flags: boolean[];
}

export default function MemoIndicator({ flags }: Props) {
  const [r, b, g] = flags;
  if (!r && !b && !g) return <View style={{ height: SIZES.memoHeight + 2 }} />;
  return (
    <View style={styles.row}>
      <View style={[styles.dot, r ? { backgroundColor: COLORS.memoRed } : styles.off]} />
      <View style={[styles.dot, b ? { backgroundColor: COLORS.memoBlue } : styles.off]} />
      <View style={[styles.dot, g ? { backgroundColor: COLORS.memoGreen } : styles.off]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 2, marginTop: 2, height: SIZES.memoHeight },
  dot: { width: SIZES.memoWidth, height: SIZES.memoHeight, borderRadius: 2 },
  off: { backgroundColor: 'transparent' },
});
