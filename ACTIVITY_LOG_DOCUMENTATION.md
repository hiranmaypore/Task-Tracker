# 📋 Activity Log Feature - Complete Documentation

## Overview

The Activity Log system tracks all user actions across the application, providing audit trails, automation triggers, and analytics data.

---

## 🎯 What It Does

### Core Functionality

1. **Automatic Logging** - Tracks all important user actions
2. **Audit Trail** - Complete history of who did what, when
3. **Analytics Integration** - Feeds data to the analytics engine
4. **Automation Triggers** - Powers the automation rules system
5. **User Activity Feed** - Shows recent activities in dashboard

---

## 📊 Tracked Activities

### Activity Actions

- ✅ **CREATED** - When entities are created
- ✅ **UPDATED** - When entities are modified
- ✅ **DELETED** - When entities are removed
- ✅ **ASSIGNED** - When tasks are assigned
- ✅ **COMMENTED** - When comments are added
- ✅ **STATUS_CHANGED** - When task status changes
- ✅ **MEMBER_ADDED** - When project members join
- ✅ **MEMBER_REMOVED** - When members leave
- ✅ **ROLE_CHANGED** - When member roles change

### Entity Types

- **PROJECT** - Project-level activities
- **TASK** - Task-level activities
- **COMMENT** - Comment activities
- **MEMBER** - Team membership activities

---

## 🔌 API Endpoints

### Available Endpoints

#### 1. Get All Activities (Admin Only)

```
GET /activity-log?limit=50
```

Authorization: Admin role required
Returns: All system activities

#### 2. Get My Activities

```
GET /activity-log/me?limit=50
```

Returns: Current user's activities

#### 3. Get Recent Activities (Dashboard Feed)

```
GET /activity-log/recent?limit=20
```

Returns: Activities from user's projects + own activities

#### 4. Get User Activities (Admin Only)

```
GET /activity-log/user/:userId?limit=50
```

Returns: Specific user's activities

#### 5. Get Project Activities

```
GET /activity-log/project/:projectId?limit=50
```

Returns: All activities for a project

#### 6. Get Task Activities

```
GET /activity-log/task/:taskId?limit=50
```

Returns: All activities for a specific task

---

## 💻 Implementation Details

### Database Schema

```prisma
model ActivityLog {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  user_id     String   @db.ObjectId
  action      String   // The action performed
  entity_type String   // PROJECT, TASK, COMMENT, MEMBER
  entity_id   String   @db.ObjectId
  timestamp   DateTime @default(now())

  user User @relation(fields: [user_id], references: [id])
}
```

### Service Methods

#### Core Methods

1. **`log()`** - Generic logging method
2. **`findAll()`** - Get all activities
3. **`findByUser()`** - Get user-specific activities
4. **`findByProject()`** - Get project activities
5. **`findByTask()`** - Get task activities
6. **`getRecentActivities()`** - Get activity feed

#### Helper Methods (Pre-configured)

- `logProjectCreated()`
- `logProjectUpdated()`
- `logProjectDeleted()`
- `logTaskCreated()`
- `logTaskUpdated()`
- `logTaskDeleted()`
- `logTaskStatusChanged()`
- `logTaskAssigned()`
- `logCommentAdded()`
- `logMemberAdded()`
- `logMemberRemoved()`
- `logRoleChanged()`

---

## 🔄 Integration Points

### 1. Automatic Event Creation

Every activity log entry automatically creates an **Event** for analytics:

```typescript
Event {
  type: "TASK_CREATED" | "PROJECT_UPDATED" | etc.
  userId: string
  metadata: object
  createdAt: date
}
```

### 2. Automation Trigger

Events automatically trigger automation rules:

```typescript
// Example: Auto-assign tasks
if (event.type === "TASK_CREATED") {
  automationService.processEvent(event);
}
```

### 3. Analytics Pipeline

Events feed into the analytics system for:

- User activity statistics
- Project health metrics
- Task completion trends
- Team performance analysis

---

## 📝 Usage Examples

### Backend Usage (Services)

```typescript
// In TasksService
await this.activityLogService.logTaskCreated(userId, task.id, task.title);

// In ProjectsService
await this.activityLogService.logMemberAdded(
  currentUserId,
  projectId,
  newMemberId,
  "MEMBER",
);
```

### Frontend Usage

```typescript
// Fetch recent activities for dashboard
const activities = await axios.get("/activity-log/recent?limit=10", {
  headers: { Authorization: `Bearer ${token}` },
});

// Fetch task-specific activities
const taskHistory = await axios.get(`/activity-log/task/${taskId}`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

---

## 🎨 Response Format

```json
{
  "id": "67938d8736958...",
  "user_id": "67938d8736958...",
  "action": "CREATED:{\"title\":\"New Task\"}",
  "entity_type": "TASK",
  "entity_id": "67938e2a36958...",
  "timestamp": "2026-02-04T14:30:45.123Z",
  "user": {
    "id": "67938d8736958...",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://..."
  }
}
```

---

## 🔐 Security & Permissions

### Access Control

- ✅ All endpoints require JWT authentication
- ✅ Admin endpoints protected by RolesGuard
- ✅ Users can only see their own activities (non-admin)
- ✅ Project activities visible to project members

### Data Privacy

- User information included in responses
- Metadata can contain sensitive info (encrypted in production recommended)
- Admin access logged separately

---

## 📈 Current Features in Use

### ✅ Active Integrations

1. **User Profile Updates** - Logged in UsersService
2. **Task Management** - Create, Update, Delete logged
3. **Project Activities** - All project changes tracked
4. **Analytics Dashboard** - Powers admin analytics
5. **Automation System** - Triggers automation rules

### 🔄 Event Flow

```
User Action
    ↓
Activity Log Created
    ↓
Event Created (Analytics)
    ↓
Automation Rules Triggered
    ↓
Notifications Sent (if configured)
```

---

## 🛠️ Maintenance & Cleanup

### Performance Considerations

- Default limit: 50 activities
- Indexed by timestamp (desc)
- Includes user data (single join)

### Future Enhancements (Optional)

- [ ] Activity log archiving (6 months+)
- [ ] Advanced filtering (date range, action type)
- [ ] Export functionality (CSV/JSON)
- [ ] Real-time activity stream (WebSocket)
- [ ] Activity log search

---

## ✅ Status: FULLY OPERATIONAL

The Activity Log feature is **production-ready** and actively logging all user actions across:

- User authentication & profile changes
- Project creation & updates
- Task creation, updates & status changes
- Comments & team activities
- Analytics & automation triggers

All logged activities are:

- ✅ Persisted to database
- ✅ Available via REST API
- ✅ Feeding analytics engine
- ✅ Triggering automation rules
- ✅ Secured with JWT + RBAC

---

**Last Updated:** 2026-02-04
**Version:** 1.0
**Status:** Production
