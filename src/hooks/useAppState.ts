import { useState, useEffect, useCallback, useRef } from 'react';
import {
  User, Student, ClassGroup, AttendanceStatus, Memo,
  TeacherAssignment, ATTENDANCE_CYCLE,
} from '../models/types';
import { SundayInfo } from '../models/types';
import { getSundays, getCurrentWeekIndex } from '../utils/dateUtils';
import {
  saveUser, getUsers,
  saveStudent, getStudents, updateStudent,
  saveClass, getClasses, updateClass,
  saveAttendance, getAttendanceByYear,
  saveMemo, getMemos, updateMemo,
  listenToAttendance, listenToMemos,
} from '../services/firestoreService';
import { signInWithEmail, signUpWithEmail, signOut as firebaseSignOut } from '../services/authService';
import {
  dummyUsers, dummyStudents, dummyClasses, dummyAssignments, dummyMemos,
} from '../services/dummyData';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const YEAR = new Date().getFullYear();

export function useAppState() {
  const [currentUser, setCurrentUser] = useState<User>(dummyUsers[1]);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [assignments] = useState<TeacherAssignment[]>(dummyAssignments);
  const [memos, setMemos] = useState<Memo[]>([]);

  const [sundays] = useState<SundayInfo[]>(() => getSundays(YEAR));
  const [currentWeekIndex] = useState(() => getCurrentWeekIndex(getSundays(YEAR)));

  const [attendance, setAttendance] = useState<Map<string, Map<number, AttendanceStatus>>>(new Map());

  const [selectedClassId, setSelectedClassId] = useState('c1');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teachersExpanded, setTeachersExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseReady, setFirebaseReady] = useState(false);

  const unsubAttRef = useRef<(() => void) | null>(null);
  const unsubMemoRef = useRef<(() => void) | null>(null);

  // ===== Firebase data seed (first time only) =====
  const seedDataIfNeeded = useCallback(async () => {
    try {
      // Check if users collection exists
      const existingUsers = await getUsers();
      if (existingUsers.length > 0) {
        return; // Data already exists
      }

      console.log('Seeding initial data to Firestore...');
      // Seed users
      for (const u of dummyUsers) {
        await saveUser(u);
      }
      // Seed students
      for (const s of dummyStudents) {
        await saveStudent(s);
      }
      // Seed classes
      for (const c of dummyClasses) {
        await saveClass(c);
      }
      // Seed memos
      for (const m of dummyMemos) {
        await saveMemo(m);
      }
      console.log('Initial data seeded successfully!');
    } catch (e) {
      console.error('Error seeding data:', e);
    }
  }, []);

  // ===== Load all data from Firestore =====
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [loadedUsers, loadedStudents, loadedClasses, loadedAttendance, loadedMemos] = await Promise.all([
        getUsers(),
        getStudents(),
        getClasses(),
        getAttendanceByYear(YEAR),
        getMemos(),
      ]);

      setUsers(loadedUsers.length > 0 ? loadedUsers : dummyUsers);
      setStudents(loadedStudents.length > 0 ? loadedStudents : dummyStudents);
      setClasses(loadedClasses.length > 0 ? loadedClasses : dummyClasses);
      setAttendance(loadedAttendance);
      setMemos(loadedMemos);

      // Set current user from loaded users
      if (loadedUsers.length > 0) {
        setCurrentUser(loadedUsers[1] || loadedUsers[0]);
      }

      setFirebaseReady(true);
    } catch (e) {
      console.error('Error loading data:', e);
      // Fallback to dummy data
      setUsers(dummyUsers);
      setStudents(dummyStudents);
      setClasses(dummyClasses);
      setMemos(dummyMemos);
      setCurrentUser(dummyUsers[1]);
      setFirebaseReady(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== Start realtime listeners =====
  const startListeners = useCallback(() => {
    // Attendance realtime listener
    unsubAttRef.current = listenToAttendance(YEAR, (newAttendance) => {
      setAttendance(newAttendance);
    });

    // Memos realtime listener
    unsubMemoRef.current = listenToMemos((newMemos) => {
      setMemos(newMemos);
    });
  }, []);

  // ===== Initialize on login =====
  useEffect(() => {
    if (!isLoggedIn) return;

    const init = async () => {
      await seedDataIfNeeded();
      await loadAllData();
      startListeners();
    };
    init();

    return () => {
      unsubAttRef.current?.();
      unsubMemoRef.current?.();
    };
  }, [isLoggedIn, seedDataIfNeeded, loadAllData, startListeners]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classTeachers = users.filter(u => selectedClass?.teacherIds.includes(u.id));
  const classStudents = students.filter(s => s.classId === selectedClassId && s.isActive);

  // ===== Memo Flags (computed from memos) =====
  const getMemoFlags = useCallback((personId: string, weekIndex: number): boolean[] => {
    const weekMemos = memos.filter(m => m.studentId === personId && m.weekIndex === weekIndex && !m.isDeleted);
    const hasGeneral = weekMemos.some(m => m.type === 'general' || m.type === 'contact');
    const hasPrayer = weekMemos.some(m => m.type === 'prayer');
    const hasSpecial = weekMemos.some(m => m.type === 'special');
    return [hasGeneral, hasPrayer, hasSpecial];
  }, [memos]);

  // ===== Attendance =====
  const cycleAttendance = useCallback(async (personId: string, weekIndex: number) => {
    if (weekIndex > currentWeekIndex) return;

    const current = attendance.get(personId)?.get(weekIndex) || 'untouched';
    const idx = ATTENDANCE_CYCLE.indexOf(current as any);
    const next = ATTENDANCE_CYCLE[(idx + 1) % ATTENDANCE_CYCLE.length];

    // Optimistic update
    setAttendance(prev => {
      const newMap = new Map(prev);
      const personMap = new Map(newMap.get(personId) || new Map());
      personMap.set(weekIndex, next);
      newMap.set(personId, personMap);
      return newMap;
    });

    // Save to Firestore
    try {
      await saveAttendance(personId, weekIndex, YEAR, next, currentUser.id);
    } catch (e) {
      console.error('Error saving attendance:', e);
    }
  }, [currentWeekIndex, attendance, currentUser.id]);

  const getAttendance = useCallback((personId: string, weekIndex: number): AttendanceStatus => {
    return attendance.get(personId)?.get(weekIndex) || 'untouched';
  }, [attendance]);

  // ===== Memos =====
  const getMemosForStudent = useCallback((studentId: string, weekIndex?: number): Memo[] => {
    return memos.filter(m => {
      if (m.studentId !== studentId || m.isDeleted) return false;
      if (weekIndex !== undefined && m.weekIndex !== weekIndex) return false;
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [memos]);

  const addMemo = useCallback(async (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt' | 'isEdited' | 'isDeleted' | 'isPersonalized' | 'isSupplement' | 'readBy'>) => {
    const newMemo: Memo = {
      ...memo,
      id: `m_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isEdited: false,
      isDeleted: false,
      isPersonalized: false,
      isSupplement: false,
      readBy: { [currentUser.id]: Date.now() },
    };

    // Optimistic update
    setMemos(prev => [newMemo, ...prev]);

    // Save to Firestore
    try {
      await saveMemo(newMemo);
    } catch (e) {
      console.error('Error saving memo:', e);
    }
  }, [currentUser.id]);

  const editMemo = useCallback(async (memoId: string, newContent: string, reason?: string) => {
    const memo = memos.find(m => m.id === memoId);
    if (!memo) return;

    const updated = {
      originalContent: memo.isEdited ? memo.originalContent : memo.content,
      content: newContent,
      isEdited: true,
      lastEditorId: currentUser.id,
      lastEditorName: currentUser.name,
      editReason: reason,
      updatedAt: Date.now(),
    };

    // Optimistic update
    setMemos(prev => prev.map(m => m.id !== memoId ? m : { ...m, ...updated }));

    // Save to Firestore
    try {
      await updateMemo(memoId, updated);
    } catch (e) {
      console.error('Error updating memo:', e);
    }
  }, [currentUser.id, currentUser.name, memos]);

  const deleteMemo = useCallback(async (memoId: string) => {
    const deleteData = {
      isDeleted: true,
      deletedBy: currentUser.id,
      deletedAt: Date.now(),
    };

    // Optimistic update
    setMemos(prev => prev.map(m => m.id !== memoId ? m : { ...m, ...deleteData }));

    // Save to Firestore
    try {
      await updateMemo(memoId, deleteData);
    } catch (e) {
      console.error('Error deleting memo:', e);
    }
  }, [currentUser.id]);

  // ===== Stats =====
  const getStudentStats = useCallback((studentId: string) => {
    const personAtt = attendance.get(studentId);
    if (!personAtt) return { total: 0, present: 0, late: 0, absent: 0, prenotified: 0, rate: 0 };

    let total = 0, present = 0, late = 0, absent = 0, prenotified = 0;
    for (let i = 0; i <= currentWeekIndex; i++) {
      const s = personAtt.get(i);
      if (s && s !== 'future') {
        total++;
        if (s === 'present') present++;
        else if (s === 'late') late++;
        else if (s === 'absent') absent++;
        else if (s === 'prenotified') prenotified++;
      }
    }
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, late, absent, prenotified, rate };
  }, [attendance, currentWeekIndex]);

  // ===== User Management =====
  const switchUser = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  }, [users]);

  // ===== Class Management =====
  const addClass = useCallback(async (name: string, gradeRange: string) => {
    const newClass: ClassGroup = {
      id: `c_${Date.now()}`,
      name,
      year: YEAR,
      gradeRange,
      status: 'provisional',
      teacherIds: [],
      studentIds: [],
      createdAt: Date.now(),
    };

    // Optimistic update
    setClasses(prev => [...prev, newClass]);

    // Save to Firestore
    try {
      await saveClass(newClass);
    } catch (e) {
      console.error('Error saving class:', e);
    }
    return newClass.id;
  }, []);

  const confirmClass = useCallback(async (classId: string) => {
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, status: 'confirmed' as const } : c
    ));
    try {
      await updateClass(classId, { status: 'confirmed' });
    } catch (e) {
      console.error('Error confirming class:', e);
    }
  }, []);

  const updateClassName = useCallback(async (classId: string, name: string) => {
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, name } : c
    ));
    try {
      await updateClass(classId, { name });
    } catch (e) {
      console.error('Error updating class name:', e);
    }
  }, []);

  const addTeacherToClass = useCallback(async (classId: string, teacherId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls || cls.teacherIds.includes(teacherId)) return;

    const newTeacherIds = [...cls.teacherIds, teacherId];
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, teacherIds: newTeacherIds } : c
    ));
    try {
      await updateClass(classId, { teacherIds: newTeacherIds });
    } catch (e) {
      console.error('Error adding teacher:', e);
    }
  }, [classes]);

  const removeTeacherFromClass = useCallback(async (classId: string, teacherId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;

    const newTeacherIds = cls.teacherIds.filter(id => id !== teacherId);
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, teacherIds: newTeacherIds } : c
    ));
    try {
      await updateClass(classId, { teacherIds: newTeacherIds });
    } catch (e) {
      console.error('Error removing teacher:', e);
    }
  }, [classes]);

  // ===== Student Management =====
  const addStudent = useCallback(async (name: string, classId: string, grade: number, parentName?: string, parentPhone?: string) => {
    const newStudent: Student = {
      id: `s_${Date.now()}`,
      name,
      grade,
      classId,
      parentName,
      parentPhone,
      enrollDate: new Date().toISOString().split('T')[0],
      isActive: true,
      createdAt: Date.now(),
    };

    // Optimistic update
    setStudents(prev => [...prev, newStudent]);
    setClasses(prev => prev.map(c =>
      c.id === classId ? { ...c, studentIds: [...c.studentIds, newStudent.id] } : c
    ));

    // Save to Firestore
    try {
      await saveStudent(newStudent);
      const cls = classes.find(c => c.id === classId);
      if (cls) {
        await updateClass(classId, { studentIds: [...cls.studentIds, newStudent.id] });
      }
    } catch (e) {
      console.error('Error saving student:', e);
    }
    return newStudent.id;
  }, [classes]);

  const updateStudentInfo = useCallback(async (studentId: string, data: Partial<Student>) => {
    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, ...data } : s
    ));
    try {
      await updateStudent(studentId, data);
    } catch (e) {
      console.error('Error updating student:', e);
    }
  }, []);

  const toggleStudentActive = useCallback(async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const now = new Date().toISOString().split('T')[0];
    const updatedData = {
      isActive: !student.isActive,
      withdrawDate: !student.isActive ? undefined : now,
    };

    setStudents(prev => prev.map(s =>
      s.id !== studentId ? s : { ...s, ...updatedData }
    ));
    try {
      await updateStudent(studentId, updatedData);
    } catch (e) {
      console.error('Error toggling student:', e);
    }
  }, [students]);

  const moveStudentToClass = useCallback(async (studentId: string, newClassId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const oldClassId = student.classId;

    // Optimistic update
    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, classId: newClassId } : s
    ));
    setClasses(prev => prev.map(c => {
      if (c.id === oldClassId) {
        return { ...c, studentIds: c.studentIds.filter(id => id !== studentId) };
      }
      if (c.id === newClassId) {
        return { ...c, studentIds: [...c.studentIds, studentId] };
      }
      return c;
    }));

    // Save to Firestore
    try {
      await updateStudent(studentId, { classId: newClassId });
      const oldCls = classes.find(c => c.id === oldClassId);
      const newCls = classes.find(c => c.id === newClassId);
      if (oldCls) {
        await updateClass(oldClassId, { studentIds: oldCls.studentIds.filter(id => id !== studentId) });
      }
      if (newCls) {
        await updateClass(newClassId, { studentIds: [...newCls.studentIds, studentId] });
      }
    } catch (e) {
      console.error('Error moving student:', e);
    }
  }, [students, classes]);

  // ===== Bulk Attendance =====
  const markAllPresent = useCallback(async (weekIndex: number) => {
    if (weekIndex > currentWeekIndex) return;

    setAttendance(prev => {
      const newMap = new Map(prev);
      [...classStudents, ...classTeachers].forEach(person => {
        const personMap = new Map(newMap.get(person.id) || new Map());
        if ((personMap.get(weekIndex) || 'untouched') === 'untouched') {
          personMap.set(weekIndex, 'present');
          newMap.set(person.id, personMap);
        }
      });
      return newMap;
    });

    // Save each to Firestore
    try {
      const promises = [...classStudents, ...classTeachers].map(person => {
        const current = attendance.get(person.id)?.get(weekIndex) || 'untouched';
        if (current === 'untouched') {
          return saveAttendance(person.id, weekIndex, YEAR, 'present', currentUser.id);
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
    } catch (e) {
      console.error('Error marking all present:', e);
    }
  }, [currentWeekIndex, classStudents, classTeachers, attendance, currentUser.id]);

  // ===== Week Summary =====
  const getWeekSummary = useCallback((weekIndex: number) => {
    let present = 0, late = 0, absent = 0, prenotified = 0, untouched = 0;
    classStudents.forEach(s => {
      const status = attendance.get(s.id)?.get(weekIndex) || 'untouched';
      if (status === 'present') present++;
      else if (status === 'late') late++;
      else if (status === 'absent') absent++;
      else if (status === 'prenotified') prenotified++;
      else untouched++;
    });
    return { present, late, absent, prenotified, untouched, total: classStudents.length };
  }, [attendance, classStudents]);

  return {
    // Auth
    currentUser, isLoggedIn, setIsLoggedIn, switchUser,
    // Data
    users, students, classes, assignments, memos,
    sundays, currentWeekIndex,
    selectedClassId, setSelectedClassId,
    selectedClass, classTeachers, classStudents,
    teachersExpanded, setTeachersExpanded,
    // Loading
    isLoading, firebaseReady,
    // Attendance
    attendance, getAttendance, cycleAttendance, markAllPresent, getWeekSummary,
    // Memos
    getMemoFlags, getMemosForStudent, addMemo, editMemo, deleteMemo,
    // Stats
    getStudentStats,
    // Class management
    addClass, confirmClass, updateClassName, addTeacherToClass, removeTeacherFromClass,
    // Student management
    addStudent, updateStudentInfo, toggleStudentActive, moveStudentToClass,
    // Year
    year: YEAR,
  };
}
