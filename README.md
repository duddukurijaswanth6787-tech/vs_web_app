# Vasanthi Designers - Enterprise E-commerce Workspace

An enterprise-grade Women's Fashion E-commerce Platform workspace. 

This repository contains the full monorepo layout, separated into clean, modular directory blocks.

---

## Workspace Layout

- **[backend/](file:///C:/Users/jashwanth/Downloads/Demo_09/backend)**: NestJS TypeScript API service (configured with PostgreSQL, Redis, BullMQ, and Swagger).
- **[frontend/](file:///C:/Users/jashwanth/Downloads/Demo_09/frontend)**: Next.js Client layout placeholder structure.
- **[docs/](file:///C:/Users/jashwanth/Downloads/Demo_09/docs)**: System architectural diagrams, API manuals, and business flow specifications.
- **[database/](file:///C:/Users/jashwanth/Downloads/Demo_09/database)**: PostgreSQL schemas, SQL migrations, backups, and query optimization scripts.
- **[postman/](file:///C:/Users/jashwanth/Downloads/Demo_09/postman)**: Exported Postman collections and environment files for rapid API testing.
- **[design/](file:///C:/Users/jashwanth/Downloads/Demo_09/design)**: UX/UI mockups, design systems specifications, visual asset bundles, and layout designs.
- **[scripts/](file:///C:/Users/jashwanth/Downloads/Demo_09/scripts)**: DevOps automation scripts, Docker management commands, and database backup schedulers.

---

## Getting Started

> 📌 **Personal Laptop Setup Guide**: For step-by-step instructions on setting up and running this project on a personal laptop, please see [SETUP_AND_RUN.md](file:///c:/Users/jashwanth/Downloads/demo_vs_update_13_07/SETUP_AND_RUN.md).

### Quick Start: Backend APIs
To run the backend server in development mode:
```bash
cd backend
npm run start:dev
```
Access the Swagger documentation at `http://localhost:3000/api/docs`.

### Database & Containers
Launch the PostgreSQL and Redis containers:
```bash
cd backend
docker-compose up -d
```
