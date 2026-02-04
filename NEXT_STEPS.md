# Next Steps - To-Do List Backend

## 🎯 Immediate Actions

### 1. Test the API ✅ **DO THIS FIRST**

The backend is currently running. Test all the endpoints to ensure everything works:

1. **Install a REST client** (if you don't have one):
   - Thunder Client (VS Code extension) - Recommended
   - Postman
   - Or use cURL

2. **Follow the testing guide:**
   - Open `API_TESTING.md` for detailed examples
   - Start with authentication (register → login)
   - Test projects, tasks, and comments
   - Try the filtering features on tasks

3. **Verify the database:**
   - Check MongoDB to see if data is being saved
   - Verify relationships between models

---

## 2. Implement Activity Logging 📝

The ActivityLog module exists but needs implementation. Here's what to do:

### Create Activity Log Service

```typescript
// src/activity_log/activity_log.service.ts
async logActivity(userId: string, action: string, entityType: string, entityId: string) {
  return this.prisma.activityLog.create({
    data: {
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
    },
  });
}
```

### Create an Interceptor

Create a global interceptor to automatically log all CRUD operations:

- Log when tasks are created/updated/deleted
- Log when projects are created/updated/deleted
- Log when comments are added/edited/deleted

### Add to Controllers

Inject the ActivityLogService into each controller and call it after successful operations.

---

## 3. Add Project Member Management 👥

Currently, only the owner is added as a member. Add endpoints to:

### New Endpoints Needed:

```
POST   /projects/:id/members        - Add member to project
DELETE /projects/:id/members/:userId - Remove member from project
PATCH  /projects/:id/members/:userId - Update member role
GET    /projects/:id/members         - Get all project members
```

### Implementation Steps:

1. Create `AddMemberDto` with `user_id` and `role` fields
2. Create `UpdateMemberRoleDto` with `role` field
3. Add methods to `ProjectsService`
4. Add routes to `ProjectsController`
5. Validate that only OWNER can add/remove members

---

## 4. Enhance Authorization 🔒

Add proper permission checks:

### Create Guards:

1. **ProjectOwnerGuard** - Only project owner can delete/update project
2. **ProjectMemberGuard** - Only project members can view/create tasks
3. **TaskAssigneeGuard** - Only assignee can update task status

### Implementation:

```typescript
// Example: project-member.guard.ts
@Injectable()
export class ProjectMemberGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.userId;
    const projectId = request.params.id || request.body.project_id;

    // Check if user is a member of the project
    const member = await this.prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: userId,
      },
    });

    return !!member;
  }
}
```

---

## 5. Add Task Statistics Endpoint 📊

Create an endpoint to get task statistics for a project:

```
GET /projects/:id/stats
```

**Response:**

```json
{
  "total_tasks": 25,
  "by_status": {
    "TODO": 10,
    "IN_PROGRESS": 8,
    "DONE": 6,
    "BLOCKED": 1
  },
  "by_priority": {
    "LOW": 5,
    "MEDIUM": 12,
    "HIGH": 8
  },
  "overdue_tasks": 3,
  "completed_this_week": 4
}
```

---

## 6. Add Due Date Queries 📅

Enhance task filtering with date-based queries:

### Add to FilterTaskDto:

```typescript
@IsOptional()
@IsBoolean()
overdue?: boolean;

@IsOptional()
@IsString()
due_before?: string; // ISO date string

@IsOptional()
@IsString()
due_after?: string; // ISO date string
```

### Update TasksService:

```typescript
if (filterDto?.overdue) {
  where.due_date = { lt: new Date() };
  where.status = { not: "DONE" };
}

if (filterDto?.due_before) {
  where.due_date = { lte: new Date(filterDto.due_before) };
}
```

---

## 7. Implement Soft Delete 🗑️

Instead of permanently deleting records, add a `deleted_at` field:

### Update Prisma Schema:

```prisma
model Task {
  // ... existing fields
  deleted_at DateTime?
}
```

### Update Service Methods:

```typescript
// Instead of delete
remove(id: string) {
  return this.prisma.task.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
}

// Update findAll to exclude deleted
findAll(userId: string, filterDto?: FilterTaskDto) {
  const where = {
    deleted_at: null, // Only get non-deleted tasks
    // ... rest of the filters
  };
}
```

---

## 8. Add Validation Middleware 🛡️

Install and configure class-validator globally:

```bash
npm install class-validator class-transformer
```

### Update main.ts:

```typescript
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  await app.listen(3000);
}
```

---

## 9. Add CORS Configuration 🌐

If you plan to build a frontend, enable CORS:

### Update main.ts:

```typescript
app.enableCors({
  origin: "http://localhost:5173", // Your frontend URL
  credentials: true,
});
```

---

## 10. Environment Variables Check ✅

Ensure your `.env` file has all required variables:

```env
DATABASE_URL="mongodb://..."
JWT_SECRET="your-super-secret-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
PORT=3000
```

---

## 🚀 Recommended Order of Implementation

1. ✅ **Test the current API** (Completed)
2. ✅ **Implementing Activity Logging** (Completed)
3. ✅ **Add Task Statistics** (Completed)
4. ✅ **Add Notifications System** (Completed)
5. ✅ **Google Calendar Integration** (Completed)
6. ✅ **Frontend: Project Member Management** (Completed)
   - UI to invite members by email implemented
   - Member list and role management implemented
7. ✅ **Frontend: Task Assignment** (Completed)
   - Assignee field added to Create/Edit Task forms
   - Assignee avatar displayed on Task Cards
8. 🔄 **Implement Soft Delete** (Next Priority)
9. 🔄 **Enhance Authorization** (Backlog)

---

## 📚 Additional Resources

### Documentation to Create:

- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Database Schema Diagram
- [ ] Architecture Overview
- [ ] Deployment Guide

### Code Quality:

- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Set up ESLint rules
- [ ] Add Prettier configuration
- [ ] Set up CI/CD pipeline

---

## 🎉 What You've Accomplished So Far

✅ Complete authentication system
✅ Project management with ownership
✅ Task management with subtasks
✅ Advanced task filtering
✅ Comment system
✅ Proper database schema
✅ JWT security
✅ Input validation
✅ Error handling

**You're about 70% done with the backend!** 🎊

The remaining 30% is mostly enhancements, testing, and polish.
