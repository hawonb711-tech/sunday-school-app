import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import {
  SundayInfo, Memo, MemoType, MemoScope, AttendanceStatus,
  MEMO_TYPE_LABELS, MEMO_SCOPE_LABELS, MEMO_TYPE_ICONS, MEMO_SCOPE_ICONS,
  ATTENDANCE_LABELS,
} from '../models/types';
import AttendanceCircle from '../components/AttendanceCircle';

interface Props {
  personId: string;
  personName: string;
  sundays: SundayInfo[];
  currentWeekIndex: number;
  initialWeekIndex?: number;
  getAttendance: (personId: string, weekIndex: number) => AttendanceStatus;
  getMemos: (personId: string, weekIndex?: number) => Memo[];
  onAddMemo: (memo: any) => void;
  onEditMemo?: (memoId: string, newContent: string, reason?: string) => void;
  onDeleteMemo?: (memoId: string) => void;
  onBack: () => void;
  currentUserId: string;
  currentUserName: string;
}

export default function MemoTimelineScreen({
  personId, personName, sundays, currentWeekIndex, initialWeekIndex,
  getAttendance, getMemos, onAddMemo, onEditMemo, onDeleteMemo, onBack,
  currentUserId, currentUserName,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addWeekIndex, setAddWeekIndex] = useState(0);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editReason, setEditReason] = useState('');

  const targetWeek = initialWeekIndex ?? currentWeekIndex;

  // Memo add modal state
  const [memoType, setMemoType] = useState<MemoType>('general');
  const [memoScope, setMemoScope] = useState<MemoScope>('shared');
  const [memoContent, setMemoContent] = useState('');

  const handleAddMemo = () => {
    if (!memoContent.trim()) {
      Alert.alert('알림', '메모 내용을 입력해주세요.');
      return;
    }
    onAddMemo({
      studentId: personId,
      classId: 'c1',
      weekIndex: addWeekIndex,
      sundayDate: sundays[addWeekIndex]?.dateStr,
      type: memoType,
      scope: memoScope,
      content: memoContent.trim(),
      authorId: currentUserId,
      authorName: currentUserName,
    });
    setMemoContent('');
    setShowAddModal(false);
    Alert.alert('완료', '메모가 추가되었습니다.');
  };

  const handleEditMemo = () => {
    if (!editContent.trim() || !editingMemo) return;
    onEditMemo?.(editingMemo.id, editContent.trim(), editReason.trim() || undefined);
    setShowEditModal(false);
    setEditingMemo(null);
    setEditContent('');
    setEditReason('');
    Alert.alert('완료', '메모가 수정되었습니다.');
  };

  const handleDeleteMemo = (memo: Memo) => {
    Alert.alert(
      '메모 삭제',
      '이 메모를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: () => onDeleteMemo?.(memo.id),
        },
      ]
    );
  };

  const openEditModal = (memo: Memo) => {
    setEditingMemo(memo);
    setEditContent(memo.content);
    setEditReason('');
    setShowEditModal(true);
  };

  const canEditMemo = (memo: Memo) => {
    // Author can edit within 2 weeks
    const weekDiff = currentWeekIndex - (memo.weekIndex || 0);
    return memo.authorId === currentUserId && weekDiff <= 2;
  };

  return (
    <View style={styles.container}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      {/* Glass Header */}
      <View style={styles.headerWrap}>
        <BlurView intensity={50} tint="light">
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>{'<'}</Text>
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{personName}</Text>
              <Text style={styles.headerSub}>메모 타임라인</Text>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Timeline */}
      <ScrollView
        ref={scrollRef}
        style={styles.timeline}
        showsVerticalScrollIndicator={false}
        decelerationRate={0.8}
      >
        {sundays.map((s, si) => {
          if (si > currentWeekIndex + 1) return null;
          const status = getAttendance(personId, si);
          const weekMemos = getMemos(personId, si);
          const isCurrent = si === currentWeekIndex;
          const isTarget = si === targetWeek;

          return (
            <View key={si}>
              {/* Week header */}
              <View style={[styles.weekHeader, isCurrent && styles.weekHeaderCurrent, isTarget && styles.weekHeaderTarget]}>
                <Text style={styles.weekHeaderText}>
                  {s.month + 1}월 {s.day}일 ({si + 1}주차)
                  {isCurrent ? ' - 이번 주' : ''}
                </Text>
                <View style={styles.weekAttendance}>
                  <AttendanceCircle status={status} size="small" />
                  <Text style={styles.weekStatusText}>{ATTENDANCE_LABELS[status]}</Text>
                </View>
              </View>

              {/* Memos for this week */}
              <View style={styles.weekContent}>
                {weekMemos.length === 0 ? (
                  <Text style={styles.noMemo}>메모 없음</Text>
                ) : (
                  weekMemos.map(memo => (
                    <View key={memo.id} style={styles.memoCard}>
                      <View style={styles.memoHeader}>
                        <Text style={styles.memoType}>
                          {MEMO_TYPE_ICONS[memo.type]} {MEMO_TYPE_LABELS[memo.type]}
                        </Text>
                        <Text style={styles.memoScope}>
                          {MEMO_SCOPE_ICONS[memo.scope]} {MEMO_SCOPE_LABELS[memo.scope]}
                        </Text>
                      </View>
                      <Text style={styles.memoContent}>{memo.content}</Text>
                      {memo.isEdited && (
                        <Text style={styles.editedTag}>
                          수정됨 {memo.editReason ? `(${memo.editReason})` : ''}
                        </Text>
                      )}
                      <View style={styles.memoFooter}>
                        <Text style={styles.memoAuthor}>
                          작성: {memo.authorName}
                        </Text>
                        <Text style={styles.memoDate}>
                          {new Date(memo.createdAt).toLocaleDateString('ko-KR')}
                        </Text>
                      </View>
                      {/* Edit/Delete actions */}
                      {canEditMemo(memo) && (
                        <View style={styles.memoActions}>
                          <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => openEditModal(memo)}
                          >
                            <Text style={styles.editBtnText}>수정</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteMemo(memo)}
                          >
                            <Text style={styles.deleteBtnText}>삭제</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))
                )}

                {/* Add memo button */}
                {si <= currentWeekIndex && (
                  <TouchableOpacity
                    style={styles.addMemoBtn}
                    onPress={() => { setAddWeekIndex(si); setShowAddModal(true); }}
                  >
                    <Text style={styles.addMemoBtnText}>+ 메모 추가</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Memo Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrap}>
          <BlurView intensity={90} tint="light">
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {addWeekIndex + 1}주차 메모 작성
              </Text>
              <TouchableOpacity onPress={handleAddMemo} style={styles.modalDoneBtn}>
                <Text style={styles.modalDoneText}>완료</Text>
              </TouchableOpacity>
            </View>

            {/* Memo type */}
            <Text style={styles.modalLabel}>메모 타입</Text>
            <View style={styles.typeRow}>
              {(['general', 'prayer', 'special', 'contact'] as MemoType[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, memoType === t && styles.typeBtnActive]}
                  onPress={() => setMemoType(t)}
                >
                  <Text style={[styles.typeBtnText, memoType === t && styles.typeBtnTextActive]}>
                    {MEMO_TYPE_ICONS[t]} {MEMO_TYPE_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Content */}
            <Text style={styles.modalLabel}>내용</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              value={memoContent}
              onChangeText={setMemoContent}
              placeholder="메모 내용을 입력하세요..."
              placeholderTextColor={COLORS.textLight}
            />

            {/* Scope */}
            <Text style={styles.modalLabel}>공유 범위</Text>
            <View style={styles.scopeRow}>
              {(['private', 'restricted', 'shared'] as MemoScope[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.scopeBtn, memoScope === s && styles.scopeBtnActive]}
                  onPress={() => setMemoScope(s)}
                >
                  <Text style={[styles.scopeBtnText, memoScope === s && styles.scopeBtnTextActive]}>
                    {MEMO_SCOPE_ICONS[s]} {MEMO_SCOPE_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
          </View>
          </BlurView>
          </View>
        </View>
      </Modal>

      {/* Edit Memo Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrap}>
          <BlurView intensity={90} tint="light">
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>메모 수정</Text>

            <Text style={styles.modalLabel}>내용</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              value={editContent}
              onChangeText={setEditContent}
              placeholder="수정할 내용..."
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.modalLabel}>수정 사유 (선택)</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 50 }]}
              value={editReason}
              onChangeText={setEditReason}
              placeholder="수정 사유를 입력하세요..."
              placeholderTextColor={COLORS.textLight}
            />

            <View style={styles.editModalBtns}>
              <TouchableOpacity
                style={styles.editModalCancel}
                onPress={() => { setShowEditModal(false); setEditingMemo(null); }}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editModalSave} onPress={handleEditMemo}>
                <Text style={styles.modalDoneText}>저장</Text>
              </TouchableOpacity>
            </View>
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
  blob1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: COLORS.blob1, top: -50, right: -80 },
  blob2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.blob3, bottom: 120, left: -60 },
  headerWrap: { overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)' },
  headerOverlay: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: COLORS.text, fontWeight: '600', fontSize: 18 },
  headerInfo: { marginLeft: 14 },
  headerName: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.textSecondary },

  timeline: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },

  weekHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    marginTop: 12, borderLeftWidth: 4, borderLeftColor: COLORS.primaryLight,
    ...SHADOWS.small,
  },
  weekHeaderCurrent: {
    backgroundColor: COLORS.primaryVeryLight,
    borderLeftColor: COLORS.primary,
  },
  weekHeaderTarget: {
    borderLeftWidth: 6,
    borderLeftColor: COLORS.primary,
  },
  weekHeaderText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  weekAttendance: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekStatusText: { fontSize: 13, color: COLORS.textSecondary },

  weekContent: { paddingLeft: 16, paddingVertical: 8 },
  noMemo: { fontSize: 14, color: COLORS.textLight, fontStyle: 'italic', paddingVertical: 4 },

  memoCard: {
    backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    padding: 14, marginBottom: 8,
    borderLeftWidth: 4, borderLeftColor: COLORS.primaryLight,
    ...SHADOWS.small,
  },
  memoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  memoType: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  memoScope: { fontSize: 12, color: COLORS.textSecondary },
  memoContent: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  editedTag: { fontSize: 11, color: COLORS.warning, marginTop: 4, fontStyle: 'italic' },
  memoFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderColor: '#f3f4f6',
  },
  memoAuthor: { fontSize: 12, color: COLORS.textLight },
  memoDate: { fontSize: 12, color: COLORS.textLight },

  memoActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editBtn: {
    backgroundColor: COLORS.primaryVeryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  editBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
  },
  deleteBtnText: { fontSize: 13, color: COLORS.danger, fontWeight: '600' },

  addMemoBtn: {
    paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primaryLight, borderStyle: 'dashed',
    borderRadius: SIZES.radiusSm, marginTop: 4,
  },
  addMemoBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: COLORS.modalBg,
    justifyContent: 'flex-end',
  },
  modalWrap: {
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    overflow: 'hidden', maxHeight: '80%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
  },
  modalContent: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalDoneBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: SIZES.radiusSm,
  },
  modalDoneText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginTop: 12 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: SIZES.radiusSm, borderWidth: 1.5, borderColor: COLORS.border,
  },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryVeryLight },
  typeBtnText: { fontSize: 13, color: COLORS.text },
  typeBtnTextActive: { color: COLORS.primary, fontWeight: '600' },
  modalInput: {
    backgroundColor: '#f3f4f6', borderRadius: SIZES.radiusSm,
    padding: 12, fontSize: 15, color: COLORS.text,
    minHeight: 100, textAlignVertical: 'top',
  },
  scopeRow: { gap: 8 },
  scopeBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: SIZES.radiusSm, borderWidth: 1.5, borderColor: COLORS.border,
  },
  scopeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryVeryLight },
  scopeBtnText: { fontSize: 14, color: COLORS.text },
  scopeBtnTextActive: { color: COLORS.primary, fontWeight: '600' },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 12 },
  modalCancelText: { color: COLORS.textSecondary, fontSize: 16 },

  editModalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  editModalCancel: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.border,
  },
  editModalSave: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderRadius: SIZES.radiusSm, backgroundColor: COLORS.primary,
  },
});
