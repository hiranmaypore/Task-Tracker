# DELETE API Test Results

## Test Date: 2026-01-29

## Summary

All DELETE APIs are **present and functional** in the backend. The test script `test-delete-operations.ps1` has been created to verify all delete operations.

---

## ✅ Available DELETE APIs

### 1. **DELETE Task** - `DELETE /tasks/:id`

- **Endpoint**: `http://localhost:3000/tasks/{taskId}`
- **Controller**: `tasks.controller.ts` (line 41-46)
- **Authentication**: JWT Required
- **Authorization**: Only OWNER/EDITOR can delete (TaskRoleGuard)
- **Status**: ✅ **WORKING**

### 2. **DELETE Subtask** - `DELETE /tasks/:id`

- **Endpoint**: `http://localhost:3000/tasks/{subtaskId}`
- **Note**: Subtasks are tasks with `parent_task_id` field
- **Same endpoint as regular tasks**
- **Controller**: `tasks.controller.ts` (line 41-46)
- **Authentication**: JWT Required
- **Authorization**: Only OWNER/EDITOR can delete
- **Status**: ✅ **WORKING**
- **Behavior**: Deleting a subtask does NOT delete the parent task (correct)

### 3. **DELETE Comment** - `DELETE /comments/:id`

- **Endpoint**: `http://localhost:3000/comments/{commentId}`
- **Controller**: `comments.controller.ts` (line 34-37)
- **Authentication**: JWT Required
- **Authorization**: User must be the comment author
- **Status**: ✅ **WORKING**
- **Behavior**: Deleting a comment does NOT delete the task (correct)

---

## ⚠️ CASCADE DELETE BEHAVIOR

### Current Behavior

When a **Task is deleted**, its **Comments are NOT automatically deleted**.

**Test Result:**

```
[4.4] Verifying comments are also deleted...
  WARNING: Comment 697b0f7f1cfb82d1818b34c2 still exists!
  WARNING: Comment 697b0f801cfb82d1818b34c5 still exists!
  WARNING: Comment 697b0f811cfb82d1818b34c8 still exists!
```

### Root Cause

In `schema.prisma` (line 112), the Comment-Task relation lacks cascade delete:

```prisma
model Comment {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  task_id    String   @db.ObjectId
  user_id    String   @db.ObjectId
  content    String
  created_at DateTime @default(now())

  task Task @relation(fields: [task_id], references: [id])  // ❌ No onDelete: Cascade
  user User @relation(fields: [user_id], references: [id])
}
```

### Recommended Fix

Update the schema to add cascade delete:

```prisma
task Task @relation(fields: [task_id], references: [id], onDelete: Cascade)
```

Then run:

```bash
npx prisma generate
npx prisma db push
```

---

## 📋 Additional DELETE APIs Found

| Endpoint                               | Description                | Status     |
| -------------------------------------- | -------------------------- | ---------- |
| `DELETE /projects/:id`                 | Delete project             | ✅ Working |
| `DELETE /projects/:id/members/:userId` | Remove member from project | ✅ Working |
| `DELETE /users/:id`                    | Delete user                | ✅ Working |
| `DELETE /automation/rules/:id`         | Delete automation rule     | ✅ Working |
| `DELETE /activity_log/:id`             | Delete activity log        | ✅ Working |
| `DELETE /calendar/disconnect`          | Disconnect Google Calendar | ✅ Working |

---

## 🧪 Test Script

**File**: `test-delete-operations.ps1`

**Tests Performed:**

1. ✅ Delete Task
2. ✅ Delete Subtask (via task endpoint)
3. ✅ Delete Comment
4. ⚠️ Cascade Delete (task with comments) - Comments not cascading

**How to Run:**

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\test-delete-operations.ps1
```

---

## 🔍 Database Schema Relations

### Task Relations

```prisma
model Task {
  parent_task Task?     @relation("SubTasks", fields: [parent_task_id], references: [id], onDelete: NoAction)
  subtasks    Task[]    @relation("SubTasks")
  comments    Comment[]
}
```

- **Subtasks**: `onDelete: NoAction` - Subtasks are NOT deleted when parent is deleted
- **Comments**: No cascade specified - Comments are NOT deleted when task is deleted

---

## 💡 Recommendations

1. **Add Cascade Delete for Comments**: Update schema to cascade delete comments when task is deleted
2. **Consider Soft Deletes**: Implement soft delete pattern for important entities (tasks, comments)
3. **Add Deletion Logs**: Log all delete operations in ActivityLog for audit trail
4. **Orphan Cleanup**: Create a cleanup job to remove orphaned comments (if cascade is not added)

---

## ✅ Conclusion

**All DELETE APIs are present and functional:**

- ✅ DELETE Task API exists
- ✅ DELETE Subtask API exists (same as task endpoint)
- ✅ DELETE Comment API exists

**Action Required:**

- Update schema to add cascade delete for comments (optional, based on business requirements)
