import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createStudentSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rollNumber: z.string().min(2, 'Roll number is required'),
  classId: z.string().min(1, 'Please select a classroom'),
});

export const updateStudentSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  rollNumber: z.string().min(2, 'Roll number is required'),
  classId: z.string().min(1, 'Please select a classroom'),
  isActive: z.boolean().default(true),
});

export const createTeacherSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  employeeCode: z.string().optional(),
});

export const createClassroomSchema = z.object({
  name: z.string().min(2, 'Class name is required'),
  section: z.string().min(1, 'Section is required'),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY (e.g. 2025-2026)'),
});

export const createSubjectSchema = z.object({
  name: z.string().min(2, 'Subject name is required'),
  code: z.string().min(2, 'Subject code is required (e.g. CS401)'),
});

export const createAssignmentSchema = z.object({
  teacherId: z.string().min(1, 'Select a teacher'),
  classId: z.string().min(1, 'Select a class'),
  subjectId: z.string().min(1, 'Select a subject'),
});

export const attendanceRecordItemSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  status: z.nativeEnum(AttendanceStatus, {
    message: 'Invalid attendance status',
  }),
  remarks: z.string().max(250).optional().nullable(),
});

export const saveAttendanceSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  records: z.array(attendanceRecordItemSchema).min(1, 'At least one student record is required'),
});

export const reportQuerySchema = z.object({
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  studentId: z.string().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  threshold: z.coerce.number().min(0).max(100).optional(),
});

