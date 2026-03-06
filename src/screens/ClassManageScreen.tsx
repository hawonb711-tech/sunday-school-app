import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { ClassGroup, Student, User, ROLE_LABELS } from '../models/types';

interface Props {
  classes: ClassGroup[];
  students: Student[];
  users: User[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  onConfirmClass: (id: string) => void;
  onAddClass: (name: string, gradeRange: string) => string | Promise<string>;
  onAddStudent: (name: string, classId: string, grade: number, parentName?: string, parentPhone?: string) => string | Promise<string>;
  onToggleStudentActive: (studentId: string) => void;
  onAddTeacherToClass: (classId: string, teacherId: string) => void;
  onRemoveTeacherFromClass: (classId: string, teacherId: string) => void;
  onMoveStudent: (studentId: string, newClassId: string) => void;
}

export default function ClassManageScreen({
  classes, students, users, selectedClassId, onSelectClass,
  onConfirmClass, onAddClass, onAddStudent, onToggleStudentActive,
  onAddTeacherToClass, onRemoveTeacherFromClass, onMoveStudent,
}: Props) {
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addStudentClassId, setAddStudentClassId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('3');
  const [newStudentParent, setNewStudentParent] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);
  const [teacherPickerClassId, setTeacherPickerClassId] = useState('');

  const handleAddClass = () => {
    if (!newClassName.trim()) { Alert.alert('오류', '반 이름을 입력해주세요.'); return; }
    onAddClass(newClassName.trim(), newClassGrade.trim() || '미정');
    setNewClassName(''); setNewClassGrade(''); setShowAddClass(false);
    Alert.alert('완료', `"${newClassName.trim()}" 반이 생성되었습니다. (가편성)`);
  };
  const handleConfirmClass = (cls: ClassGroup) => {
    Alert.alert('반편성 확정', `"${cls.name}"을 확정하시겠습니까?`, [
      { text: '취소', style: 'cancel' }, { text: '확정', onPress: () => onConfirmClass(cls.id) },
    ]);
  };
  const handleAddStudent = () => {
    if (!newStudentName.trim()) { Alert.alert('오류', '학생 이름을 입력해주세요.'); return; }
    onAddStudent(newStudentName.trim(), addStudentClassId, parseInt(newStudentGrade) || 3, newStudentParent.trim() || undefined, newStudentPhone.trim() || undefined);
    setNewStudentName(''); setNewStudentGrade('3'); setNewStudentParent(''); setNewStudentPhone(''); setShowAddStudent(false);
    Alert.alert('완료', `"${newStudentName.trim()}" 학생이 추가되었습니다.`);
  };
  const handleToggleStudent = (student: Student) => {
    Alert.alert(student.isActive ? '비활성화' : '활성화', `"${student.name}" 학생을 ${student.isActive ? '비활성화' : '활성화'}하시겠습니까?`, [
      { text: '취소', style: 'cancel' }, { text: '확인', onPress: () => onToggleStudentActive(student.id) },
    ]);
  };
  const handleMoveStudent = (student: Student) => {
    const otherClasses = classes.filter(c => c.id !== student.classId);
    if (otherClasses.length === 0) { Alert.alert('알림', '이동할 다른 반이 없습니다.'); return; }
    Alert.alert('반 이동', `"${student.name}" 학생을 어디로 이동하시겠습니까?`, [
      ...otherClasses.map(c => ({ text: c.name, onPress: () => { onMoveStudent(student.id, c.id); Alert.alert('완료', `${student.name} → ${c.name} 이동 완료`); } })),
      { text: '취소', style: 'cancel' as const },
    ]);
  };

  const allTeachers = users.filter(u => u.role === 'teacher' || u.role === 'assistant' || u.role === 'headTeacher');

  return (
    <View style={styles.container}>
      <View style={styles.blob1} pointerEvents="none" />
      <View style={styles.blob2} pointerEvents="none" />
      <View style={styles.blob3} pointerEvents="none" />

      {/* Glass Header */}
      <View style={styles.headerWrap}>
        <BlurView intensity={50} tint="light" style={styles.headerBlur}>
          <View style={styles.headerOverlay}>
            <View>
              <Text style={styles.title}>반 편성 관리</Text>
              <Text style={styles.subtitle}>반을 선택하여 관리하세요</Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{classes.length}개 반</Text>
            </View>
          </View>
        </BlurView>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {classes.map(cls => {
          const classStudents = students.filter(s => s.classId === cls.id);
          const activeStudents = classStudents.filter(s => s.isActive);
          const inactiveStudents = classStudents.filter(s => !s.isActive);
          const classTeachers = users.filter(u => cls.teacherIds.includes(u.id));
          const isSelected = cls.id === selectedClassId;

          return (
            <TouchableOpacity key={cls.id} activeOpacity={0.7} onPress={() => onSelectClass(cls.id)}>
              <View style={[styles.cardWrap, isSelected && styles.cardSelected, SHADOWS.small]}>
                <BlurView intensity={60} tint="light" style={styles.cardBlur}>
                  <View style={styles.cardOverlay}>
                    {/* Card header */}
                    <View style={styles.classHeader}>
                      <View style={styles.classNameRow}>
                        <View style={styles.classIcon}>
                          <Text style={styles.classIconText}>{cls.name[0]}</Text>
                        </View>
                        <Text style={styles.className}>{cls.name}</Text>
                      </View>
                      <View style={[styles.statusBadge, cls.status === 'confirmed' ? styles.confirmedBadge : styles.provisionalBadge]}>
                        <Text style={[styles.statusText, cls.status === 'confirmed' ? { color: COLORS.success } : { color: '#d97706' }]}>
                          {cls.status === 'confirmed' ? '확정' : '가편성'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.classInfo}>
                      <View style={styles.infoPill}><Text style={styles.infoPillText}>{cls.gradeRange}</Text></View>
                      <View style={styles.infoPill}><Text style={styles.infoPillText}>{cls.year}년</Text></View>
                    </View>

                    {/* Teachers */}
                    <View style={styles.section}>
                      <View style={styles.sectionTitleRow}>
                        <Text style={styles.sectionTitle}>교사 ({classTeachers.length}명)</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={() => { setTeacherPickerClassId(cls.id); setShowTeacherPicker(true); }}>
                          <Text style={styles.addBtnText}>+ 추가</Text>
                        </TouchableOpacity>
                      </View>
                      {classTeachers.map(t => (
                        <View key={t.id} style={styles.memberRow}>
                          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                          <Text style={styles.memberName}>{t.name}</Text>
                          <Text style={styles.memberRole}>{ROLE_LABELS[t.role]}</Text>
                          <TouchableOpacity onPress={() => Alert.alert('교사 제거', `${t.name}을(를) 제거하시겠습니까?`, [{ text: '취소', style: 'cancel' }, { text: '제거', style: 'destructive', onPress: () => onRemoveTeacherFromClass(cls.id, t.id) }])}>
                            <Text style={styles.removeText}>X</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>

                    <View style={styles.divider} />

                    {/* Students */}
                    <View style={styles.section}>
                      <View style={styles.sectionTitleRow}>
                        <Text style={styles.sectionTitle}>학생 ({activeStudents.length}명)</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={() => { setAddStudentClassId(cls.id); setShowAddStudent(true); }}>
                          <Text style={styles.addBtnText}>+ 추가</Text>
                        </TouchableOpacity>
                      </View>
                      {activeStudents.map(s => (
                        <View key={s.id} style={styles.memberRow}>
                          <View style={[styles.dot, { backgroundColor: COLORS.info }]} />
                          <Text style={styles.memberName}>{s.name}</Text>
                          <TouchableOpacity style={[styles.actionPill, { backgroundColor: 'rgba(14,165,233,0.15)' }]} onPress={() => handleMoveStudent(s)}>
                            <Text style={[styles.actionPillText, { color: COLORS.info }]}>이동</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.actionPill, { backgroundColor: 'rgba(239,68,68,0.12)' }]} onPress={() => handleToggleStudent(s)}>
                            <Text style={[styles.actionPillText, { color: COLORS.danger }]}>비활성</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      {inactiveStudents.length > 0 && (
                        <>
                          <Text style={styles.inactiveLabel}>비활성 ({inactiveStudents.length}명)</Text>
                          {inactiveStudents.map(s => (
                            <View key={s.id} style={[styles.memberRow, { opacity: 0.5 }]}>
                              <View style={[styles.dot, { backgroundColor: COLORS.textLight }]} />
                              <Text style={styles.memberName}>{s.name}</Text>
                              <TouchableOpacity style={[styles.actionPill, { backgroundColor: 'rgba(16,185,129,0.15)' }]} onPress={() => handleToggleStudent(s)}>
                                <Text style={[styles.actionPillText, { color: COLORS.success }]}>활성화</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </>
                      )}
                    </View>

                    {cls.status === 'provisional' && (
                      <TouchableOpacity style={[styles.confirmBtn, SHADOWS.glow]} onPress={() => handleConfirmClass(cls)}>
                        <Text style={styles.confirmBtnText}>반편성 확정</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </BlurView>
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.addClassBtn} onPress={() => setShowAddClass(true)}>
          <Text style={styles.addClassIcon}>+</Text>
          <Text style={styles.addClassText}>새 반 만들기</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Class Modal */}
      <Modal visible={showAddClass} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrap}>
            <BlurView intensity={90} tint="light" style={styles.modalBlur}>
              <View style={styles.modalInner}>
                <Text style={styles.modalTitle}>새 반 만들기</Text>
                <Text style={styles.modalLabel}>반 이름</Text>
                <TextInput style={styles.modalInput} placeholder="예: 초등 3-2반" placeholderTextColor={COLORS.textLight} value={newClassName} onChangeText={setNewClassName} />
                <Text style={styles.modalLabel}>학년 범위</Text>
                <TextInput style={styles.modalInput} placeholder="예: 초3-초4" placeholderTextColor={COLORS.textLight} value={newClassGrade} onChangeText={setNewClassGrade} />
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddClass(false)}><Text style={styles.modalCancelText}>취소</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalConfirmBtn, SHADOWS.glow]} onPress={handleAddClass}><Text style={styles.modalConfirmText}>만들기</Text></TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>

      {/* Add Student Modal */}
      <Modal visible={showAddStudent} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrap}>
            <BlurView intensity={90} tint="light" style={styles.modalBlur}>
              <View style={styles.modalInner}>
                <Text style={styles.modalTitle}>학생 추가</Text>
                <Text style={styles.modalLabel}>이름 *</Text>
                <TextInput style={styles.modalInput} placeholder="학생 이름" placeholderTextColor={COLORS.textLight} value={newStudentName} onChangeText={setNewStudentName} />
                <Text style={styles.modalLabel}>학년</Text>
                <TextInput style={styles.modalInput} placeholder="3" placeholderTextColor={COLORS.textLight} value={newStudentGrade} onChangeText={setNewStudentGrade} keyboardType="number-pad" />
                <Text style={styles.modalLabel}>학부모 이름</Text>
                <TextInput style={styles.modalInput} placeholder="선택" placeholderTextColor={COLORS.textLight} value={newStudentParent} onChangeText={setNewStudentParent} />
                <Text style={styles.modalLabel}>학부모 연락처</Text>
                <TextInput style={styles.modalInput} placeholder="010-0000-0000" placeholderTextColor={COLORS.textLight} value={newStudentPhone} onChangeText={setNewStudentPhone} keyboardType="phone-pad" />
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddStudent(false)}><Text style={styles.modalCancelText}>취소</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalConfirmBtn, SHADOWS.glow]} onPress={handleAddStudent}><Text style={styles.modalConfirmText}>추가</Text></TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>

      {/* Teacher Picker Modal */}
      <Modal visible={showTeacherPicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrap}>
            <BlurView intensity={90} tint="light" style={styles.modalBlur}>
              <View style={styles.modalInner}>
                <Text style={styles.modalTitle}>교사 추가</Text>
                <Text style={styles.modalSubtitle}>추가할 교사를 선택하세요</Text>
                {allTeachers.map(t => {
                  const cls = classes.find(c => c.id === teacherPickerClassId);
                  const alreadyIn = cls?.teacherIds.includes(t.id);
                  return (
                    <TouchableOpacity key={t.id} style={[styles.pickerRow, alreadyIn && { opacity: 0.4 }]} disabled={alreadyIn}
                      onPress={() => { onAddTeacherToClass(teacherPickerClassId, t.id); setShowTeacherPicker(false); Alert.alert('완료', `${t.name}이(가) 추가되었습니다.`); }}>
                      <View style={styles.pickerAvatar}><Text style={styles.pickerAvatarText}>{t.name[0]}</Text></View>
                      <View style={{ flex: 1 }}><Text style={styles.pickerName}>{t.name}</Text><Text style={styles.pickerRole}>{ROLE_LABELS[t.role]}</Text></View>
                      {alreadyIn && <View style={styles.addedBadge}><Text style={styles.addedText}>추가됨</Text></View>}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowTeacherPicker(false)}><Text style={styles.modalCancelText}>닫기</Text></TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  blob1: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: COLORS.blob1, top: -80, right: -100 },
  blob2: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: COLORS.blob2, bottom: 120, left: -80 },
  blob3: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.blob3, top: 350, right: -40 },

  headerWrap: { overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)' },
  headerBlur: {},
  headerOverlay: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  headerBadge: { backgroundColor: 'rgba(99,91,255,0.10)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: SIZES.radiusFull },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  // Glass card
  cardWrap: { borderRadius: SIZES.radiusLg, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  cardSelected: { borderColor: COLORS.primary, borderWidth: 2 },
  cardBlur: {},
  cardOverlay: { backgroundColor: 'rgba(255,255,255,0.15)', padding: 18 },

  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  classNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  classIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  classIconText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  className: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  confirmedBadge: { backgroundColor: 'rgba(16,185,129,0.12)' },
  provisionalBadge: { backgroundColor: 'rgba(245,158,11,0.12)' },
  statusText: { fontSize: 11, fontWeight: '700' },
  classInfo: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  infoPill: { backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  infoPillText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 12 },

  section: { marginBottom: 8 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  addBtn: { backgroundColor: 'rgba(99,91,255,0.10)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull },
  addBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  memberName: { fontSize: 14, color: COLORS.text, flex: 1, fontWeight: '500' },
  memberRole: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  removeText: { fontSize: 13, color: COLORS.danger, fontWeight: '700', paddingHorizontal: 8 },
  actionPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: SIZES.radiusFull },
  actionPillText: { fontSize: 10, fontWeight: '700' },
  inactiveLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textLight, marginTop: 8, marginBottom: 4 },
  confirmBtn: { backgroundColor: COLORS.success, borderRadius: SIZES.radiusMd, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

  addClassBtn: {
    borderWidth: 2, borderColor: 'rgba(99,91,255,0.3)', borderStyle: 'dashed',
    borderRadius: SIZES.radiusLg, paddingVertical: 24, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  addClassIcon: { fontSize: 22, color: COLORS.primary, fontWeight: '300' },
  addClassText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: COLORS.modalBg, justifyContent: 'center', padding: 24 },
  modalWrap: { borderRadius: SIZES.radiusXl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', ...SHADOWS.large },
  modalBlur: {},
  modalInner: { backgroundColor: 'rgba(255,255,255,0.18)', padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: SIZES.radiusMd, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: SIZES.radiusMd, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.2)' },
  modalCancelText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: SIZES.radiusMd, backgroundColor: COLORS.primary },
  modalConfirmText: { fontSize: 15, color: COLORS.white, fontWeight: '700' },

  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.2)', gap: 12 },
  pickerAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  pickerAvatarText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  pickerName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  pickerRole: { fontSize: 12, color: COLORS.textSecondary },
  addedBadge: { backgroundColor: 'rgba(16,185,129,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: SIZES.radiusFull },
  addedText: { fontSize: 11, color: COLORS.success, fontWeight: '700' },
});
