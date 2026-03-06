import { db } from './firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type {
  User,
  Student,
  ClassGroup,
  AttendanceStatus,
  Memo,
  TeacherAssignment,
} from '../models/types';

// ===== Collection References =====
const usersCol = collection(db, 'users');
const studentsCol = collection(db, 'students');
const classesCol = collection(db, 'classes');
const attendanceCol = collection(db, 'attendance');
const memosCol = collection(db, 'memos');
const assignmentsCol = collection(db, 'assignments');

// ===== Users =====

export async function saveUser(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.id), user);
}

export async function getUsers(): Promise<User[]> {
  const snapshot = await getDocs(usersCol);
  return snapshot.docs.map((d) => d.data() as User);
}

export async function getUserById(id: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', id));
  return snap.exists() ? (snap.data() as User) : null;
}

// ===== Students =====

export async function saveStudent(student: Student): Promise<void> {
  await setDoc(doc(db, 'students', student.id), student);
}

export async function getStudents(): Promise<Student[]> {
  const snapshot = await getDocs(studentsCol);
  return snapshot.docs.map((d) => d.data() as Student);
}

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  const q = query(studentsCol, where('classId', '==', classId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Student);
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  await updateDoc(doc(db, 'students', id), data);
}

// ===== Classes =====

export async function saveClass(classGroup: ClassGroup): Promise<void> {
  await setDoc(doc(db, 'classes', classGroup.id), classGroup);
}

export async function getClasses(): Promise<ClassGroup[]> {
  const snapshot = await getDocs(classesCol);
  return snapshot.docs.map((d) => d.data() as ClassGroup);
}

export async function updateClass(id: string, data: Partial<ClassGroup>): Promise<void> {
  await updateDoc(doc(db, 'classes', id), data);
}

// ===== Attendance =====

export async function saveAttendance(
  personId: string,
  weekIndex: number,
  year: number,
  status: AttendanceStatus,
  checkedBy: string,
): Promise<void> {
  const docId = `${personId}_${weekIndex}_${year}`;
  await setDoc(doc(db, 'attendance', docId), {
    personId,
    weekIndex,
    year,
    status,
    checkedBy,
    updatedAt: serverTimestamp(),
  });
}

export async function getAttendanceByYear(
  year: number,
): Promise<Map<string, Map<number, AttendanceStatus>>> {
  const q = query(attendanceCol, where('year', '==', year));
  const snapshot = await getDocs(q);

  const result = new Map<string, Map<number, AttendanceStatus>>();
  snapshot.docs.forEach((d) => {
    const data = d.data();
    const personId = data.personId as string;
    const weekIndex = data.weekIndex as number;
    const status = data.status as AttendanceStatus;

    if (!result.has(personId)) {
      result.set(personId, new Map());
    }
    result.get(personId)!.set(weekIndex, status);
  });

  return result;
}

// ===== Memos =====

export async function saveMemo(memo: Memo): Promise<void> {
  await setDoc(doc(db, 'memos', memo.id), memo);
}

export async function getMemos(): Promise<Memo[]> {
  const snapshot = await getDocs(memosCol);
  return snapshot.docs.map((d) => d.data() as Memo);
}

export async function updateMemo(id: string, data: Partial<Memo>): Promise<void> {
  await updateDoc(doc(db, 'memos', id), data);
}

// ===== Realtime Listeners =====

export function listenToAttendance(
  year: number,
  callback: (data: Map<string, Map<number, AttendanceStatus>>) => void,
): () => void {
  const q = query(attendanceCol, where('year', '==', year));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const result = new Map<string, Map<number, AttendanceStatus>>();
    snapshot.docs.forEach((d) => {
      const data = d.data();
      const personId = data.personId as string;
      const weekIndex = data.weekIndex as number;
      const status = data.status as AttendanceStatus;

      if (!result.has(personId)) {
        result.set(personId, new Map());
      }
      result.get(personId)!.set(weekIndex, status);
    });
    callback(result);
  });

  return unsubscribe;
}

export function listenToMemos(
  callback: (memos: Memo[]) => void,
): () => void {
  const unsubscribe = onSnapshot(memosCol, (snapshot) => {
    const memos = snapshot.docs.map((d) => d.data() as Memo);
    callback(memos);
  });

  return unsubscribe;
}
