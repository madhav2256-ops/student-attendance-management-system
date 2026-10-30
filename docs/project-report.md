# Academic Project Report — Cloud-Based Student Attendance Management System

---

## 1. Project Information & Student Credentials

- **Project Title**: Cloud-Based Student Attendance Management System
- **Academic Course**: AWS Cloud Computing & Distributed Systems Laboratory
- **Degree**: Bachelor of Technology (B.Tech) in Computer Science & Engineering
- **Academic Year**: 2025 – 2026
- **Student Name**: Madhav Khandelwal
- **Student Roll Number / Registration ID**: [Editable / Fill in Viva Roll Number]
- **Department**: Department of Computer Science and Engineering
- **Institution**: [Editable / University / College Name]
- **Project Supervisor / Guide**: [Editable / Faculty Guide Name]

---

## 2. Abstract

Accurate, tamper-resistant attendance tracking is essential for academic institutions to enforce regulatory compliance, ensure eligibility for end-semester examinations, and evaluate student engagement. Traditional pen-and-paper registers and legacy on-premises software suffer from data manipulation risks, physical damage, lack of real-time student visibility, and single-point-of-failure vulnerabilities.

This project implements a multi-tier, cloud-native **Student Attendance Management System** leveraging **Amazon Elastic Compute Cloud (Amazon EC2)** and **Amazon Relational Database Service (Amazon RDS for PostgreSQL)**. Built on **Next.js App Router**, **TypeScript**, and **Tailwind CSS**, the system provides distinct, role-based workflows for Administrators, Faculty Instructors, and Students. Features include one-click register marking, atomic attendance transactions, strict formula calculation (`((Present + Late) / (Present + Absent + Late)) * 100` with Excused exclusions), real-time shortage-of-attendance detection (< 75%), audit logging of modifications, and spreadsheet injection-safe CSV exports. This report documents the architecture, database normalization, cloud networking, testing validation, and deployment methodology.

---

## 3. Introduction

Educational institutions require reliable records of attendance to assess students' eligibility for semester examinations and track participation in coursework. Conventional paper registers are prone to proxy attendance, arithmetic calculation errors, loss, and delayed communication with students.

Cloud computing provides on-demand compute capacity, scalable managed databases, robust security isolation, and continuous availability. By combining Amazon EC2 for virtual compute hosting behind an Nginx reverse proxy with Amazon RDS for a managed PostgreSQL relational database within an isolated Virtual Private Cloud (VPC), this project demonstrates an enterprise-grade cloud architecture tailored for academic governance.

---

## 4. Problem Statement

1. **Proxy Attendance & Human Error**: Manual registers are susceptible to proxy marking and subjective arithmetic errors during monthly aggregate calculations.
2. **Lack of Student Visibility**: Students frequently remain unaware of attendance deficits until examination admit cards are blocked.
3. **Database Security & Availability**: Locally hosted institutional databases lack automated failover, managed backups, encryption at rest, and firewall isolation.
4. **Data Tampering & Accountability**: Traditional web systems fail to record who modified attendance records, what prior values existed, or when adjustments occurred.

---

## 5. Objectives

1. Develop a high-performance web application using **Next.js App Router**, **React 19**, and **TypeScript**.
2. Design a 3NF normalized relational database schema in **PostgreSQL** using **Prisma ORM**.
3. Deploy the application server on **Amazon EC2** managed by `systemd` behind an **Nginx** reverse proxy.
4. Host application data on **Amazon RDS PostgreSQL** in private subnets, restricting TCP port 5432 strictly to the EC2 security group.
5. Implement Role-Based Access Control (RBAC) across three distinct actors: Administrator, Teacher, and Student.
6. Provide real-time analytics with Recharts, automated shortage alerts (< 75%), and CSV reporting.
7. Conduct automated unit and integration testing with 100% pass verification.

---

## 6. Scope of the Project

- **In Scope**:
  - Administrator control of students, faculty, classes, subjects, and teaching allocations.
  - Faculty attendance marking (Present, Absent, Late, Excused), Mark All shortcuts, and session editing.
  - Student self-service portal showing aggregate percentage, subject-wise breakdown, and session history.
  - Atomic database transactions with audit logging.
  - CSV reports protected against formula injection (CWE-1236).
  - Multi-tier cloud deployment on Amazon EC2 and Amazon RDS inside a custom VPC.
- **Out of Scope**:
  - Biometric hardware fingerprint scanners or facial recognition cameras (software-first architecture).
  - Integration with external payment gateways for college tuition fees.

---

## 7. Functional & Non-Functional Requirements

### Functional Requirements
- **FR-01 (Authentication)**: Secure login using email and password, authenticated via bcrypt and signed JWT tokens stored in HttpOnly cookies.
- **FR-02 (Class & Subject Management)**: Admin can create and structure academic years, cohorts, sections, and curriculum subjects.
- **FR-03 (Teacher Allocation)**: Admin maps teachers to specific classes and subjects with uniqueness constraints.
- **FR-04 (Attendance Register)**: Teachers open rosters of active enrolled students ordered by roll number and mark statuses.
- **FR-05 (Audit Logging)**: All session creations and subsequent modifications capture actor ID, previous values, and new values.
- **FR-06 (Student Portal)**: Students access personal records, subject statistics, and calculation transparency.
- **FR-07 (CSV Reporting)**: Filtered attendance summaries exportable as sanitized CSV spreadsheets.

### Non-Functional Requirements
- **NFR-01 (Security)**: Database in private subnets; no public access to port 5432; passwords hashed using bcrypt (10 rounds).
- **NFR-02 (Performance)**: Page responses under 300ms; database connection pooling via Prisma.
- **NFR-03 (Reliability)**: Process managed by systemd with automatic restart on failure.
- **NFR-04 (Usability)**: Responsive SaaS interface with WCAG-compliant color contrasts and mobile compatibility.

---

## 8. Technology Stack

- **Frontend & App Layer**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Recharts, Sonner.
- **Backend & Logic**: Next.js Server Components, Server Actions, Route Handlers, Zod Validation, date-fns.
- **Authentication**: Stateless signed JSON Web Tokens (`jose`), bcrypt password hashing, HttpOnly SameSite cookies.
- **Database Layer**: PostgreSQL 16, Prisma ORM, version-controlled SQL migrations.
- **Cloud Infrastructure**: Amazon Web Services (AWS):
  - Amazon EC2 (Ubuntu 24.04 LTS, `t3.small` / `t4g.small`).
  - Amazon RDS for PostgreSQL (`db.t4g.micro` / `db.t3.micro`).
  - Amazon VPC (Public Subnet, Private Subnets, Route Tables, Internet Gateway).
  - Security Groups (`sg-attendance-web`, `sg-attendance-rds`).
- **Server Software**: Nginx (Reverse Proxy & Static Asset Caching), systemd (Service Supervisor).
- **Testing**: Vitest, React Testing Library.

---

## 9. Explanation of Amazon EC2

Amazon Elastic Compute Cloud (Amazon EC2) provides scalable virtual computing capacity in the cloud. In this project:
- An EC2 instance runs Ubuntu 24.04 LTS in the VPC public subnet.
- It hosts the Node.js application process and the Nginx reverse proxy.
- Nginx listens on ports 80/443, handles TLS termination, and forwards web traffic to `127.0.0.1:3000`.
- The Node.js application process is monitored by `systemd`, ensuring it automatically reboots upon system restarts or crashes.
- The EC2 instance connects to Amazon RDS through internal VPC routing on port 5432.

---

## 10. Explanation of Amazon RDS

Amazon Relational Database Service (Amazon RDS) is a managed relational database service that automates provisioning, hardware scaling, patching, automated backups, and failure recovery. In this project:
- Amazon RDS runs PostgreSQL 16 in a dedicated DB Subnet Group spanning private subnets across two Availability Zones.
- **Public Access is disabled (`PubliclyAccessible = false`)**, meaning the database has no internet-facing IP address.
- Storage encryption at rest is enabled using AWS KMS.
- Point-in-time recovery and automated snapshots ensure data resilience without manual administrative overhead.

---

## 11. Explanation of VPC and Security Groups

- **Virtual Private Cloud (VPC)**: Logically isolated virtual network (`10.0.0.0/16`) dedicated to the institution's cloud assets.
- **Public Subnet (`10.0.1.0/24`)**: Associated with an Internet Gateway (IGW). Houses the EC2 instance so users worldwide can reach the attendance portal via HTTP/HTTPS.
- **Private Subnets (`10.0.10.0/24` & `10.0.11.0/24`)**: Subnets with no route to the Internet Gateway. Houses the RDS PostgreSQL database.
- **Security Group Isolation**:
  - `sg-attendance-web` accepts inbound HTTP (80) and HTTPS (443) from `0.0.0.0/0`, and SSH (22) from the administrator's IP address.
  - `sg-attendance-rds` allows inbound PostgreSQL (5432) **strictly and exclusively** from `sg-attendance-web`.
  - External attackers cannot communicate with the database because the RDS security group drops all packets not originating from the EC2 instance's security group.

---

## 12. System Architecture

*(See [docs/architecture.md](file:///C:/Users/madha/OneDrive/Desktop/attendance/docs/architecture.md) for full Mermaid diagram and details).*

User Browser -> Internet Gateway -> Nginx (EC2) -> Next.js App (127.0.0.1:3000) -> Prisma ORM -> Amazon RDS PostgreSQL (Port 5432 inside VPC).

---

## 13. Database Design

*(See [docs/database-design.md](file:///C:/Users/madha/OneDrive/Desktop/attendance/docs/database-design.md) for full ER diagram and field dictionaries).*

The schema consists of 9 core entities: `User`, `StudentProfile`, `TeacherProfile`, `Classroom`, `Subject`, `TeachingAssignment`, `AttendanceSession`, `AttendanceRecord`, and `AuditLog`. Relational integrity is enforced using unique composite keys (e.g. `[name, section, academicYear]` on Classroom, `[sessionId, studentId]` on AttendanceRecord) and foreign keys with `CASCADE` or `RESTRICT` actions.

---

## 14. Module Descriptions

1. **Authentication & Session Module**: Handles credential validation, password hashing, session issuance, and cookie security.
2. **Administration Module**: Manages student enrollments, faculty profiles, class hierarchies, subject codes, and course allocations.
3. **Attendance Management Module**: Loads class rosters, provides status toggles, executes atomic database upserts, and records audit logs.
4. **Analytics & Calculation Engine**: Implements the standardized attendance formula, detects low attendance thresholds, and computes class averages.
5. **Reporting & CSV Export Module**: Filters records across date ranges and generates sanitized spreadsheets.
6. **Audit & Compliance Module**: Logs who modified records, previous values, and client IP addresses.

---

## 15. Application Workflow

1. **Login**: User supplies email and password. Server verifies bcrypt hash and issues HttpOnly session cookie.
2. **Dashboard Redirection**: Middleware reads session role and routes user to role-specific dashboard.
3. **Register Opening**: Faculty member selects assigned class, subject, and date.
4. **Data Entry**: Faculty marks statuses (Present, Absent, Late, Excused) with optional remarks.
5. **Server Transaction**: Server validates date (not future), ensures teacher is assigned to class/subject, executes atomic transaction, and logs mutation in `AuditLog`.
6. **Student Verification**: Student logs in, sees current attendance percentage and warning badge if < 75%.
7. **Report Export**: Administrator or faculty generates filtered CSV reports.

---

## 16. Security Measures

1. **Defense in Depth**: Application tier and database tier reside in separate security groups.
2. **Spreadsheet Formula Injection Defense (CWE-1236)**: Fields starting with `=`, `+`, `-`, or `@` are escaped with a prepended single quote (`'`).
3. **Student Privacy**: Student endpoints override URL parameters and bind queries to `session.studentProfileId`.
4. **Password Security**: Bcrypt with 10 salt rounds; plain-text passwords never stored or logged.
5. **Audit Redaction**: Sensitive attributes (`password`, `token`, `secret`) are masked as `[REDACTED]`.

---

## 17. Testing Methodology & Actual Results

Automated unit and integration tests were conducted using **Vitest**.
- **Test Results**: **25 tests passed (100% success rate)**.
- **Coverage**: Attendance calculations, Excused exclusions, Zero-session edge case, CSV sanitization, Zod schemas, JWT tokens, RBAC invariants, and date-only timezone preservation.
*(See [docs/test-cases.md](file:///C:/Users/madha/OneDrive/Desktop/attendance/docs/test-cases.md) for full details).*

---

## 18. Application UI Layouts & Features

The user interface follows a clean, academic SaaS visual language:
- White surfaces with deep navy accents (`#1e1b4b`) and teal highlights (`#0d9488`).
- Responsive sidebar navigation on desktop; drawer menu on mobile devices.
- High-visibility status pills: Green for Present, Red for Absent, Amber for Late, Blue for Excused.
- Recharts visualizations: 7-day attendance trends and class-by-class comparison charts.

---

## 19. Deployment Procedure

*(See [docs/aws-deployment.md](file:///C:/Users/madha/OneDrive/Desktop/attendance/docs/aws-deployment.md) for executable command-by-command instructions).*

Summary of deployment steps:
1. Provision VPC, public subnet, and two private subnets.
2. Create `sg-attendance-web` and `sg-attendance-rds`.
3. Launch Amazon RDS PostgreSQL instance in private subnets.
4. Launch Amazon EC2 Ubuntu LTS instance in public subnet.
5. SSH into EC2, install Node.js 22 LTS, pnpm, and Nginx.
6. Clone repository, configure production `.env`, apply Prisma migrations, and run seed script.
7. Build Next.js application (`pnpm build`).
8. Enable systemd daemon (`attendance.service`) and configure Nginx reverse proxy.
9. Verify health endpoint (`/api/health`).

---

## 20. Limitations

1. **Single-Region Deployment**: Initial design is deployed within a single AWS region; cross-region disaster recovery requires multi-region RDS read replicas.
2. **No Hardware Biometrics**: The system relies on instructor-led software registers rather than physical fingerprint scanners.

---

## 21. Future Enhancements

1. **Automated WhatsApp / SMS Absence Alerts**: Integration with Amazon SNS / Amazon Pinpoint to notify guardians of student absences automatically.
2. **AWS Auto Scaling & Application Load Balancer**: Scaling EC2 instances behind an ALB for institutions with tens of thousands of concurrent users.
3. **Biometric Face Recognition**: Real-time attendance verification using Amazon Rekognition.

---

## 22. Conclusion

The **Cloud-Based Student Attendance Management System** demonstrates a complete, secure, and production-ready implementation of a multi-tier cloud application. By deploying Next.js on Amazon EC2 and PostgreSQL on Amazon RDS within a hardened VPC architecture, the system provides reliable attendance recording, automated shortage tracking, and tamper-resistant audit trails suitable for modern educational institutions.

---

## 23. References to Official Documentation

1. Amazon EC2 Documentation: https://docs.aws.amazon.com/ec2/
2. Amazon RDS for PostgreSQL Documentation: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html
3. Amazon VPC User Guide: https://docs.aws.amazon.com/vpc/latest/userguide/
4. Next.js App Router Documentation: https://nextjs.org/docs
5. Prisma ORM Documentation: https://www.prisma.io/docs
6. OWASP Spreadsheet Formula Injection (CWE-1236): https://owasp.org/www-community/attacks/CSV_Injection
