# Test Cases & Quality Assurance Matrix

**Project**: Cloud-Based Student Attendance Management System  
**Test Framework**: Vitest, React Testing Library, TypeScript Strict Type Checking  
**Database**: PostgreSQL 16 Engine & Prisma ORM  
**Date of Execution**: March 2026  
**Overall Automated Test Status**: **25/25 PASSED (100% Pass Rate)**

---

## 1. Test Cases Execution Table

| Test ID | Scenario | Preconditions | Test Steps | Expected Result | Actual Result / Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | User authentication with valid credentials | User exists in PostgreSQL with bcrypt password hash | Send `POST /api/auth/login` with correct email and password | Returns 200 OK, sets secure HttpOnly cookie with JWT session payload | **PASSED** |
| **TC-02** | User authentication with invalid password | User exists in database | Send `POST /api/auth/login` with incorrect password | Returns 401 Unauthorized with generic error message preventing user enumeration | **PASSED** |
| **TC-03** | Deactivated user login prevention | User account has `isActive = false` | Send `POST /api/auth/login` with valid email & password | Returns 403 Forbidden with account deactivation notice | **PASSED** |
| **TC-04** | Unauthenticated access to protected route | No session cookie present in HTTP request | Navigate to `/dashboard` or `/admin/students` | Next.js middleware redirects to `/login?from=...` | **PASSED** |
| **TC-05** | Unauthorized role boundary enforcement | User authenticated as `STUDENT` | Attempt to access `/admin/students` or `/teacher/attendance` | Server redirects to `/unauthorized` (403 Forbidden) | **PASSED** |
| **TC-06** | Student privacy & data isolation | Student authenticated | Send `GET /api/reports/student?studentId=other-id` | Endpoint forcibly ignores requested ID and restricts query to `session.studentProfileId` | **PASSED** |
| **TC-07** | Teacher class allocation enforcement | Teacher assigned only to Class A | Attempt to record attendance for Class B | Server rejects request with 403 Forbidden (not assigned to class) | **PASSED** |
| **TC-08** | Attendance percentage standard calculation | Class sessions recorded | Calculate for 8 Present, 1 Late, 1 Absent, 0 Excused | Formula yields `((8+1)/(8+1+1))*100 = 90.0%` | **PASSED** |
| **TC-09** | Excused session exclusion from denominator | Sessions recorded with Excused status | Calculate for 7 Present, 1 Late, 2 Absent, 5 Excused | Eligible = 10 (Excused excluded). Attendance = `(8/10)*100 = 80.0%` | **PASSED** |
| **TC-10** | Zero-session edge case handling | No sessions recorded (0 eligible) | Calculate percentage for 0 Present, 0 Absent, 0 Late | Returns `null` and displays `"N/A"` without division by zero error | **PASSED** |
| **TC-11** | Duplicate student prevention in session | Submitting attendance payload | Payload contains duplicate `studentId` entries | Server validation detects duplicate and rejects transaction with 400 Bad Request | **PASSED** |
| **TC-12** | Future attendance date prevention | Server in Asia/Kolkata timezone | Select attendance date greater than current date | Request rejected with 400 Bad Request ("Cannot record future attendance") | **PASSED** |
| **TC-13** | Atomic attendance session creation | Class has 8 enrolled students | Teacher submits attendance for all students | Prisma transaction creates session and 8 records atomically; creates audit log | **PASSED** |
| **TC-14** | Atomic attendance session update | Existing attendance session on record | Teacher reopens date, changes 1 status, saves | Session updated in-place; delta recorded in `AuditLog` with previous & new values | **PASSED** |
| **TC-15** | CSV formula injection protection (CWE-1236) | Student name contains `=cmd\|' /C calc'!A0` or `+SUM()` | Export CSV via `/api/reports/export` | Dangerous leading prefixes sanitized with single quote `\'`; quotes escaped | **PASSED** |
| **TC-16** | Classroom uniqueness constraint | Class "CSE 4th Sem", Section "A", AY "2025-2026" exists | Attempt to insert identical composite tuple | PostgreSQL unique constraint triggers; returns 409 Conflict | **PASSED** |
| **TC-17** | Audit log credential redaction | Admin creates new teacher account | Check `AuditLog` payload in PostgreSQL | Passwords and password hashes are redacted to `[REDACTED]` | **PASSED** |
| **TC-18** | Health check connectivity verification | Database active and listening on port 5432 | Send `GET /api/health` | Returns 200 OK with `database: "connected"` and round-trip latency | **PASSED** |

---

## 2. Automated Test Suite Summary

Executed command: `pnpm test`
```text
 ✓ tests/unit/csv-sanitization.test.ts (4 tests) 3ms
 ✓ tests/integration/attendance-workflow.test.ts (3 tests) 21ms
 ✓ tests/integration/security-and-authorization.test.ts (4 tests) 5ms
 ✓ tests/unit/calculations.test.ts (5 tests) 7ms
 ✓ tests/unit/validation.test.ts (6 tests) 7ms
 ✓ tests/integration/auth-and-roles.test.ts (3 tests) 189ms

 Test Files  6 passed (6)
      Tests  25 passed (25)
   Duration  494ms
```

