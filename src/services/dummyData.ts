import {
  User, Student, ClassGroup, AttendanceRecord, Memo,
  TeacherAssignment, AttendanceStatus, MemoType, MemoScope,
} from '../models/types';
import { getSundays, getCurrentWeekIndex } from '../utils/dateUtils';

const YEAR = new Date().getFullYear();
const sundays = getSundays(YEAR);
const currentWeekIdx = getCurrentWeekIndex(sundays);

// ===== Users (Teachers & Minister) =====
export const dummyUsers: User[] = [
  { id: 'u1', email: 'minister@church.com', name: '박전도사', role: 'minister', assignedClassIds: ['c1','c2'], phone: '010-0000-0001', createdAt: Date.now() },
  { id: 'u2', email: 'kim@church.com', name: '김선생님', role: 'teacher', assignedClassIds: ['c1'], phone: '010-0000-0002', createdAt: Date.now() },
  { id: 'u3', email: 'lee@church.com', name: '이선생님', role: 'assistant', assignedClassIds: ['c1'], phone: '010-0000-0003', createdAt: Date.now() },
  { id: 'u4', email: 'park@church.com', name: '박선생님', role: 'teacher', assignedClassIds: ['c2'], phone: '010-0000-0004', createdAt: Date.now() },
];

// ===== Students =====
const studentNames = [
  '홍길동','김영희','박철수','이민지','정수현',
  '최유진','강지호','윤서아','조현우','한소희',
];

export const dummyStudents: Student[] = studentNames.map((name, i) => ({
  id: `s${i + 1}`,
  name,
  grade: 3,
  classId: 'c1',
  parentName: `${name} 어머니`,
  parentPhone: `010-1234-${String(i + 1).padStart(4, '0')}`,
  enrollDate: `${YEAR}-01-01`,
  isActive: true,
  createdAt: Date.now(),
}));

// ===== Classes =====
export const dummyClasses: ClassGroup[] = [
  { id: 'c1', name: '초등 3-1반', year: YEAR, gradeRange: '초3', status: 'confirmed', teacherIds: ['u2', 'u3'], studentIds: dummyStudents.map(s => s.id), createdAt: Date.now() },
  { id: 'c2', name: '초등 4-1반', year: YEAR, gradeRange: '초4', status: 'confirmed', teacherIds: ['u4'], studentIds: [], createdAt: Date.now() },
];

// ===== Teacher Assignments =====
export const dummyAssignments: TeacherAssignment[] = [
  { id: 'ta1', classId: 'c1', teacherId: 'u2', role: 'teacher', startWeek: 0, isActive: true },
  { id: 'ta2', classId: 'c1', teacherId: 'u3', role: 'assistant', startWeek: 0, isActive: true },
];

// ===== Attendance Data =====
function randomStatus(weekIdx: number): AttendanceStatus {
  if (weekIdx > currentWeekIdx) return 'future';
  if (weekIdx === currentWeekIdx) {
    const r = Math.random();
    return r < 0.3 ? 'untouched' : r < 0.7 ? 'present' : r < 0.8 ? 'late' : r < 0.9 ? 'absent' : 'prenotified';
  }
  const r = Math.random();
  return r < 0.05 ? 'untouched' : r < 0.65 ? 'present' : r < 0.75 ? 'late' : r < 0.88 ? 'absent' : 'prenotified';
}

export function generateAttendance(): Map<string, Map<number, AttendanceStatus>> {
  const data = new Map<string, Map<number, AttendanceStatus>>();

  // Teachers
  ['u2', 'u3'].forEach(id => {
    const weekMap = new Map<number, AttendanceStatus>();
    sundays.forEach((s, i) => weekMap.set(i, randomStatus(i)));
    data.set(id, weekMap);
  });

  // Students
  dummyStudents.forEach(st => {
    const weekMap = new Map<number, AttendanceStatus>();
    sundays.forEach((s, i) => weekMap.set(i, randomStatus(i)));
    data.set(st.id, weekMap);
  });

  return data;
}

// ===== Memo Data =====
export function generateMemoFlags(): Map<string, Map<number, boolean[]>> {
  const data = new Map<string, Map<number, boolean[]>>();
  const allIds = ['u2', 'u3', ...dummyStudents.map(s => s.id)];
  allIds.forEach(id => {
    const weekMap = new Map<number, boolean[]>();
    sundays.forEach((_, i) => {
      weekMap.set(i, [Math.random() < 0.2, Math.random() < 0.2, Math.random() < 0.2]);
    });
    data.set(id, weekMap);
  });
  return data;
}

// ===== Sample Memos =====
export const dummyMemos: Memo[] = [
  {
    id: 'm1', studentId: 's1', classId: 'c1', weekIndex: Math.max(0, currentWeekIdx - 1),
    sundayDate: sundays[Math.max(0, currentWeekIdx - 1)]?.dateStr,
    type: 'general', scope: 'shared',
    content: '오늘 성경 암송을 완벽하게 외웠습니다.',
    authorId: 'u2', authorName: '김선생님',
    createdAt: Date.now() - 86400000, updatedAt: Date.now() - 86400000,
    isEdited: false, isDeleted: false, isPersonalized: false, isSupplement: false, readBy: {},
  },
  {
    id: 'm2', studentId: 's1', classId: 'c1', weekIndex: Math.max(0, currentWeekIdx - 1),
    sundayDate: sundays[Math.max(0, currentWeekIdx - 1)]?.dateStr,
    type: 'prayer', scope: 'restricted',
    content: '아버지 건강 회복을 위해 기도해 주세요.',
    authorId: 'u2', authorName: '김선생님',
    createdAt: Date.now() - 86400000 + 1000, updatedAt: Date.now() - 86400000 + 1000,
    isEdited: false, isDeleted: false, isPersonalized: false, isSupplement: false, readBy: {},
  },
  {
    id: 'm3', studentId: 's3', classId: 'c1', weekIndex: Math.max(0, currentWeekIdx - 2),
    sundayDate: sundays[Math.max(0, currentWeekIdx - 2)]?.dateStr,
    type: 'special', scope: 'shared',
    content: '견과류 알레르기가 있습니다. 간식 시간에 주의해 주세요.',
    authorId: 'u2', authorName: '김선생님',
    createdAt: Date.now() - 172800000, updatedAt: Date.now() - 172800000,
    isEdited: false, isDeleted: false, isPersonalized: false, isSupplement: false, readBy: {},
  },
  {
    id: 'm4', studentId: 's5', classId: 'c1', weekIndex: currentWeekIdx,
    sundayDate: sundays[currentWeekIdx]?.dateStr,
    type: 'contact', scope: 'broadcast',
    content: '다음 주 수련회 참석 확인이 필요합니다. 회비 2만원.',
    authorId: 'u1', authorName: '박전도사', broadcastId: 'bc1',
    createdAt: Date.now() - 3600000, updatedAt: Date.now() - 3600000,
    isEdited: false, isDeleted: false, isPersonalized: false, isSupplement: false, readBy: {},
  },
];
