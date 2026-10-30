import { PrismaClient, Role, AttendanceStatus, SessionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Clean existing records in referential order
  await prisma.auditLog.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.teachingAssignment.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // Common password hashes
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPassword123!';
  const teacherPassword = 'TeacherPassword123!';
  const studentPassword = 'StudentPassword123!';

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const teacherHash = await bcrypt.hash(teacherPassword, 10);
  const studentHash = await bcrypt.hash(studentPassword, 10);

  // 1. Create Administrator
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@attendance.edu';
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      fullName: 'System Administrator',
      passwordHash: adminHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`Created Admin: ${adminUser.email}`);

  // 2. Create Classrooms
  const classA = await prisma.classroom.create({
    data: {
      name: 'B.Tech CSE - 4th Sem',
      section: 'A',
      academicYear: '2025-2026',
      isActive: true,
    },
  });

  const classB = await prisma.classroom.create({
    data: {
      name: 'B.Tech CSE - 4th Sem',
      section: 'B',
      academicYear: '2025-2026',
      isActive: true,
    },
  });
  console.log('Created Classrooms: Section A and Section B');

  // 3. Create Subjects
  const subjectCloud = await prisma.subject.create({
    data: { name: 'Cloud Computing Architecture', code: 'CS401', isActive: true },
  });
  const subjectDbms = await prisma.subject.create({
    data: { name: 'Database Management Systems', code: 'CS402', isActive: true },
  });
  const subjectWeb = await prisma.subject.create({
    data: { name: 'Web Technologies & Frameworks', code: 'CS403', isActive: true },
  });
  const subjectOS = await prisma.subject.create({
    data: { name: 'Operating Systems & Virtualization', code: 'CS404', isActive: true },
  });
  console.log('Created Subjects: CS401, CS402, CS403, CS404');

  // 4. Create Teachers
  const teacherUser1 = await prisma.user.create({
    data: {
      email: 'prof.sharma@attendance.edu',
      fullName: 'Dr. Ramesh Sharma',
      passwordHash: teacherHash,
      role: Role.TEACHER,
      isActive: true,
      teacherProfile: {
        create: {
          employeeCode: 'EMP-101',
        },
      },
    },
    include: { teacherProfile: true },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      email: 'prof.patel@attendance.edu',
      fullName: 'Prof. Ananya Patel',
      passwordHash: teacherHash,
      role: Role.TEACHER,
      isActive: true,
      teacherProfile: {
        create: {
          employeeCode: 'EMP-102',
        },
      },
    },
    include: { teacherProfile: true },
  });
  console.log('Created Teachers: Dr. Ramesh Sharma and Prof. Ananya Patel');

  // 5. Create Teaching Assignments
  await prisma.teachingAssignment.create({
    data: {
      teacherId: teacherUser1.teacherProfile!.id,
      classId: classA.id,
      subjectId: subjectCloud.id,
    },
  });

  await prisma.teachingAssignment.create({
    data: {
      teacherId: teacherUser1.teacherProfile!.id,
      classId: classA.id,
      subjectId: subjectWeb.id,
    },
  });

  await prisma.teachingAssignment.create({
    data: {
      teacherId: teacherUser2.teacherProfile!.id,
      classId: classA.id,
      subjectId: subjectDbms.id,
    },
  });

  await prisma.teachingAssignment.create({
    data: {
      teacherId: teacherUser2.teacherProfile!.id,
      classId: classB.id,
      subjectId: subjectCloud.id,
    },
  });
  console.log('Created Teaching Assignments');

  // 6. Create Students for Section A
  const sectionAStudentsData = [
    { name: 'Aarav Mehta', email: 'aarav.mehta@student.edu', roll: '2025-CS-001' },
    { name: 'Diya Sen', email: 'diya.sen@student.edu', roll: '2025-CS-002' },
    { name: 'Rohan Verma', email: 'rohan.verma@student.edu', roll: '2025-CS-003' },
    { name: 'Priya Nair', email: 'priya.nair@student.edu', roll: '2025-CS-004' },
    { name: 'Kabir Joshi', email: 'kabir.joshi@student.edu', roll: '2025-CS-005' }, // Low attendance candidate
    { name: 'Ananya Roy', email: 'ananya.roy@student.edu', roll: '2025-CS-006' },
    { name: 'Siddharth Rao', email: 'siddharth.rao@student.edu', roll: '2025-CS-007' },
    { name: 'Sneha Iyer', email: 'sneha.iyer@student.edu', roll: '2025-CS-008' },
  ];

  const sectionAStudents = [];
  for (const s of sectionAStudentsData) {
    const studentUser = await prisma.user.create({
      data: {
        email: s.email,
        fullName: s.name,
        passwordHash: studentHash,
        role: Role.STUDENT,
        isActive: true,
        studentProfile: {
          create: {
            rollNumber: s.roll,
            classId: classA.id,
          },
        },
      },
      include: { studentProfile: true },
    });
    sectionAStudents.push(studentUser.studentProfile!);
  }

  // Section B Students
  const sectionBStudentsData = [
    { name: 'Vikram Malhotra', email: 'vikram.m@student.edu', roll: '2025-CS-101' },
    { name: 'Ishita Gupta', email: 'ishita.g@student.edu', roll: '2025-CS-102' },
    { name: 'Aryan Saxena', email: 'aryan.s@student.edu', roll: '2025-CS-103' },
    { name: 'Tanvi Shah', email: 'tanvi.s@student.edu', roll: '2025-CS-104' },
  ];

  for (const s of sectionBStudentsData) {
    await prisma.user.create({
      data: {
        email: s.email,
        fullName: s.name,
        passwordHash: studentHash,
        role: Role.STUDENT,
        isActive: true,
        studentProfile: {
          create: {
            rollNumber: s.roll,
            classId: classB.id,
          },
        },
      },
    });
  }
  console.log(`Created ${sectionAStudentsData.length + sectionBStudentsData.length} students across 2 classes`);

  // 7. Seed Attendance Sessions & Records for Section A (last 7 days)
  console.log('Seeding attendance history for Section A...');
  const today = startOfDay(new Date());

  // Past 7 sessions for Cloud Computing (Teacher: Dr. Sharma)
  for (let i = 6; i >= 0; i--) {
    const sessionDate = subDays(today, i);
    // Skip Sundays
    if (sessionDate.getDay() === 0) continue;

    const session = await prisma.attendanceSession.create({
      data: {
        classId: classA.id,
        subjectId: subjectCloud.id,
        attendanceDate: sessionDate,
        markedById: teacherUser1.id,
        status: SessionStatus.SUBMITTED,
      },
    });

    // Mark records for each student
    for (const student of sectionAStudents) {
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      let remarks: string | null = null;

      // Kabir Joshi has frequent absences (testing low attendance threshold)
      if (student.rollNumber === '2025-CS-005') {
        if (i % 2 === 0) {
          status = AttendanceStatus.ABSENT;
          remarks = 'Uninformed absence';
        } else {
          status = AttendanceStatus.LATE;
          remarks = 'Arrived 15 mins late';
        }
      } else if (student.rollNumber === '2025-CS-003' && i === 2) {
        status = AttendanceStatus.EXCUSED;
        remarks = 'College Sports Meet duty';
      } else if (student.rollNumber === '2025-CS-002' && i === 4) {
        status = AttendanceStatus.LATE;
        remarks = 'Traffic delay';
      } else if (student.rollNumber === '2025-CS-007' && i === 1) {
        status = AttendanceStatus.ABSENT;
        remarks = 'Medical leave';
      }

      await prisma.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          status,
          remarks,
          markedById: teacherUser1.id,
          markedAt: sessionDate,
        },
      });
    }

    // Add audit log for session creation
    await prisma.auditLog.create({
      data: {
        actorId: teacherUser1.id,
        action: 'ATTENDANCE_RECORDED',
        entityType: 'AttendanceSession',
        entityId: session.id,
        newValues: {
          classId: classA.id,
          subjectId: subjectCloud.id,
          date: sessionDate.toISOString(),
          recordCount: sectionAStudents.length,
        },
      },
    });
  }

  // Past 5 sessions for DBMS (Teacher: Prof. Patel)
  for (let i = 5; i >= 1; i--) {
    const sessionDate = subDays(today, i);
    if (sessionDate.getDay() === 0) continue;

    const session = await prisma.attendanceSession.create({
      data: {
        classId: classA.id,
        subjectId: subjectDbms.id,
        attendanceDate: sessionDate,
        markedById: teacherUser2.id,
        status: SessionStatus.SUBMITTED,
      },
    });

    for (const student of sectionAStudents) {
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      let remarks: string | null = null;

      if (student.rollNumber === '2025-CS-005' && i % 2 !== 0) {
        status = AttendanceStatus.ABSENT;
      } else if (student.rollNumber === '2025-CS-004' && i === 3) {
        status = AttendanceStatus.LATE;
        remarks = 'Bus breakdown';
      }

      await prisma.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          status,
          remarks,
          markedById: teacherUser2.id,
          markedAt: sessionDate,
        },
      });
    }
  }

  console.log('Seeded attendance sessions and records successfully.');
  console.log('--- Database Seeding Complete ---');
  console.log('\nDemonstration Login Credentials:');
  console.log('==============================================');
  console.log(`ADMIN:   ${adminEmail} / ${adminPassword}`);
  console.log(`TEACHER: prof.sharma@attendance.edu / ${teacherPassword}`);
  console.log(`TEACHER: prof.patel@attendance.edu / ${teacherPassword}`);
  console.log(`STUDENT: aarav.mehta@student.edu / ${studentPassword}`);
  console.log(`STUDENT (Low Attendance): kabir.joshi@student.edu / ${studentPassword}`);
  console.log('==============================================\n');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

