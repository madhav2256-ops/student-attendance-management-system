# System Architecture — Cloud-Based Student Attendance Management System

This document outlines the multi-tier cloud infrastructure, network boundaries, and data flow of the **Cloud-Based Student Attendance Management System** deployed on Amazon Web Services (AWS).

---

## 1. High-Level Multi-Tier Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Access Layer"]
        UserBrowser["User Web Browser (Desktop / Mobile)"]
    end

    subgraph AWSVPC ["AWS Virtual Private Cloud (VPC) - 10.0.0.0/16"]
        subgraph PublicSubnet ["Public Subnet (10.0.1.0/24)"]
            InternetGateway["Internet Gateway (IGW)"]
            
            subgraph EC2Instance ["Amazon EC2 Instance (t3/t4g.small)"]
                NginxProxy["Nginx Reverse Proxy (Port 80 / 443)"]
                NextApp["Next.js App Server (Node.js on 127.0.0.1:3000)"]
                SystemdService["systemd Daemon (attendance.service)"]
                PrismaORM["Prisma Client ORM Engine"]
            end
        end

        subgraph PrivateSubnets ["Private DB Subnets (10.0.10.0/24 & 10.0.11.0/24)"]
            subgraph RDSInstance ["Amazon RDS PostgreSQL Instance"]
                PostgresDB[("PostgreSQL 16 Engine (Port 5432)")]
            end
        end
    end

    %% Network & Data Traffic
    UserBrowser -->|HTTPS :443 / HTTP :80| InternetGateway
    InternetGateway -->|Port 80/443| NginxProxy
    NginxProxy -->|Loopback HTTP Proxy :3000| NextApp
    SystemdService -.->|Supervises process| NextApp
    NextApp --> PrismaORM
    PrismaORM -->|Encrypted TCP :5432 (Inside VPC)| PostgresDB

    %% Security Group Boundary Annotations
    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef ec2 fill:#ede9fe,stroke:#6366f1,stroke-width:2px;
    classDef db fill:#ccfbf1,stroke:#0d9488,stroke-width:2px;
    classDef net fill:#f1f5f9,stroke:#64748b,stroke-width:1px;

    class UserBrowser client;
    class EC2Instance,NginxProxy,NextApp,SystemdService,PrismaORM ec2;
    class RDSInstance,PostgresDB db;
    class InternetGateway net;
```

---

## 2. Component Descriptions

### A. Client Access Layer
- **Client Web Browser**: Users (Administrators, Teachers, and Students) interact with the application over standard HTTPS/HTTP protocols. The UI is built using responsive Tailwind CSS, Lucide icons, and Recharts, providing an optimal experience on desktop, tablet, and mobile browsers.

### B. Amazon EC2 (Elastic Compute Cloud) — Public Subnet
- **Instance Operating System**: Ubuntu 24.04 LTS.
- **Nginx Reverse Proxy**:
  - Acts as the public-facing HTTP/HTTPS web server.
  - Terminates TLS/SSL certificates (via Let's Encrypt / Certbot).
  - Enforces HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
  - Proxies requests internally to `127.0.0.1:3000`.
  - Exposes an unauthenticated `/api/health` health check endpoint for AWS monitoring.
- **Next.js Production Application**:
  - Runs in production mode (`pnpm start`) on internal port 3000.
  - Handles Server-Side Rendering (SSR), Server Components, Route Handlers, and Role-Based Access Control (RBAC).
  - Managed by `systemd` (`attendance.service`) for automatic restart, logging, and crash recovery.

### C. Amazon RDS (Relational Database Service) — Private Subnet
- **Database Engine**: PostgreSQL 16.
- **Network Isolation**: Deployed in a multi-AZ DB Subnet Group across private subnets.
- **Public Accessibility**: Configured to **No** (`PubliclyAccessible = false`). The database has **no public IP address** and cannot be reached from the public internet.
- **Prisma Client ORM**: Connects directly to the RDS PostgreSQL private endpoint over encrypted TCP port 5432 within the VPC.

---

## 3. Network Security Groups & Firewall Rules

| Security Group | Direction | Protocol | Port | Source / Destination | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`sg-attendance-web`** (EC2) | Inbound | TCP | 80 | `0.0.0.0/0` | Public HTTP Web Traffic |
| **`sg-attendance-web`** (EC2) | Inbound | TCP | 443 | `0.0.0.0/0` | Public HTTPS Web Traffic |
| **`sg-attendance-web`** (EC2) | Inbound | TCP | 22 | Administrator Public IP (`/32`) | Restricted SSH Administration |
| **`sg-attendance-web`** (EC2) | Outbound | ALL | ALL | `0.0.0.0/0` | Package updates & DB access |
| **`sg-attendance-rds`** (RDS) | Inbound | TCP | 5432 | `sg-attendance-web` (EC2 SG) | **PostgreSQL Access ONLY from EC2** |
| **`sg-attendance-rds`** (RDS) | Outbound | ALL | ALL | VPC CIDR | Internal communication |

> **Security Note**: Port 5432 is strictly forbidden from being exposed to `0.0.0.0/0`. Only traffic originating from instances attached to `sg-attendance-web` is accepted by `sg-attendance-rds`.
