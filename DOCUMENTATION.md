# 🎯 TaskTracker - Full-Stack Documentation

TaskTracker is a professional, enterprise-grade task management system built with a focus on scalability, real-time collaboration, and automation.

---

## 🛠️ Technical Stack

### **Backend (NestJS)**

- **Framework**: NestJS (TypeScript)
- **Database**: MongoDB with Prisma ORM
- **Authentication**: Passport.js (JWT & Google OAuth2)
- **Asynchronous Tasks**: BullMQ with Redis
- **Real-time**: Socket.io for live updates
- **Caching**: Cache-Manager with Redis
- **Security**: Helmet, Rate Limiting, RBAC

### **Frontend (React)**

- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 (Modern Retro Aesthetic)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Components**: Shadcn UI (Customized)
- **Avatars**: DiceBear Pixel Art API

---

## 🏗️ System Architecture

### **Data Flow**

1. **Request**: Frontend sends Request (REST/WebSocket).
2. **Middleware**: Throttler (Rate Limit) -> Helmet (Security) -> ValidationPipe.
3. **Auth**: JWT Guard validates Token or Google OAuth flow.
4. **Service**: Core logic executed.
5. **Persistence**: Prisma interacts with MongoDB.
6. **Side Effects**: BullMQ queues jobs (Email, Automation, Reminders).
7. **Broadcast**: Socket.io emits real-time updates to relevant project rooms.

### **Entity-Relationship Model**

- **User**: Multi-role support (USER, ADMIN).
- **Project**: Collaborative workspace with RBAC (OWNER, EDITOR, VIEWER).
- **Task**: Main entity with status tracking, priority, due dates, and assignments.
- **ActivityLog/Event**: Stores every action for audit trails and automation triggers.
- **AutomationRule**: If-This-Then-That engine for user workflow simplification.

---

## ✨ Core Features

### **1. Real-Time Collaboration**

- WebSocket rooms for each project.
- Instant task creation/updates across all team members.
- Live notifications for assignments and mentions.

### **2. Automation Engine**

- Event-driven rules (e.g., "When task priority is High, send an email").
- Condition matching based on metadata fields.
- Background processing via BullMQ ensures no performance impact on the main API.

### **3. Analytics Dashboard**

- High-performance MongoDB aggregation pipelines for Daily Active Users (DAU).
- Task completion velocity and team performance metrics.
- Redis caching for expensive analytics queries.

### **4. Google Calendar Integration**

- Full OAuth2 flow with secure token management.
- Two-way sync: App tasks appear as Google Calendar events.
- Color-coded events based on priority.

### **5. Modern Retro UI**

- Bold visuals inspired by "FlytBase" and "Lovable" designs.
- Dynamic pixel-art avatars for a premium, engaging feel.
- Smooth layout transitions and micro-animations for high UX satisfaction.

---

## 🚀 Deployment Guide (Render)

### **Backend Setup**

- **Environment Variables**:
  - `DATABASE_URL`: MongoDB connection string.
  - `REDIS_URL`: Upstash or managed Redis URL.
  - `FRONTEND_URL`: URL of the deployed React app.
  - `GOOGLE_CLIENT_ID/SECRET`: Google Cloud Console credentials.
- **Build Command**: `pm install && npx prisma generate && npm run build`
- **Start Command**: `npm run start:prod`

### **Frontend Setup**

- **Environment Variables**:
  - `VITE_API_BASE_URL`: URL of the deployed NestJS backend.
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

---

## 🔐 Security Principles

- **JWT**: Stateless authentication with access and refresh tokens.
- **RBAC**: Custom decorators and guards enforce project-level permissions.
- **CORS**: Strict origin checking for production safety.
- **Password Hashing**: Bcrypt with salt factor 10.
