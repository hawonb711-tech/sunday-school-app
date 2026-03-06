import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { showAlert } from './src/utils/alertUtils';
import { BlurView } from 'expo-blur';
import { useAppState } from './src/hooks/useAppState';
import { COLORS, SIZES } from './src/constants/theme';
import { signInWithEmail, signUpWithEmail } from './src/services/authService';

import LoginScreen from './src/screens/LoginScreen';
import AttendanceGridScreen from './src/screens/AttendanceGridScreen';
import ClassManageScreen from './src/screens/ClassManageScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MemoTimelineScreen from './src/screens/MemoTimelineScreen';

type Tab = 'attendance' | 'classManage' | 'settings';

type SubScreen =
  | { type: 'none' }
  | { type: 'profile'; personId: string; personName: string; personType: 'teacher' | 'student' }
  | { type: 'timeline'; personId: string; personName: string; initialWeekIndex?: number };

export default function App() {
  const state = useAppState();
  const [activeTab, setActiveTab] = useState<Tab>('attendance');
  const [subScreen, setSubScreen] = useState<SubScreen>({ type: 'none' });

  const handleLogin = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) {
      // Demo mode: skip Firebase auth
      state.setIsLoggedIn(true);
      return;
    }
    try {
      await signInWithEmail(email, password);
      state.setIsLoggedIn(true);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        // User doesn't exist, try sign up
        try {
          await signUpWithEmail(email, password);
          state.setIsLoggedIn(true);
        } catch (e2: any) {
          showAlert('회원가입 오류', e2.message || '계정을 만들 수 없습니다.');
        }
      } else {
        showAlert('로그인 오류', e.message || '로그인에 실패했습니다.');
      }
    }
  };
  const handleGoogleLogin = () => { state.setIsLoggedIn(true); };

  const handleLongPressName = (personId: string, personType: 'teacher' | 'student') => {
    const person = personType === 'teacher' ? state.users.find(u => u.id === personId) : state.students.find(s => s.id === personId);
    if (person) setSubScreen({ type: 'profile', personId, personName: person.name, personType });
  };

  const handleLongPressCell = (personId: string, weekIndex: number) => {
    const person = state.users.find(u => u.id === personId) || state.students.find(s => s.id === personId);
    if (person) setSubScreen({ type: 'timeline', personId, personName: person.name, initialWeekIndex: weekIndex });
  };

  const handleOpenTimeline = (personId: string, weekIndex?: number) => {
    const person = state.users.find(u => u.id === personId) || state.students.find(s => s.id === personId);
    if (person) setSubScreen({ type: 'timeline', personId, personName: person.name, initialWeekIndex: weekIndex });
  };

  const handleBack = () => setSubScreen({ type: 'none' });

  if (!state.isLoggedIn) {
    return (<><StatusBar style="light" /><LoginScreen onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} /></>);
  }

  // Loading screen while Firebase data loads
  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBlob1} />
        <View style={styles.loadingBlob2} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>데이터 불러오는 중...</Text>
      </View>
    );
  }

  if (subScreen.type === 'profile') {
    return (<><StatusBar style="dark" /><ProfileScreen personId={subScreen.personId} personName={subScreen.personName} personType={subScreen.personType} sundays={state.sundays} currentWeekIndex={state.currentWeekIndex} year={state.year} getAttendance={state.getAttendance} getStats={state.getStudentStats} onBack={handleBack} onOpenTimeline={handleOpenTimeline} /></>);
  }

  if (subScreen.type === 'timeline') {
    return (<><StatusBar style="dark" /><MemoTimelineScreen personId={subScreen.personId} personName={subScreen.personName} sundays={state.sundays} currentWeekIndex={state.currentWeekIndex} initialWeekIndex={subScreen.initialWeekIndex} getAttendance={state.getAttendance} getMemos={state.getMemosForStudent} onAddMemo={state.addMemo} onEditMemo={state.editMemo} onDeleteMemo={state.deleteMemo} onBack={handleBack} currentUserId={state.currentUser.id} currentUserName={state.currentUser.name} /></>);
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendanceGridScreen year={state.year} sundays={state.sundays} currentWeekIndex={state.currentWeekIndex} teachers={state.classTeachers} students={state.classStudents} teachersExpanded={state.teachersExpanded} onToggleTeachers={() => state.setTeachersExpanded(!state.teachersExpanded)} getAttendance={state.getAttendance} cycleAttendance={state.cycleAttendance} getMemoFlags={state.getMemoFlags} onLongPressName={handleLongPressName} onLongPressCell={handleLongPressCell} selectedClassName={state.selectedClass?.name} />;
      case 'classManage':
        return <ClassManageScreen classes={state.classes} students={state.students} users={state.users} selectedClassId={state.selectedClassId} onSelectClass={state.setSelectedClassId} onConfirmClass={state.confirmClass} onAddClass={state.addClass} onAddStudent={state.addStudent} onToggleStudentActive={state.toggleStudentActive} onAddTeacherToClass={state.addTeacherToClass} onRemoveTeacherFromClass={state.removeTeacherFromClass} onMoveStudent={state.moveStudentToClass} />;
      case 'settings':
        return <SettingsScreen currentUser={state.currentUser} users={state.users} students={state.students} classes={state.classes} memos={state.memos} sundays={state.sundays} currentWeekIndex={state.currentWeekIndex} classTeachers={state.classTeachers} classStudents={state.classStudents} selectedClassName={state.selectedClass?.name || ''} getAttendance={state.getAttendance} onSwitchUser={state.switchUser} onLogout={() => { state.setIsLoggedIn(false); setActiveTab('attendance'); }} year={state.year} />;
    }
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'attendance', label: '출석', icon: '📋' },
    { key: 'classManage', label: '반 관리', icon: '👥' },
    { key: 'settings', label: '설정', icon: '⚙️' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {renderContent()}
      {/* Glass Tab Bar */}
      <View style={styles.tabBarWrap}>
        <BlurView intensity={60} tint="light" style={styles.tabBarBlur}>
          <View style={styles.tabBarOverlay}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity key={tab.key} style={styles.tabItem} onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
                  <View style={[styles.tabBtn, isActive && styles.tabBtnActive]}>
                    <Text style={styles.tabIcon}>{tab.icon}</Text>
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingBlob1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(99,91,255,0.12)', top: -60, right: -80,
  },
  loadingBlob2: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(14,165,233,0.08)', bottom: 80, left: -60,
  },
  loadingText: {
    marginTop: 16, fontSize: 15, color: COLORS.textSecondary, fontWeight: '600',
  },
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBarWrap: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  tabBarBlur: {},
  tabBarOverlay: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row',
    paddingBottom: 24,
    paddingTop: 6,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabBtn: { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 20, borderRadius: SIZES.radiusMd },
  tabBtnActive: { backgroundColor: 'rgba(99,91,255,0.12)' },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textLight },
  tabLabelActive: { color: COLORS.primary, fontWeight: '800' },
});
