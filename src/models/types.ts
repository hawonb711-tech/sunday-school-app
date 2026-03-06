// ===== Attendance Status =====
export type AttendanceStatus =
  | 'untouched'    // Not yet checked
  | 'present'      // Present (blue)
  | 'late'         // Late (purple)
  | 'absent'       // Absent (red border, empty)
  | 'prenotified'  // Pre-notified absent (orange border, empty)
  | 'future';      // Future week (disabled)

export const ATTENDANCE_CYCLE: AttendanceStatus[] = [
  'untouched', 'present', 'late', 'absent', 'prenotified',
];

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  untouched: '미입력',
  present: '출석',
  late: '지각',
  absent: '결석',
  prenotified: '사전통지결석',
  future: '미래',
};

// ===== User Roles =====
export type UserRole = 'minister' | 'headTeacher' | 'teacher' | 'assistant' | 'substitute';

export const ROLE_LABELS: Record<UserRole, string> = {
  minister: '전도사',
  headTeacher: '부장선생님',
  teacher: '담임교사',
  assistant: '보조교사',
  substitute: '대체교사',
};

// ===== User =====
export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  phone?: string;
  role: UserRole;
  assignedClassIds: string[];
  createdAt: number;
}

// ===== Student =====
export interface Student {
  id: string;
  name: string;
  photoUrl?: string;
  birthDate?: string;
  grade: number;          // 1-12 (초1=1, 중1=7, 고1=10)
  parentName?: string;
  parentPhone?: string;
  parentPhone2?: string;
  address?: string;
  allergies?: string;
  specialNotes?: string;
  classId: string;
  enrollDate: string;     // YYYY-MM-DD
  withdrawDate?: string;  // YYYY-MM-DD
  isActive: boolean;
  createdAt: number;
}

// ===== Class (Ban) =====
export type ClassStatus = 'provisional' | 'confirmed';

export interface ClassGroup {
  id: string;
  name: string;           // e.g. "초등 3-1반"
  year: number;
  gradeRange: string;     // e.g. "초3-초4"
  status: ClassStatus;    // provisional or confirmed
  teacherIds: string[];   // active teacher IDs
  studentIds: string[];
  createdAt: number;
}

// ===== Teacher Assignment =====
export interface TeacherAssignment {
  id: string;
  classId: string;
  teacherId: string;
  role: 'teacher' | 'assistant' | 'substitute';
  startWeek: number;      // Week index (0-based)
  endWeek?: number;       // null = current
  isActive: boolean;
}

// ===== Attendance Record =====
export interface AttendanceRecord {
  id: string;
  classId: string;
  personId: string;       // teacher or student ID
  personType: 'teacher' | 'student';
  weekIndex: number;
  sundayDate: string;     // YYYY-MM-DD
  status: AttendanceStatus;
  checkedBy: string;      // User ID who checked
  updatedAt: number;
}

// ===== Memo Types =====
export type MemoType = 'general' | 'prayer' | 'special' | 'contact';
export type MemoScope = 'private' | 'restricted' | 'shared' | 'broadcast';

export const MEMO_TYPE_LABELS: Record<MemoType, string> = {
  general: '일반메모',
  prayer: '기도제목',
  special: '특이사항',
  contact: '연락사항',
};

export const MEMO_SCOPE_LABELS: Record<MemoScope, string> = {
  private: '개인 (나만 보기)',
  restricted: '담임-전도사',
  shared: '전체 공유',
  broadcast: '전도사 일괄',
};

export const MEMO_TYPE_ICONS: Record<MemoType, string> = {
  general: '📝',
  prayer: '🙏',
  special: '⚠️',
  contact: '📞',
};

export const MEMO_SCOPE_ICONS: Record<MemoScope, string> = {
  private: '🔒',
  restricted: '🔐',
  shared: '👥',
  broadcast: '📢',
};

// ===== Memo =====
export interface Memo {
  id: string;
  studentId: string;
  classId: string;
  weekIndex?: number;     // null = general (not week-specific)
  sundayDate?: string;
  type: MemoType;
  scope: MemoScope;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;

  // Edit tracking
  isEdited: boolean;
  originalContent?: string;
  lastEditorId?: string;
  lastEditorName?: string;
  editReason?: string;

  // Soft delete
  isDeleted: boolean;
  deletedBy?: string;
  deletedAt?: number;

  // Broadcast memo relation
  broadcastId?: string;
  isPersonalized: boolean;

  // Supplement memo
  parentMemoId?: string;
  isSupplement: boolean;

  // Read tracking per user
  readBy: Record<string, number>; // userId -> timestamp
}

// ===== Notification =====
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'attendance' | 'memo' | 'class' | 'system';
  isRead: boolean;
  data?: Record<string, string>;
  createdAt: number;
}

// ===== Sunday Utility =====
export interface SundayInfo {
  date: Date;
  dateStr: string;    // YYYY-MM-DD
  day: number;        // Day of month
  month: number;      // 0-11
  weekIndex: number;  // 0-based index in year
}
