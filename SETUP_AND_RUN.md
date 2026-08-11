# Project Transfer & Setup Guide for Personal Laptop 🚀

This document provides complete step-by-step instructions to setup, configure, and run the **Vasanthi Designers** project on your personal laptop.

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Environment Configuration](#2-environment-configuration)
3. [Database Setup](#3-database-setup)
4. [Installation & Database Initialization](#4-installation--database-initialization)
5. [Backend Execution](#5-backend-execution)
6. [Frontend Execution](#6-frontend-execution)
7. [Accessing Application Endpoints](#7-accessing-application-endpoints)
8. [Troubleshooting & Common Fixes](#8-troubleshooting--common-fixes)

---

## 1. Prerequisites

Before starting, ensure your personal laptop has the following installed:

- **Node.js**: `v20.x` or `v24.x` (download from [nodejs.org](https://nodejs.org/))
- **npm**: `v10+` (included with Node.js)
- **Database**: Either **Docker Desktop** (recommended) OR **PostgreSQL 15+** installed locally.
- **Antigravity IDE**: (or VS Code) to manage and run the project.

---

## 2. Environment Configuration

### A. Backend `.env` File
Create or verify `backend/.env` exists with the following configuration:

```env
# Application
NODE_ENV=development
PORT=4000
HOSTNAME=localhost

# Database (PostgreSQL Connection String)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public

# Redis & Features
ENABLE_REDIS=false
ENABLE_BULLMQ=false
ENABLE_SWAGGER=true
ENABLE_LOGGER=true

# JWT Secrets
JWT_SECRET=dev-secret-change-in-production-at-least-16-chars
JWT_EXPIRES_IN=3600
JWT_REMEMBER_ME_EXPIRES_IN=2592000
JWT_REFRESH_TOKEN_EXPIRY_DAYS=7
JWT_ISSUER=vasanthi-designers

# CORS & Rate Limiting
CORS_ORIGIN=*
THROTTLE_TTL=60
THROTTLE_LIMIT=1000

# Storage
STORAGE_PROVIDER=local
STORAGE_ROOT=./storage
STORAGE_PUBLIC_URL=/storage

# Payment & AI Mock Configs
PAYMENT_PROVIDER=dummy
RAG_ENABLED=true
```

### B. Frontend `.env.local` File
Create or verify `frontend/.env.local` exists with the following contents:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_HEALTH_URL=http://localhost:4000/health
```

---

## 3. Database Setup

### Option 1: Using Docker (Recommended)
If using Docker Desktop:
```bash
cd backend
docker-compose up -d postgres
```

### Option 2: Using Local PostgreSQL Service
1. Open pgAdmin or SQL shell (`psql`).
2. Create a database named `vasanthi_designers`:
   ```sql
   CREATE DATABASE vasanthi_designers;
   ```
3. Update `DATABASE_URL` in `backend/.env` with your local database credentials:
   `postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/vasanthi_designers?schema=public`

---

## 4. Installation & Database Initialization

Because this project utilizes **npm workspaces**, dependencies should be installed at the root level first to prevent hoisting conflicts.

1. **Install Workspace Dependencies (Root):**
   ```bash
   npm install
   ```

2. **Generate Prisma Client (Backend):**
   ```bash
   cd backend
   npx prisma generate
   ```

3. **Sync Database Schema:**
   - Standard Sync / Migration:
     ```bash
     npx prisma db push
     ```
   - If migrating schema on local dev with consent prompt:
     ```powershell
     $env:PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes"; npx prisma db push --accept-data-loss
     ```

4. **Seed Database:**
   ```bash
   npx prisma db seed
   ```

---

## 5. Backend Execution

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Start NestJS Development Server:**
   ```bash
   npm run start:dev
   ```
   *The backend will start on `http://localhost:4000`.*

---

## 6. Frontend Execution

1. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

2. **Start Next.js Development Server:**
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000`.*

---

## 7. Accessing Application Endpoints

Once both servers are running:

- 🌐 **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- 🔌 **Backend API Base**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- 📖 **Swagger API Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- ❤️ **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 8. Troubleshooting & Common Fixes

### ⚠️ Port 4000 or 3000 Already in Use
- Change `PORT=4000` in `backend/.env` to another port (e.g. `4001`).
- Update `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` (`http://localhost:4001/api/v1`).

### ⚠️ Database Migration / Missing Column Error
- Ensure your PostgreSQL service is active.
- Run `$env:PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes"; npx prisma db push --accept-data-loss` in `backend/`.
- Re-run `npx prisma db seed`.

### ⚠️ Workspace / Dependency Lock Cleanup
If encountering module build or lock errors:
```powershell
# Remove generated folders
Remove-Item -Recurse -Force node_modules, .next, dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force backend/node_modules, backend/dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force frontend/node_modules, frontend/.next -ErrorAction SilentlyContinue

# Re-install at root
npm install
```
