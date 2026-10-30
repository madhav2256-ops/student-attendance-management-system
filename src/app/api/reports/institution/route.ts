import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Role, AttendanceStatus } from '@prisma/client';
import { parseDateOnly, getTodayIST } from '@/lib/utils/date';
import { calculateAttendancePercentage } from '@/lib/attendance/calculations';
import { subDays } from 'date-fns';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const todayStr = getTodayIST();
  const todayDate = parseDateOnly(todayStr);

  // 1. Basic counts
  const [totalStudents, totalTeachers, totalClasses, todaySessions] = await Promise.all([
    prisma.studentProfile.count({ where: { user: { isActive: true } } }),
    prisma.teacherProfile.count({ where: { user: { isActive: true } } }),
    prisma.classroom.count({ where: { isActive: true } }),
    prisma.attendanceSession.findMany({
      where: { attendanceDate: todayDate },
      include: {
        records: true,
        classroom: true,
      },
    }),
  ]);

  // Today's attendance calculation
  let todayPresent = 0;
  let todayAbsent = 0;
  let todayLate = 0;
  let todayExcused = 0;

  const classesWithTodayAttendance = new Set<string>();

  for (const s of todaySessions) {
    classesWithTodayAttendance.add(s.classId);
    for (const r of s.records) {
      if (r.status === AttendanceStatus.PRESENT) todayPresent++;
      else if (r.status === AttendanceStatus.ABSENT) todayAbsent++;
      else if (r.status === AttendanceStatus.LATE) todayLate++;
      else if (r.status === AttendanceStatus.EXCUSED) todayExcused++;
    }
  }

  const todayStats = calculateAttendancePercentage(
    todayPresent,
    todayAbsent,
    todayLate,
    todayExcused
  );

  // 2. Unmarked classes for today
  const allClasses = await prisma.classroom.findMany({
    where: { isActive: true },
    select: { id: true, name: true, section: true },
  });

  const unmarkedClasses = allClasses.filter((c) => !classesWithTodayAttendance.has(c.id));

  // 3. Attendance Trend for the last 7 days
  const trendDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const dateStr = d.toISOString().split('T')[0];
    trendDays.push(dateStr);
  }

  const trendData = [];
  for (const dateStr of trendDays) {
    const dateObj = parseDateOnly(dateStr);
    const daySessions = await prisma.attendanceSession.findMany({
      where: { attendanceDate: dateObj },
      include: { records: true },
    });

    let p = 0;
    let a = 0;
    let l = 0;
    let e = 0;

    for (const s of daySessions) {
      for (const r of s.records) {
        if (r.status === AttendanceStatus.PRESENT) p++;
        else if (r.status === AttendanceStatus.ABSENT) a++;
        else if (r.status === AttendanceStatus.LATE) l++;
        else if (r.status === AttendanceStatus.EXCUSED) e++;
      }
    }

    const calc = calculateAttendancePercentage(p, a, l, e);
    trendData.push({
      date: dateStr,
      present: p,
      absent: a,
      late: l,
      excused: e,
      percentage: calc.percentage,
    });
  }

  // 4. Class-wise comparison
  const classComparison = [];
  for (const cls of allClasses) {
    const records = await prisma.attendanceRecord.findMany({
      where: {
        session: { classId: cls.id },
      },
      select: { status: true },
    });

    let p = 0;
    let a = 0;
    let l = 0;
    let e = 0;
    for (const r of records) {
      if (r.status === AttendanceStatus.PRESENT) p++;
      else if (r.status === AttendanceStatus.ABSENT) a++;
      else if (r.status === AttendanceStatus.LATE) l++;
      else if (r.status === AttendanceStatus.EXCUSED) e++;
    }

    const calc = calculateAttendancePercentage(p, a, l, e);
    classComparison.push({
      className: `${cls.name} (${cls.section})`,
      percentage: calc.percentage ?? 0,
      totalSessions: records.length,
    });
  }

  // 5. Recent activity
  const recentSessions = await prisma.attendanceSession.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      classroom: true,
      subject: true,
      markedBy: { select: { fullName: true } },
    },
  });

  return NextResponse.json({
    kpis: {
      totalStudents,
      totalTeachers,
      totalClasses,
      todayPresent,
      todayAbsent,
      todayPercentage: todayStats.percentageFormatted,
    },
    todaySessionsCount: todaySessions.length,
    unmarkedClasses,
    trendData,
    classComparison,
    recentSessions,
  });
}

