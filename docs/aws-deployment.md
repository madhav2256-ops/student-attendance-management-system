# AWS Production Deployment Guide — Amazon EC2 & Amazon RDS

This document provides a comprehensive, step-by-step deployment procedure for deploying the **Cloud-Based Student Attendance Management System** to Amazon Web Services (AWS).

---

## 1. AWS Architecture & Prerequisites

### Architecture Topology
- **Region**: `ap-south-1` (Mumbai) or your chosen regional endpoint.
- **VPC CIDR**: `10.0.0.0/16`.
- **Public Subnet**: `10.0.1.0/24` (Hosts EC2 instance with Internet Gateway route).
- **Private Subnet 1**: `10.0.10.0/24` (RDS PostgreSQL Availability Zone A).
- **Private Subnet 2**: `10.0.11.0/24` (RDS PostgreSQL Availability Zone B).
- **Compute**: Amazon EC2 (Ubuntu 24.04 LTS, `t3.small` or `t4g.small`).
- **Database**: Amazon RDS for PostgreSQL 16 (`db.t4g.micro` or `db.t3.micro`).

---

## 2. Step 1: Network & Security Group Provisioning

### A. Create VPC and Subnets
1. Open the **AWS Management Console** -> **VPC** -> **Create VPC**.
2. Select **VPC and more**:
   - **Name tag**: `attendance-vpc`
   - **IPv4 CIDR block**: `10.0.0.0/16`
   - **Number of Availability Zones (AZs)**: `2`
   - **Number of public subnets**: `1` (`10.0.1.0/24`)
   - **Number of private subnets**: `2` (`10.0.10.0/24` and `10.0.11.0/24`)
   - **NAT Gateways**: None (to prevent recurring billable charges for student projects).
   - **VPC Endpoints**: None.
3. Click **Create VPC**.

### B. Create Security Groups
Create two distinct security groups in the VPC:

#### 1. EC2 Security Group: `sg-attendance-web`
- **Inbound Rules**:
  - `HTTP` (TCP 80) -> Source: `0.0.0.0/0` (Anywhere)
  - `HTTPS` (TCP 443) -> Source: `0.0.0.0/0` (Anywhere)
  - `SSH` (TCP 22) -> Source: `My IP` (Restricts SSH to your current public IP)
- **Outbound Rules**:
  - `All traffic` -> Destination: `0.0.0.0/0`

#### 2. RDS Security Group: `sg-attendance-rds`
- **Inbound Rules**:
  - `PostgreSQL` (TCP 5432) -> Source: Select `sg-attendance-web` (Only EC2 SG)
- **Outbound Rules**:
  - `All traffic` -> Destination: `0.0.0.0/0`

> ⚠️ **CRITICAL SECURITY RULE**: Never allow PostgreSQL port 5432 from `0.0.0.0/0`. Only authorize traffic originating from `sg-attendance-web`.

---

## 3. Step 2: Provisioning Amazon RDS PostgreSQL

1. Open **Amazon RDS** -> **Subnet Groups** -> **Create DB Subnet Group**:
   - **Name**: `attendance-rds-subnet-group`
   - **VPC**: `attendance-vpc`
   - **Subnets**: Select the two private subnets created earlier.
2. Open **RDS** -> **Databases** -> **Create Database**:
   - **Engine type**: `PostgreSQL`
   - **Engine Version**: `PostgreSQL 16.x`
   - **Templates**: `Free tier` (or `Dev/Test`)
   - **DB instance identifier**: `attendance-postgres-db`
   - **Master username**: `dbadmin`
   - **Master password**: *[Choose a strong 24-character password]*
   - **Instance configuration**: `db.t4g.micro` or `db.t3.micro`
   - **Storage**: General Purpose SSD (`gp3`), 20 GiB (disable storage autoscaling)
   - **Virtual Private Cloud (VPC)**: `attendance-vpc`
   - **DB Subnet Group**: `attendance-rds-subnet-group`
   - **Public access**: **No**
   - **VPC security group**: Choose `sg-attendance-rds` (remove default SG)
   - **Initial database name**: `attendance_db`
   - **Backup**: Enable automated backups (1-day retention for academic projects)
   - **Encryption**: Enable storage encryption
3. Click **Create database**.
4. Once created, copy the **Endpoint** (e.g., `attendance-postgres-db.cz9xxxx.ap-south-1.rds.amazonaws.com`).

---

## 4. Step 3: Launching the Amazon EC2 Web Server

1. Open **Amazon EC2** -> **Instances** -> **Launch Instances**:
   - **Name**: `attendance-web-server`
   - **AMI**: `Ubuntu Server 24.04 LTS (HVM), SSD Volume Type` (64-bit x86 or ARM64)
   - **Instance type**: `t3.small` (or `t4g.small` for ARM)
   - **Key pair**: Create or select an existing `.pem` key pair
   - **Network settings**:
     - **VPC**: `attendance-vpc`
     - **Subnet**: Select the Public Subnet (`10.0.1.0/24`)
     - **Auto-assign Public IP**: **Enable**
     - **Select existing security group**: `sg-attendance-web`
   - **Storage**: 1x 25 GiB General Purpose SSD (`gp3`)
2. Click **Launch Instance**.
3. Note the **Public IPv4 address** assigned to the instance.

---

## 5. Step 4: Connecting and Configuring EC2 Server

### A. Connect via SSH (Local Machine Command)
```bash
# On your local machine (Terminal or PowerShell)
chmod 400 attendance-key.pem # On Linux/macOS
ssh -i "attendance-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

### B. System Update & Dependencies (Commands on EC2)
```bash
# Update Ubuntu packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git certbot python3-certbot-nginx

# Verify versions
node -v
npm -v

# Install pnpm globally
sudo npm install -g pnpm@latest
pnpm -v
```

---

## 6. Step 5: Deploying Application Code & Environment

### A. Clone Repository to `/var/www/attendance` (Commands on EC2)
```bash
sudo mkdir -p /var/www/attendance
sudo chown -R ubuntu:ubuntu /var/www/attendance

# Clone repository
git clone https://github.com/madhav2256-ops/student-attendance-management-system.git /var/www/attendance
cd /var/www/attendance

# Install project dependencies
pnpm install
```

### B. Configure Production Environment Variables
Create the production `.env` file on EC2:
```bash
nano /var/www/attendance/.env
```
Paste your production values:
```env
# Production Amazon RDS PostgreSQL Connection
DATABASE_URL="postgresql://dbadmin:<YOUR_RDS_PASSWORD>@<YOUR_RDS_ENDPOINT>:5432/attendance_db?schema=public&sslmode=require"

# Generate a 32+ character random secret: openssl rand -base64 32
AUTH_SECRET="<YOUR_STRONG_PRODUCTION_AUTH_SECRET_MIN_32_CHARS>"

# Application URL (Use your Elastic IP or Domain)
APP_URL="http://<EC2-PUBLIC-IP>"

# Initial Administrator Seed Credentials
SEED_ADMIN_EMAIL="admin@attendance.edu"
SEED_ADMIN_PASSWORD="<STRONG_ADMIN_PASSWORD>"
```
Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`). Secure the file permissions:
```bash
chmod 600 /var/www/attendance/.env
```

---

## 7. Step 6: Database Migration & Production Build

### A. Apply Prisma Migrations & Seed Data (Commands on EC2)
```bash
cd /var/www/attendance

# Push schema and apply versioned migrations to Amazon RDS
pnpm prisma migrate deploy

# Seed demonstration and administrative data into Amazon RDS
pnpm db:seed
```

### B. Build Next.js Production Bundle
```bash
pnpm build
```

---

## 8. Step 7: Configuring systemd Service

Configure `systemd` to keep the application running continuously in the background and auto-restart across reboots:

```bash
# Copy systemd unit file
sudo cp /var/www/attendance/deployment/systemd/attendance.service /etc/systemd/system/

# Reload systemd daemon
sudo systemctl daemon-reload

# Enable and start attendance service
sudo systemctl enable attendance
sudo systemctl start attendance

# Check service status
sudo systemctl status attendance
```

---

## 9. Step 8: Configuring Nginx Reverse Proxy

1. Deploy the Nginx site configuration:
```bash
sudo cp /var/www/attendance/deployment/nginx/nginx.conf /etc/nginx/sites-available/attendance
sudo ln -sf /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

2. Test the health check endpoint:
```bash
curl http://localhost/api/health
```
Expected output:
```json
{"status":"healthy","database":"connected","responseTimeMs":12,"timestamp":"...","service":"student-attendance-system"}
```

---

## 10. Step 9: Configuring HTTPS with Let's Encrypt (Optional / Domain)

If you have a domain pointed to your EC2 Public IP:
```bash
sudo certbot --nginx -d attendance.yourdomain.com
```
Certbot automatically installs the SSL/TLS certificate and schedules automatic renewal.

---

## 11. Step 10: How to Verify RDS Database Connectivity

To prove during your academic viva that the application is running against the actual **Amazon RDS PostgreSQL** instance:

1. **Verify RDS Endpoint**:
   Inspect the environment variable on EC2:
   ```bash
   grep DATABASE_URL /var/www/attendance/.env
   ```
   Confirm that the host is `<instance-id>.<region>.rds.amazonaws.com` rather than `localhost`.
2. **Execute Live Query via RDS Command Line (from EC2)**:
   ```bash
   sudo apt install -y postgresql-client
   psql "postgresql://dbadmin:<PASSWORD>@<RDS_ENDPOINT>:5432/attendance_db?sslmode=require" -c "SELECT email, role, \"createdAt\" FROM \"User\";"
   ```
3. **Inspect Application Health Endpoint**:
   Navigate to `http://<EC2-PUBLIC-IP>/api/health` in your browser. The response shows `"database": "connected"` with actual round-trip latency inside the VPC.

---

## 12. Step 11: AWS Cost Control & Resource Cleanup

To avoid unexpected charges after the project demonstration is complete:

1. **Delete EC2 Instance**:
   - Open **EC2 Console** -> **Instances** -> Select `attendance-web-server` -> **Instance State** -> **Terminate Instance**.
2. **Delete Amazon RDS Database**:
   - Open **RDS Console** -> **Databases** -> Select `attendance-postgres-db` -> **Actions** -> **Delete**.
   - Uncheck "Create final snapshot" and acknowledge deletion.
3. **Release Elastic IP**:
   - Open **EC2 Console** -> **Network & Security** -> **Elastic IPs** -> Select IP -> **Release Elastic IP addresses**.
4. **Delete VPC**:
   - Open **VPC Console** -> Select `attendance-vpc` -> **Actions** -> **Delete VPC**.

