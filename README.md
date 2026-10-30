# Cloud-Based Student Attendance Management System

[![AWS EC2](https://img.shields.io/badge/AWS-EC2%20Hosting-FF9900?logo=amazonec2&logoColor=white)](https://aws.amazon.com/ec2/)
[![AWS RDS](https://img.shields.io/badge/AWS-RDS%20PostgreSQL-527FFF?logo=amazonrds&logoColor=white)](https://aws.amazon.com/rds/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16%20(App%20Router)-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Checking-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-PostgreSQL%20ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-25%20Passed%20(100%25)-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

A multi-tier, secure academic web application for recording, updating, viewing, and reporting student attendance. Engineered specifically as an **AWS Cloud Computing** academic project deployed on **Amazon EC2** and backed by **Amazon RDS for PostgreSQL**.

---

## 🌟 Key Features

- **Role-Based Access Control (RBAC)**: Distinct, isolated workflows for **Administrators**, **Faculty Teachers**, and **Students**.
- **Interactive Attendance Register**:
  - One-click **"Mark All Present"** convenience toggle with granular adjustments.
  - Color-coded statuses: **Present (Green)**, **Absent (Red)**, **Late (Amber)**, and **Excused (Blue)**.
  - Per-student remarks (medical notes, duty leave).
  - Atomic database transactions with duplicate submission prevention.
  - In-place editing of historical registers with full mutation audit trails.
- **Strict Academic Calculation Engine**:
  - Standardized formula: $\text{Attendance } \% = \frac{\text{Present} + \text{Late}}{\text{Present} + \text{Absent} + \text{Late}} \times 100$.
  - **Excused** sessions are strictly excluded from the denominator.
  - Safe handling of zero sessions (`"N/A"` without division-by-zero errors).
  - Automated shortage-of-attendance detection (< 75% examination threshold).
- **Compliance & Security**:
  - Comprehensive immutable **Audit Logs** capturing actor, action, previous values, new values, and IP addresses.
  - Sensitive credential redaction (`password`, `token`, `secretKey`).
  - **Spreadsheet Formula Injection Defense (CWE-1236)** on all CSV exports.
  - Server-side route guards and student data isolation.
- **Cloud Architecture & Performance**:
  - Amazon EC2 running Ubuntu 24.04 LTS, Nginx reverse proxy, and systemd process management.
  - Amazon RDS for PostgreSQL 16 hosted in private subnets with strict security group isolation (port 5432 restricted to EC2 SG).
  - Date-only PostgreSQL native storage (`@db.Date`) eliminating timezone drift in `Asia/Kolkata` (IST).
  - Unauthenticated `/api/health` monitoring endpoint.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Sonner |
| **Backend** | Next.js Server Components, Server Actions, Route Handlers, Zod Validation, date-fns |
| **Authentication** | Stateless signed JWTs (`jose`), bcrypt password hashing, HttpOnly SameSite cookies |
| **Database** | Amazon RDS PostgreSQL 16, Prisma ORM, version-controlled SQL migrations |
| **Cloud (AWS)** | Amazon EC2, Amazon RDS, Amazon VPC, Security Groups, Internet Gateway |
| **Server Admin** | Nginx Reverse Proxy, systemd supervisor, Ubuntu 24.04 LTS |
| **Testing** | Vitest, React Testing Library (25/25 automated tests passed) |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20 or v22 LTS (v24 compatible)
- **pnpm**: `npm install -g pnpm`
- **Docker**: (Optional, for running local PostgreSQL 16) or local PostgreSQL instance

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/madhav2256-ops/student-attendance-management-system.git
cd student-attendance-management-system
pnpm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your PostgreSQL `DATABASE_URL` is set in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/attendance_db?schema=public"
AUTH_SECRET="attendance_academic_secure_jwt_secret_key_2026_dev_mode"
APP_URL="http://localhost:3000"
SEED_ADMIN_EMAIL="admin@attendance.edu"
SEED_ADMIN_PASSWORD="AdminPassword123!"
```

*(If using Docker for local PostgreSQL)*:
```bash
docker run -d --name attendance-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=attendance_db -p 5432:5432 postgres:16-alpine
```

### 4. Database Setup & Seeding
```bash
# Push schema and generate Prisma Client
pnpm db:push

# Seed realistic test data (Classes, Subjects, Teachers, Students, Attendance History)
pnpm db:seed
```

### 5. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demonstration Credentials

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@attendance.edu` | `AdminPassword123!` | System administrator |
| **Teacher** | `prof.sharma@attendance.edu` | `TeacherPassword123!` | Assigned to CS-A (Cloud Computing & Web Tech) |
| **Teacher** | `prof.patel@attendance.edu` | `TeacherPassword123!` | Assigned to CS-A (DBMS) & CS-B (Cloud Computing) |
| **Student** | `aarav.mehta@student.edu` | `StudentPassword123!` | High attendance (>85%) |
| **Student** | `kabir.joshi@student.edu` | `StudentPassword123!` | **Low attendance (<75% warning)** |

*Tip: Click the quick-fill buttons on `/login` to sign in instantly with any demo account.*

---

## 🧪 Automated Testing & Verification

Execute the test suite, linting, type checks, and production build:

```bash
# 1. Run automated unit & integration tests (25 tests)
pnpm test

# 2. Run TypeScript strict typecheck
pnpm typecheck

# 3. Run ESLint code checks
pnpm lint

# 4. Run Next.js production build
pnpm build
```

---

## ☁️ AWS Cloud Architecture & Deployment

```text
User's Browser
    │
    ▼ (Port 80/443)
[ Amazon EC2 Instance ] (Public Subnet)
    │  - Nginx Reverse Proxy
    │  - Next.js Node.js Application (Port 3000)
    │  - Managed by systemd (attendance.service)
    │
    ▼ (Internal VPC Port 5432 - sg-attendance-rds)
[ Amazon RDS PostgreSQL ] (Private Subnet - No Public IP)
```

For complete step-by-step AWS provisioning and configuration instructions:
- 📖 [AWS Deployment Guide](docs/aws-deployment.md)
- 🏗️ [System Architecture & Network Security](docs/architecture.md)
- 🗄️ [Database Design & ER Diagram](docs/database-design.md)
- 📋 [Test Cases & Results Matrix](docs/test-cases.md)
- 🎓 [Academic Project Report](docs/project-report.md)
- 🎤 [Viva Demonstration Script](docs/demonstration-guide.md)

---

## 📄 License & Academic Attribution

Developed for academic demonstration and research purposes in Cloud Computing and Web Application Architecture.
