# Viva Demonstration Guide & Presentation Script

**Project**: Cloud-Based Student Attendance Management System  
**Audience**: Project Examiner / Viva Voce Evaluation Committee  
**Presenter**: Madhav Khandelwal

---

## 1. Quick Demonstration Accounts Matrix

The database is pre-seeded with representative test accounts for each role:

| Role | Email Address | Password | Demonstration Purpose |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@attendance.edu` | `AdminPassword123!` | System-wide statistics, user enrollment, teaching allocations, audit logs |
| **Teacher (Faculty)** | `prof.sharma@attendance.edu` | `TeacherPassword123!` | Assigned to CS-A (Cloud Computing & Web Tech); mark & edit attendance |
| **Teacher (Faculty)** | `prof.patel@attendance.edu` | `TeacherPassword123!` | Assigned to CS-A (DBMS) and CS-B (Cloud Computing) |
| **Student (Normal)** | `aarav.mehta@student.edu` | `StudentPassword123!` | Demonstrates high attendance (>85%) and subject breakdown |
| **Student (Low %)** | `kabir.joshi@student.edu` | `StudentPassword123!` | **Demonstrates Shortage of Attendance Warning (<75%)** |

> 💡 **Viva Tip**: On the `/login` screen, use the **"One-Click Viva Demo Accounts"** buttons at the bottom of the card to instantly autofill any of these test credentials!

---

## 2. Step-by-Step Viva Demonstration Script

### Step 1: Introduction (1 Minute)
> *"Good morning, respected examiners. Today I am presenting my AWS Cloud Computing project: the **Cloud-Based Student Attendance Management System**. The application implements a secure multi-tier architecture hosted on **Amazon EC2** behind an **Nginx reverse proxy**, backed by a managed **Amazon RDS for PostgreSQL** database deployed inside an isolated Amazon VPC."*

---

### Step 2: Administrator Workflow (2 Minutes)
1. **Sign in as Administrator**:
   - Click the **Admin** quick-fill button on `/login` and submit.
2. **Show the KPI Dashboard**:
   - Point out **Active Students**, **Faculty**, **Classrooms**, **Present Today**, **Absent Today**, and **Today's Attendance %**.
   - Show the **7-Day Attendance Trend** chart and **Class-Wise Comparison** bar chart (powered by Recharts).
   - Point out the **Attendance Pending for Today** alert identifying classes that have not yet submitted registers.
3. **Show Class & Teaching Allocations**:
   - Navigate to `/admin/classes`: Show Section A and Section B.
   - Navigate to `/admin/assignments`: Show how teachers are mapped to classes and subjects with composite uniqueness constraints preventing duplicates.
4. **Show Compliance Audit Logs**:
   - Navigate to `/admin/audit-logs`: Show the immutable log of logins, attendance submissions, and student modifications. Click **"View Changes"** on any record to show the exact JSON delta with sensitive credentials redacted.

---

### Step 3: Teacher Workflow — Marking & Updating Attendance (3 Minutes)
1. **Sign out and sign in as Teacher (`prof.sharma@attendance.edu`)**.
2. **Review Assigned Classes**:
   - Notice that Teacher Dashboard only shows classes assigned to Dr. Sharma (CS-A for Cloud Computing and Web Tech).
3. **Mark Attendance for Today**:
   - Click **"Open Register"** or navigate to `/teacher/attendance`.
   - Select Class: **B.Tech CSE - 4th Sem (Sec A)**, Subject: **CS401**, Date: **Today**.
   - Show the enrolled roster ordered by roll number (`2025-CS-001` through `2025-CS-008`).
   - Click **"Mark All Present"** to demonstrate batch efficiency.
   - Change Kabir Joshi's status to **Absent** and Priya Nair to **Late** with remark *"Traffic delay"*.
   - Click **"Save Attendance"** — point out the atomic Prisma transaction success notification.
4. **Edit the Existing Attendance Session**:
   - Change the date back to yesterday: notice the blue banner **"Existing Session Loaded: Mode: Editing"**.
   - Adjust one student's status and click **"Update Attendance"**.
   - Explain: *"This mutation has been written to Amazon RDS and automatically generated a new entry in the institutional Audit Log."*

---

### Step 4: Student Self-Service Portal (2 Minutes)
1. **Sign in as Student (`aarav.mehta@student.edu`)**:
   - Show the high attendance percentage pill (`✓ Good Standing`).
   - Show the breakdown cards (Present, Late, Absent, Excused).
   - **Explain the Institutional Formula Alert**:
     $$\text{Attendance } \% = \frac{\text{Present} + \text{Late}}{\text{Present} + \text{Absent} + \text{Late}} \times 100$$
     Point out that **Excused** sessions are strictly excluded from the denominator.
2. **Sign in as Student with Attendance Shortage (`kabir.joshi@student.edu`)**:
   - Notice the prominent red attendance badge and warning banner:
     *⚠️ Shortage of Attendance Warning: Below 75% Requirement*.
   - Show the subject-wise progress bars highlighting the deficit.
   - Show the attendance log with instructor remarks.

---

### Step 5: Reports & Real CSV Export (1 Minute)
1. **Sign in as Admin or Teacher** and go to `/admin/reports` or `/teacher/reports`.
2. Select Class: **B.Tech CSE - 4th Sem (Sec A)**.
3. Check **"Filter Only Students Below Threshold"** (Threshold: 75%).
   - The table instantly isolates students with attendance shortages (e.g., Kabir Joshi).
4. Click **"Export CSV"**:
   - Open the downloaded CSV file in Excel or Notepad.
   - Explain the security measure: *"All cell values are sanitized against **Spreadsheet Formula Injection (CWE-1236)** by neutralizing dangerous leading characters like `=`, `+`, `-`, or `@`."*

---

### Step 6: Explaining Cloud Architecture & Verification (2 Minutes)
1. **Open the health check endpoint**:
   - Navigate to `/api/health`.
   - Show the JSON response: `{"status": "healthy", "database": "connected", "responseTimeMs": ...}`.
2. **Explain the AWS Network Isolation**:
   - EC2 is in the public subnet behind Nginx.
   - RDS PostgreSQL is in private subnets with **no public IP address**.
   - The RDS security group permits TCP port 5432 **only** from the EC2 security group.

---

## 3. Anticipated Viva Voce Questions & Answers

### Q1: Why did you choose Amazon RDS instead of running PostgreSQL directly inside the EC2 instance?
> **Answer**: *"Running PostgreSQL inside EC2 creates a monolithic single point of failure and requires manual database administration (OS patching, backup scheduling, storage resizing). Amazon RDS provides managed high availability, automated point-in-time snapshots, storage auto-scaling, and encryption at rest with AWS KMS, separating our compute layer from our persistent data layer according to cloud 12-factor principles."*

### Q2: How is the database protected from internet-based attacks?
> **Answer**: *"The Amazon RDS instance is deployed with `PubliclyAccessible = false` inside private subnets that have no route to the Internet Gateway. Furthermore, the RDS security group (`sg-attendance-rds`) only accepts inbound traffic on port 5432 from the EC2 security group (`sg-attendance-web`). Even if an attacker scans for port 5432, traffic is dropped at the AWS hypervisor level."*

### Q3: How do you prevent timezone drift when marking attendance?
> **Answer**: *"We standardize the application on `Asia/Kolkata` (IST) and store session dates using PostgreSQL's native `DATE` type (`@db.Date` in Prisma) rather than a timestamp with timezone. This guarantees that attendance recorded for a specific calendar day never shifts forward or backward across midnight during UTC conversion."*

### Q4: How is Role-Based Access Control (RBAC) enforced?
> **Answer**: *"Authorization is strictly enforced on the server. Next.js middleware guards protected routes based on verified JWT tokens stored in HttpOnly SameSite cookies. Furthermore, every Server Action and API Route verifies the user's role and resource ownership. For example, student endpoints discard any requested `studentId` from the browser and forcefully bind the database query to the authenticated student's session profile ID."*
