import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, Switch } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { User, ROLE_LABELS, Student, ClassGroup, Memo, SundayInfo, AttendanceStatus } from '../models/types';
import { exportAttendance, exportMemos, exportStudentList, exportClassSummary } from '../utils/exportUtils';

interface Props {
  currentUser: User;
  users: User[];
  students: Student[];
  classes: ClassGroup[];
  memos: Memo[];
  sundays: SundayInfo[];
  currentWeekIndex: number;
  classTeachers: User[];
  classStudents: Student[];
  selectedClassName: string;
  getAttendance: (personId: string, weekIndex: number) => AttendanceStatus;
  onSwitchUser: (userId: string) => void;
  onLogout: () => void;
  year: number;
}

export default function SettingsScreen({
  currentUser, users, students, classes, memos, sundays, currentWeekIndex,
  classTeachers, classStudents, selectedClassName, getAttendance,
  onSwitchUser, onLogout, year,
}: Props) {
  const [showExport, setShowExport] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [showYearEnd, setShowYearEnd] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleExport = (type: string) => {
    setShowExport(false);
    try {
      switch (type) {
        case '출석': exportAttendance(classStudents, classTeachers, sundays, currentWeekIndex, getAttendance, selectedClassName); break;
        case '메모': exportMemos(memos, students, sundays); break;
        case '학생 명단': exportStudentList(students, classes); break;
        case '반별 출석 요약': exportClassSummary(classes, students, users, sundays, currentWeekIndex, getAttendance); break;
      }
      Alert.alert('완료', `${type} 데이터가 CSV 파일로 다운로드되었습니다.`);
    } catch (e) { Alert.alert('오류', '내보내기에 실패했습니다.'); }
  };

  const handlePromotion = () => {
    Alert.alert('학년 승급', `모든 학생의 학년을 1단계 올리시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '승급 실행', onPress: () => { setShowPromotion(false); Alert.alert('완료', '학년 승급이 완료되었습니다.'); } },
    ]);
  };

  const handleYearEnd = () => {
    Alert.alert('년말 정리', `${year}년 데이터를 아카이브하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '실행', style: 'destructive', onPress: () => { setShowYearEnd(false); Alert.alert('완료', `${year}년 아카이브 완료`); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />

      {/* Glass Header */}
      <View style={styles.headerWrap}>
        <BlurView intensity={50} tint="light">
          <View style={styles.headerOverlay}>
            <Text style={styles.headerTitle}>설정</Text>
          </View>
        </BlurView>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={[styles.glassWrap, SHADOWS.medium]}>
          <BlurView intensity={60} tint="light">
            <View style={styles.glassInner}>
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{currentUser.name[0]}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{currentUser.name}</Text>
                  <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{ROLE_LABELS[currentUser.role]}</Text></View>
                  <Text style={styles.profileEmail}>{currentUser.email}</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        {/* User switch */}
        <Text style={styles.sectionTitle}>데모: 사용자 전환</Text>
        <Text style={styles.sectionDesc}>다른 역할로 앱을 테스트할 수 있습니다</Text>
        <View style={[styles.glassWrap, SHADOWS.small]}>
          <BlurView intensity={60} tint="light">
            <View style={styles.glassInner}>
              {users.map((u, i) => (
                <TouchableOpacity key={u.id}
                  style={[styles.userRow, i < users.length - 1 && styles.userRowBorder, currentUser.id === u.id && styles.userRowActive]}
                  onPress={() => onSwitchUser(u.id)}>
                  <View style={[styles.userAvatar, currentUser.id === u.id && styles.userAvatarActive]}>
                    <Text style={styles.userAvatarText}>{u.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userRole}>{ROLE_LABELS[u.role]}</Text>
                  </View>
                  {currentUser.id === u.id && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>현재</Text></View>}
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>앱 설정</Text>
        <View style={[styles.glassWrap, SHADOWS.small]}>
          <BlurView intensity={60} tint="light">
            <View style={styles.glassInner}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>알림 설정</Text>
                <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }} thumbColor={notificationsEnabled ? COLORS.primary : '#f4f3f4'} />
              </View>
              <View style={styles.settingDivider} />
              <SettingRow label="데이터 내보내기 (엑셀)" onPress={() => setShowExport(true)} />
              <View style={styles.settingDivider} />
              <SettingRow label="학년 승급 관리" onPress={() => setShowPromotion(true)} />
              <View style={styles.settingDivider} />
              <SettingRow label="년말 정리" onPress={() => setShowYearEnd(true)} />
              <View style={styles.settingDivider} />
              <SettingRow label="공지사항" onPress={() => Alert.alert('공지사항', '새로운 공지사항이 없습니다.')} />
            </View>
          </BlurView>
        </View>

        {/* Data summary */}
        <Text style={styles.sectionTitle}>데이터 현황</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard label="등록된 반" value={`${classes.length}`} color={COLORS.primary} />
          <SummaryCard label="활성 학생" value={`${students.filter(s => s.isActive).length}`} color={COLORS.success} />
          <SummaryCard label="전체 학생" value={`${students.length}`} color={COLORS.info} />
          <SummaryCard label="교사" value={`${users.length}`} color={COLORS.late} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => {
          Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
            { text: '취소', style: 'cancel' }, { text: '로그아웃', style: 'destructive', onPress: onLogout },
          ]);
        }}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
        <Text style={styles.version}>Sunday School App v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Export Modal */}
      <Modal visible={showExport} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalWrap, SHADOWS.large]}>
            <BlurView intensity={90} tint="light">
              <View style={styles.modalInner}>
                <Text style={styles.modalTitle}>데이터 내보내기</Text>
                <Text style={styles.modalDesc}>내보낼 데이터를 선택하세요</Text>
                {['출석', '메모', '학생 명단', '반별 출석 요약'].map(type => (
                  <TouchableOpacity key={type} style={styles.exportBtn} onPress={() => handleExport(type)}>
                    <Text style={styles.exportBtnText}>{type} 데이터</Text>
                    <Text style={styles.exportArrow}>{'>'}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowExport(false)}>
                  <Text style={styles.closeBtnText}>닫기</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>

      {/* Promotion Modal */}
      <Modal visible={showPromotion} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalWrap, SHADOWS.large]}>
            <BlurView intensity={90} tint="light">
              <View style={styles.modalInner}>
                <Text style={styles.modalTitle}>학년 승급 관리</Text>
                <Text style={styles.modalDesc}>활성 학생 {students.filter(s => s.isActive).length}명의 학년을 1단계 올립니다.</Text>
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPromotion(false)}><Text style={styles.modalCancelText}>취소</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalConfirmBtn, SHADOWS.glow]} onPress={handlePromotion}><Text style={styles.modalConfirmText}>승급 실행</Text></TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>

      {/* Year End Modal */}
      <Modal visible={showYearEnd} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalWrap, SHADOWS.large]}>
            <BlurView intensity={90} tint="light">
              <View style={styles.modalInner}>
                <Text style={styles.modalTitle}>년말 정리</Text>
                <Text style={styles.modalDesc}>{year}년 데이터를 아카이브하고 {year + 1}년을 준비합니다.{'\n\n'}이 작업은 되돌릴 수 없습니다.</Text>
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowYearEnd(false)}><Text style={styles.modalCancelText}>취소</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: COLORS.danger }]} onPress={handleYearEnd}><Text style={styles.modalConfirmText}>실행</Text></TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SettingRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingArrow}>{'>'}</Text>
    </TouchableOpacity>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.summaryCardWrap, SHADOWS.small]}>
      <BlurView intensity={50} tint="light" style={{ borderRadius: SIZES.radiusMd, overflow: 'hidden' }}>
        <View style={styles.summaryCardInner}>
          <Text style={[styles.summaryValue, { color }]}>{value}</Text>
          <Text style={styles.summaryLabel}>{label}</Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  blob1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: COLORS.blob1, top: -60, left: -80 },
  blob2: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: COLORS.blob2, bottom: 100, right: -60 },

  headerWrap: { overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)' },
  headerOverlay: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Glass card wrapper
  glassWrap: { borderRadius: SIZES.radiusLg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', marginBottom: 16 },
  glassInner: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 18 },

  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  profileInfo: { marginLeft: 16 },
  profileName: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  roleBadge: { backgroundColor: 'rgba(99,91,255,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: SIZES.radiusFull, alignSelf: 'flex-start', marginTop: 4 },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  profileEmail: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 20, marginBottom: 4 },
  sectionDesc: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },

  userRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  userRowBorder: { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  userRowActive: { backgroundColor: 'rgba(99,91,255,0.08)' },
  userAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  userAvatarActive: { backgroundColor: COLORS.primary },
  userAvatarText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  userName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  userRole: { fontSize: 12, color: COLORS.textSecondary },
  currentBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: SIZES.radiusFull },
  currentBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 0, paddingVertical: 15 },
  settingLabel: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  settingArrow: { fontSize: 16, color: COLORS.textLight, fontWeight: '600' },
  settingDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  summaryCardWrap: { flex: 1, minWidth: 70, borderRadius: SIZES.radiusMd, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  summaryCardInner: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 16, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' },

  logoutBtn: { borderRadius: SIZES.radiusMd, paddingVertical: 15, alignItems: 'center', marginTop: 28, borderWidth: 1.5, borderColor: COLORS.danger },
  logoutText: { color: COLORS.danger, fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', color: COLORS.textLight, fontSize: 12, marginTop: 16 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: COLORS.modalBg, justifyContent: 'center', padding: 24 },
  modalWrap: { borderRadius: SIZES.radiusXl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  modalInner: { backgroundColor: 'rgba(255,255,255,0.18)', padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  modalDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 16 },
  exportBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(99,91,255,0.08)', borderRadius: SIZES.radiusMd,
    paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8,
  },
  exportBtnText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  exportArrow: { fontSize: 14, color: COLORS.primaryLight, fontWeight: '700' },
  closeBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  closeBtnText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.2)' },
  modalCancelText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: SIZES.radiusMd, backgroundColor: COLORS.primary },
  modalConfirmText: { fontSize: 15, color: COLORS.white, fontWeight: '700' },
});
