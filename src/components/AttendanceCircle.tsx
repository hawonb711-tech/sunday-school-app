import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AttendanceStatus } from '../models/types';
import { COLORS, SIZES } from '../constants/theme';

interface Props {
  status: AttendanceStatus;
  onPress?: () => void;
  size?: 'normal' | 'small';
}

const statusColors: Record<AttendanceStatus, { bg: string; inner: string; border?: string }> = {
  untouched: { bg: COLORS.untouchedBg, inner: COLORS.untouched },
  present: { bg: COLORS.presentBg, inner: COLORS.present },
  late: { bg: COLORS.lateBg, inner: COLORS.late },
  absent: { bg: COLORS.white, inner: COLORS.absentBg, border: COLORS.absent },
  prenotified: { bg: COLORS.white, inner: COLORS.prenotifiedBg, border: COLORS.prenotified },
  future: { bg: '#F8FAFC', inner: '#E2E8F0' },
};

export default function AttendanceCircle({ status, onPress, size = 'normal' }: Props) {
  const c = statusColors[status] || statusColors.untouched;
  const outerSize = size === 'small' ? 20 : SIZES.circleOuter;
  const innerSize = size === 'small' ? 12 : SIZES.circleInner;

  const circle = (
    <View style={[
      { width: outerSize, height: outerSize, borderRadius: outerSize / 2,
        backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
      c.border ? { borderWidth: 2.5, borderColor: c.border } : null,
    ]}>
      <View style={{
        width: innerSize, height: innerSize, borderRadius: innerSize / 2,
        backgroundColor: c.inner,
      }} />
    </View>
  );

  if (onPress && status !== 'future') {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.6}>{circle}</TouchableOpacity>;
  }
  return circle;
}
