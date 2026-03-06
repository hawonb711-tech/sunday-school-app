import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { SundayInfo, AttendanceStatus, User, Student } from '../models/types';
import { groupSundaysByMonth } from '../utils/dateUtils';
import AttendanceCircle from '../components/AttendanceCircle';
import MemoIndicator from '../components/MemoIndicator';

interface Props {
  year: number;
  sundays: SundayInfo[];
  currentWeekIndex: number;
  teachers: User[];
  students: Student[];
  teachersExpanded: boolean;
  onToggleTeachers: () => void;
  getAttendance: (personId: string, weekIndex: number) => AttendanceStatus;
  cycleAttendance: (personId: string, weekIndex: number) => void;
  getMemoFlags: (personId: string, weekIndex: number) => boolean[];
  onLongPressName: (personId: string, personType: 'teacher' | 'student') => void;
  onLongPressCell: (personId: string, weekIndex: number) => void;
  selectedClassName?: string;
}

export default function AttendanceGridScreen({
  year, sundays, currentWeekIndex, teachers, students,
  teachersExpanded, onToggleTeachers,
  getAttendance, cycleAttendance, getMemoFlags,
  onLongPressName, onLongPressCell, selectedClassName,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const bodyScrollRef = useRef<ScrollView>(null);
  const months = groupSundaysByMonth(sundays);
  const cur = sundays[currentWeekIndex];

  useEffect(() => {
    const t = setTimeout(() => {
      const x = Math.max(0, currentWeekIndex - 2) * SIZES.gridCellWidth;
      scrollRef.current?.scrollTo({ x, animated: false });
      bodyScrollRef.current?.scrollTo({ x, animated: false });
    }, 200);
    return () => clearTimeout(t);
  }, [currentWeekIndex]);

  const visTeachers = teachersExpanded ? teachers : teachers.slice(0, 1);

  return (
    <View style={styles.container}>
      {/* Vivid background blobs */}
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />
      <View style={styles.blob3} pointerEvents="none" />

      {/* Glass Header */}
      <View style={styles.headerWrap}>
        <BlurView intensity={50} tint="light" style={styles.headerBlur}>
          <View style={styles.headerOverlay}>
            <View>
              <Text style={styles.topTitle}>{selectedClassName || '출석부'}</Text>
              <Text style={styles.topSub}>
                {cur ? `${cur.month + 1}월 ${cur.day}일` : ''} · {currentWeekIndex + 1}주차
              </Text>
            </View>
            <View style={styles.topBadges}>
              <View style={styles.badge}><Text style={styles.badgeText}>{year}</Text></View>
              <View style={[styles.badge, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <Text style={[styles.badgeText, { color: COLORS.success }]}>{students.length}명</Text>
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Fixed header row */}
      <View style={styles.fixedHeader}>
        <View style={styles.cornerCells}>
          <View style={styles.cornerMonth}><Text style={styles.cornerMonthText}>{year}</Text></View>
          <View style={styles.cornerDate}><Text style={styles.cornerDateText}>이름</Text></View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEnabled={false}
          ref={scrollRef}
        >
          <View>
            <View style={styles.hRow}>
              {Array.from(months.entries()).map(([m, suns]) => (
                <View key={m} style={[styles.mHeader, { width: suns.length * SIZES.gridCellWidth }]}>
                  <Text style={styles.mText}>{m + 1}월</Text>
                </View>
              ))}
            </View>
            <View style={styles.hRow}>
              {sundays.map((s, i) => (
                <View key={i} style={[styles.dHeader, i === currentWeekIndex && styles.dCurrent]}>
                  <Text style={[styles.dText, i === currentWeekIndex && styles.dCurrentText]}>{s.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Scrollable body */}
      <ScrollView style={styles.bodyVertical} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {/* Names column */}
          <View style={styles.names}>
            <TouchableOpacity onPress={onToggleTeachers} style={styles.tToggle} activeOpacity={0.7}>
              <Text style={styles.tToggleText}>{teachersExpanded ? '▲' : '▼'} 교사</Text>
            </TouchableOpacity>
            {visTeachers.map((t, i) => (
              <Pressable key={t.id}
                style={[styles.nCell, styles.nTeacher, i === visTeachers.length - 1 && styles.nTeacherLast]}
                onLongPress={() => onLongPressName(t.id, 'teacher')} delayLongPress={600}>
                <Text style={styles.nText} numberOfLines={1}>{t.name}</Text>
              </Pressable>
            ))}
            <View style={styles.sep} />
            {students.map(s => (
              <Pressable key={s.id} style={[styles.nCell, styles.nStudent]}
                onLongPress={() => onLongPressName(s.id, 'student')} delayLongPress={600}>
                <Text style={styles.nText} numberOfLines={1}>{s.name}</Text>
              </Pressable>
            ))}
          </View>

          {/* Data columns - horizontal scroll */}
          <ScrollView
            ref={bodyScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onScroll={(e) => {
              scrollRef.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false });
            }}
            scrollEventThrottle={16}
          >
            <View>
              {/* Teacher toggle spacer */}
              <View style={{ height: 28 }} />
              {/* Teacher rows */}
              {visTeachers.map((t, ti) => (
                <View key={t.id} style={[styles.aRow, ti === visTeachers.length - 1 && styles.aRowLast]}>
                  {sundays.map((_, si) => (
                    <Pressable key={si}
                      style={[styles.aCell, si === currentWeekIndex && styles.aCurrent, si > currentWeekIndex && styles.aFuture]}
                      onPress={() => cycleAttendance(t.id, si)}
                      onLongPress={() => onLongPressCell(t.id, si)} delayLongPress={600}>
                      <AttendanceCircle status={getAttendance(t.id, si)} />
                      <MemoIndicator flags={getMemoFlags(t.id, si)} />
                    </Pressable>
                  ))}
                </View>
              ))}
              {/* Sep */}
              <View style={styles.sepRow}>
                {sundays.map((_, i) => <View key={i} style={styles.sepSeg} />)}
              </View>
              {/* Student rows */}
              {students.map((st, si) => (
                <View key={st.id} style={[styles.aRow, si % 2 === 1 && styles.aRowAlt]}>
                  {sundays.map((_, wi) => (
                    <Pressable key={wi}
                      style={[styles.aCell, si % 2 === 1 && styles.aCellAlt,
                        wi === currentWeekIndex && styles.aCurrent, wi > currentWeekIndex && styles.aFuture]}
                      onPress={() => cycleAttendance(st.id, wi)}
                      onLongPress={() => onLongPressCell(st.id, wi)} delayLongPress={600}>
                      <AttendanceCircle status={getAttendance(st.id, wi)} />
                      <MemoIndicator flags={getMemoFlags(st.id, wi)} />
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Glass Legend */}
      <View style={styles.legendWrap}>
        <BlurView intensity={50} tint="light" style={styles.legendBlur}>
          <View style={styles.legendOverlay}>
            <Leg color={COLORS.present} label="출석" />
            <Leg color={COLORS.late} label="지각" />
            <Leg color={COLORS.absent} label="결석" border />
            <Leg color={COLORS.prenotified} label="사전통지" border />
            <Leg color={COLORS.untouched} label="미입력" />
          </View>
        </BlurView>
      </View>
    </View>
  );
}

function Leg({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={[{ width: 10, height: 10, borderRadius: 5 },
        border ? { backgroundColor: '#fff', borderWidth: 2, borderColor: color } : { backgroundColor: color }
      ]} />
      <Text style={{ fontSize: 11, color: COLORS.textSecondary }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  // Vivid blobs so glass cards have something to blur over
  blob1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: COLORS.blob1, top: -80, right: -100,
  },
  blob2: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: COLORS.blob2, bottom: 40, left: -80,
  },
  blob3: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: COLORS.blob3, top: 200, left: 50,
  },

  // Glass header
  headerWrap: {
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  headerBlur: {},
  headerOverlay: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
  },
  topTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  topSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  topBadges: { flexDirection: 'row', gap: 6 },
  badge: {
    backgroundColor: 'rgba(99,91,255,0.10)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  // Fixed header
  fixedHeader: { flexDirection: 'row' },
  cornerCells: { width: SIZES.nameColumnWidth, zIndex: 10, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  cornerMonth: {
    height: SIZES.monthHeaderHeight, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.primary, borderBottomWidth: 1, borderColor: COLORS.primaryDark,
  },
  cornerMonthText: { fontSize: SIZES.yearFont, fontWeight: '800', color: COLORS.white },
  cornerDate: {
    height: SIZES.dateHeaderHeight, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(99,91,255,0.08)', borderBottomWidth: 1, borderColor: COLORS.border,
  },
  cornerDateText: { fontSize: SIZES.dateFont, fontWeight: '700', color: COLORS.primary },

  // Scrollable body
  bodyVertical: { flex: 1 },
  grid: { flexDirection: 'row' },
  names: {
    width: SIZES.nameColumnWidth, backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 10, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  tToggle: {
    height: 28, justifyContent: 'center', paddingLeft: 12,
    backgroundColor: COLORS.teacherBg, borderBottomWidth: 1, borderColor: COLORS.border,
  },
  tToggleText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  nCell: {
    height: SIZES.gridCellHeight, justifyContent: 'center', paddingHorizontal: 10,
    borderBottomWidth: 1, borderColor: COLORS.borderLight,
  },
  nTeacher: { backgroundColor: COLORS.teacherBg },
  nTeacherLast: { borderBottomWidth: 2, borderBottomColor: COLORS.separator },
  nStudent: { backgroundColor: 'rgba(255,255,255,0.6)' },
  nText: { fontSize: SIZES.nameFont, fontWeight: '600', color: COLORS.text },
  sep: { height: 2, backgroundColor: COLORS.separator },

  hRow: { flexDirection: 'row' },
  mHeader: {
    height: SIZES.monthHeaderHeight, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    borderRightWidth: 1, borderColor: COLORS.primaryDark,
  },
  mText: { fontSize: SIZES.monthFont, fontWeight: '700', color: COLORS.white },
  dHeader: {
    width: SIZES.gridCellWidth, height: SIZES.dateHeaderHeight,
    backgroundColor: 'rgba(99,91,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
    borderRightWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border,
  },
  dCurrent: { backgroundColor: COLORS.currentWeekBg },
  dText: { fontSize: SIZES.dateFont, fontWeight: '600', color: COLORS.textSecondary },
  dCurrentText: { color: COLORS.text, fontWeight: '800' },

  aRow: { flexDirection: 'row' },
  aRowAlt: {},
  aRowLast: { borderBottomWidth: 2, borderBottomColor: COLORS.separator },
  aCell: {
    width: SIZES.gridCellWidth, height: SIZES.gridCellHeight,
    justifyContent: 'center', alignItems: 'center',
    borderRightWidth: 1, borderBottomWidth: 1, borderColor: COLORS.borderLight,
    backgroundColor: 'rgba(255,255,255,0.5)', paddingVertical: 2,
  },
  aCellAlt: { backgroundColor: 'rgba(255,255,255,0.35)' },
  aCurrent: { backgroundColor: COLORS.currentWeekBg },
  aFuture: { backgroundColor: 'rgba(255,255,255,0.25)' },
  sepRow: { flexDirection: 'row', height: 2 },
  sepSeg: { width: SIZES.gridCellWidth, height: 2, backgroundColor: COLORS.separator },

  // Glass legend
  legendWrap: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  legendBlur: {},
  legendOverlay: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row', justifyContent: 'center', gap: 14,
    paddingVertical: 8,
  },
});
