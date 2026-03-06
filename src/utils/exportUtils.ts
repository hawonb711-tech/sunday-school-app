import { SundayInfo, AttendanceStatus, ATTENDANCE_LABELS, Student, User, ClassGroup, Memo, MEMO_TYPE_LABELS, MEMO_SCOPE_LABELS } from '../models/types';

// BOM for Korean characters in Excel
const BOM = '\uFEFF';

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportAttendance(
  students: Student[],
  teachers: User[],
  sundays: SundayInfo[],
  currentWeekIndex: number,
  getAttendance: (personId: string, weekIndex: number) => AttendanceStatus,
  className: string,
) {
  const header = ['이름', '구분', ...sundays.filter((_, i) => i <= currentWeekIndex).map(s => `${s.month + 1}/${s.day}`)];
  const rows: string[][] = [];

  teachers.forEach(t => {
    const row = [t.name, '교사'];
    for (let i = 0; i <= currentWeekIndex; i++) {
      row.push(ATTENDANCE_LABELS[getAttendance(t.id, i)]);
    }
    rows.push(row);
  });

  students.forEach(s => {
    const row = [s.name, '학생'];
    for (let i = 0; i <= currentWeekIndex; i++) {
      row.push(ATTENDANCE_LABELS[getAttendance(s.id, i)]);
    }
    rows.push(row);
  });

  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  downloadCsv(`출석_${className}_${new Date().toISOString().split('T')[0]}.csv`, csv);
}

export function exportMemos(
  memos: Memo[],
  students: Student[],
  sundays: SundayInfo[],
) {
  const header = ['학생', '주차', '날짜', '타입', '공유범위', '내용', '작성자', '작성일'];
  const rows: string[][] = [];

  const activeMemos = memos.filter(m => !m.isDeleted);
  activeMemos.forEach(m => {
    const student = students.find(s => s.id === m.studentId);
    const sunday = m.weekIndex !== undefined ? sundays[m.weekIndex] : null;
    rows.push([
      student?.name || m.studentId,
      m.weekIndex !== undefined ? `${m.weekIndex + 1}주차` : '-',
      sunday ? `${sunday.month + 1}/${sunday.day}` : '-',
      MEMO_TYPE_LABELS[m.type],
      MEMO_SCOPE_LABELS[m.scope],
      `"${m.content.replace(/"/g, '""')}"`,
      m.authorName,
      new Date(m.createdAt).toLocaleDateString('ko-KR'),
    ]);
  });

  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  downloadCsv(`메모_${new Date().toISOString().split('T')[0]}.csv`, csv);
}

export function exportStudentList(
  students: Student[],
  classes: ClassGroup[],
) {
  const header = ['이름', '학년', '반', '학부모', '연락처', '등록일', '상태'];
  const rows: string[][] = [];

  students.forEach(s => {
    const cls = classes.find(c => c.id === s.classId);
    rows.push([
      s.name,
      `${s.grade}학년`,
      cls?.name || '-',
      s.parentName || '-',
      s.parentPhone || '-',
      s.enrollDate,
      s.isActive ? '활성' : '비활성',
    ]);
  });

  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  downloadCsv(`학생명단_${new Date().toISOString().split('T')[0]}.csv`, csv);
}

export function exportClassSummary(
  classes: ClassGroup[],
  students: Student[],
  users: User[],
  sundays: SundayInfo[],
  currentWeekIndex: number,
  getAttendance: (personId: string, weekIndex: number) => AttendanceStatus,
) {
  const header = ['반', '학년', '상태', '교사', '학생수', '평균출석률'];
  const rows: string[][] = [];

  classes.forEach(cls => {
    const classStudents = students.filter(s => s.classId === cls.id && s.isActive);
    const classTeachers = users.filter(u => cls.teacherIds.includes(u.id));

    let totalPresent = 0, totalCount = 0;
    classStudents.forEach(s => {
      for (let i = 0; i <= currentWeekIndex; i++) {
        const status = getAttendance(s.id, i);
        if (status !== 'untouched' && status !== 'future') {
          totalCount++;
          if (status === 'present' || status === 'late') totalPresent++;
        }
      }
    });
    const rate = totalCount > 0 ? Math.round((totalPresent / totalCount) * 100) : 0;

    rows.push([
      cls.name,
      cls.gradeRange,
      cls.status === 'confirmed' ? '확정' : '가편성',
      classTeachers.map(t => t.name).join(', '),
      `${classStudents.length}명`,
      `${rate}%`,
    ]);
  });

  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  downloadCsv(`반별요약_${new Date().toISOString().split('T')[0]}.csv`, csv);
}
