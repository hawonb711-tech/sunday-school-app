import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { SundayInfo, AttendanceStatus } from '../models/types';
import { getQuarters } from '../utils/dateUtils';
import AttendanceCircle from '../components/AttendanceCircle';

interface Props {
  personId: string;
  personName: string;
  personType: 'teacher' | 'student';
  sundays: SundayInfo[];
  currentWeekIndex: number;
  year: number;
  getAttendance: (personId: string, weekIndex: number) => AttendanceStatus;
  getStats: (personId: string) => { total: number; present: number; late: number; absent: number; prenotified: number; rate: number };
  onBack: () => void;
  onOpenTimeline: (personId: string, weekIndex?: number) => void;
}

export default function ProfileScreen({
  personId, personName, personType, sundays, currentWeekIndex, year,
  getAttendance, getStats, onBack, onOpenTimeline,
}: Props) {
  const [selectedYear, setSelectedYear] = useState(year);
  const stats = getStats(personId);
  const quarters = getQuarters(sundays);

  const monthlyRates: { month: number; rate: number }[] = [];
  for (let m = 0; m < 12; m++) {
    let present = 0, total = 0;
    sundays.forEach((s, si) => {
      if (s.month === m && si <= currentWeekIndex) {
        total++;
        const st = getAttendance(personId, si);
        if (st === 'present' || st === 'late') present++;
      }
    });
    monthlyRates.push({ month: m, rate: total > 0 ? Math.round((present / total) * 100) : 0 });
  }

  return (
    <View style={styles.container}>
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />
      <View style={styles.headerWrap}>
        <BlurView intensity={50} tint="light">
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backIcon}>{'<'}</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{personName[0]}</Text>
              </View>
              <View>
                <Text style={styles.hName}>{personName}</Text>
                <Text style={styles.hRole}>{personType === 'teacher' ? '선생님' : '학생'}</Text>
              </View>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </BlurView>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Year */}
        <View style={styles.yearRow}>
          {[year - 1, year].map(y => (
            <TouchableOpacity key={y}
              style={[styles.yearPill, selectedYear === y && styles.yearPillActive]}
              onPress={() => setSelectedYear(y)}>
              <Text style={[styles.yearPillText, selectedYear === y && styles.yearPillTextActive]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rate hero */}
        <View style={[styles.glassWrap, SHADOWS.medium]}>
        <BlurView intensity={60} tint="light">
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>출석률</Text>
          <Text style={styles.rateVal}>{stats.rate}<Text style={styles.ratePct}>%</Text></Text>
          <View style={styles.rateBar}>
            <View style={[styles.rateFill, { width: `${stats.rate}%` }]} />
          </View>
        </View>
        </BlurView>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Stat label="출석" value={stats.present} color={COLORS.present} bg={COLORS.presentBg} />
          <Stat label="지각" value={stats.late} color={COLORS.late} bg={COLORS.lateBg} />
          <Stat label="결석" value={stats.absent} color={COLORS.absent} bg={COLORS.absentBg} />
          <Stat label="사전통지" value={stats.prenotified} color={COLORS.warning} bg={COLORS.prenotifiedBg} />
        </View>

        {/* Monthly */}
        <View style={[styles.glassWrap, SHADOWS.small]}>
          <BlurView intensity={60} tint="light">
            <View style={styles.card}>
              <Text style={styles.secTitle}>월별 출석률</Text>
              <View style={styles.chart}>
                {monthlyRates.map(({ month, rate }) => (
                  <View key={month} style={styles.chartCol}>
                    <Text style={styles.chartVal}>{rate > 0 ? rate : ''}</Text>
                    <View style={[styles.chartBar,
                      { height: Math.max(4, rate * 1.1) },
                      rate >= 80 ? { backgroundColor: COLORS.success } :
                      rate >= 50 ? { backgroundColor: COLORS.accent } :
                      rate > 0 ? { backgroundColor: COLORS.absent } :
                      { backgroundColor: COLORS.border }
                    ]} />
                    <Text style={styles.chartLabel}>{month + 1}</Text>
                  </View>
                ))}
              </View>
            </View>
          </BlurView>
        </View>

        {/* Quarters */}
        {quarters.map((q, qi) => (
          <View key={qi} style={[styles.glassWrap, SHADOWS.small]}>
            <BlurView intensity={60} tint="light">
              <View style={styles.card}>
                <Text style={styles.secTitle}>{q.label}</Text>
                <View style={styles.qGrid}>
                  {q.sundays.map(s => (
                    <TouchableOpacity key={s.weekIndex} style={styles.qWeek}
                      onPress={() => onOpenTimeline(personId, s.weekIndex)}>
                      <Text style={styles.qDate}>{s.month + 1}/{s.day}</Text>
                      <AttendanceCircle status={getAttendance(personId, s.weekIndex)} size="small" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </BlurView>
          </View>
        ))}

        <TouchableOpacity style={[styles.tlBtn, SHADOWS.glow]} onPress={() => onOpenTimeline(personId)}>
          <Text style={styles.tlBtnText}>메모 타임라인 보기</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[sty.card, { backgroundColor: bg }]}>
      <Text style={[sty.val, { color }]}>{value}</Text>
      <Text style={sty.label}>{label}</Text>
    </View>
  );
}
const sty = StyleSheet.create({
  card: { flex: 1, borderRadius: SIZES.radiusMd, padding: 12, alignItems: 'center' },
  val: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  blob1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: COLORS.blob1, top: -60, right: -80 },
  blob2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: COLORS.blob2, bottom: 80, left: -60 },
  headerWrap: { overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)' },
  headerOverlay: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
  },
  glassWrap: { borderRadius: SIZES.radiusLg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', marginBottom: 12 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  hName: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  hRole: { fontSize: 12, color: COLORS.textSecondary },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  yearRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  yearPill: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  yearPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  yearPillText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  yearPillTextActive: { color: COLORS.white },

  rateCard: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 24 },
  rateLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  rateVal: { fontSize: 48, fontWeight: '900', color: COLORS.primary, marginVertical: 4, letterSpacing: -2 },
  ratePct: { fontSize: 24, fontWeight: '700' },
  rateBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  rateFill: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },

  card: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 18 },
  secTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 14, letterSpacing: -0.3 },

  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 3 },
  chartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  chartVal: { fontSize: 9, color: COLORS.textLight, fontWeight: '700', marginBottom: 2 },
  chartBar: { width: '70%', maxWidth: 22, borderRadius: 4, minHeight: 4 },
  chartLabel: { fontSize: 10, color: COLORS.textLight, marginTop: 4, fontWeight: '600' },

  qGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  qWeek: { alignItems: 'center', gap: 4 },
  qDate: { fontSize: 10, color: COLORS.textLight, fontWeight: '500' },

  tlBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMd,
    paddingVertical: 16, alignItems: 'center', marginVertical: 8,
  },
  tlBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
