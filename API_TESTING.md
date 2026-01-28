# API Testing Guide - To-Do List Backend

## Base URL

```
http://localhost:3000
```

---

## 1. Authentication

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "SecurePass123"
}
```

**Expected Response:**

```json
{
  "id": "...",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "role": "USER",
  "created_at": "..."
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "SecurePass123"
}
```

**Expected Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Important:** Copy the `access_token` and use it in all subsequent requests as:

```
Authorization: Bearer <access_token>
```

---

## 2. Projects

### Create Project

```http
POST /projects
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "name": "Website Redesign"
}
```

### Get All Projects

```http
GET /projects
Authorization: Bearer <your_token>
```

### Get Project by ID

```http
GET /projects/:id
Authorization: Bearer <your_token>
```

### Update Project

```http
PATCH /projects/:id
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "name": "Website Redesign - Phase 2"
}
```

### Delete Project

```http
DELETE /projects/:id
Authorization: Bearer <your_token>
```

---

## 3. Tasks

### Create Task

```http
POST /tasks
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "title": "Design homepage mockup",
  "description": "Create a modern, responsive homepage design",
  "project_id": "<project_id>",
  "status": "TODO",
  "priority": "HIGH",
  "due_date": "2026-02-15T10:00:00Z"
}
```

**Status Options:** `TODO`, `IN_PROGRESS`, `DONE`, `BLOCKED`
**Priority Options:** `LOW`, `MEDIUM`, `HIGH`

### Get All Tasks (with filters)

```http
# Get all tasks
GET /tasks
Authorization: Bearer <your_token>

# Filter by project
GET /tasks?project_id=<project_id>
Authorization: Bearer <your_token>

# Filter by status
GET /tasks?status=TODO
Authorization: Bearer <your_token>

# Filter by priority
GET /tasks?priority=HIGH
Authorization: Bearer <your_token>

# Search in title/description
GET /tasks?search=homepage
Authorization: Bearer <your_token>

# Combine filters
GET /tasks?project_id=<project_id>&status=IN_PROGRESS&priority=HIGH
Authorization: Bearer <your_token>
```

### Create Subtask

```http
POST /tasks
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "title": "Choose color palette",
  "description": "Select primary and secondary colors",
  "project_id": "<project_id>",
  "parent_task_id": "<parent_task_id>",
  "status": "TODO",
  "priority": "MEDIUM"
}
```

### Get Task by ID

```http
GET /tasks/:id
Authorization: Bearer <your_token>
```

### Update Task

```http
PATCH /tasks/:id
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

### Delete Task

```http
DELETE /tasks/:id
Authorization: Bearer <your_token>
```

---

## 4. Comments

### Create Comment

```http
POST /comments
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "task_id": "<task_id>",
  "content": "I've started working on this. Should be done by tomorrow!"
}
```

### Get All Comments for a Task

```http
GET /comments/task/:taskId
Authorization: Bearer <your_token>
```

### Get Comment by ID

```http
GET /comments/:id
Authorization: Bearer <your_token>
```

### Update Comment (own comments only)

```http
PATCH /comments/:id
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "content": "Updated: I've completed the initial draft!"
}
```

### Delete Comment (own comments only)

```http
DELETE /comments/:id
Authorization: Bearer <your_token>
```

---

## 5. Users

### Get All Users

```http
GET /users
Authorization: Bearer <your_token>
```

### Get User by ID

```http
GET /users/:id
Authorization: Bearer <your_token>
```

---

## Testing Workflow Example

### Step 1: Create User and Login

1. Register: `POST /auth/register`
2. Login: `POST /auth/login`
3. Save the `access_token`

### Step 2: Create a Project

1. Create project: `POST /projects`
2. Save the `project_id`

### Step 3: Create Tasks

1. Create main task: `POST /tasks` (with `project_id`)
2. Save the `task_id`
3. Create subtask: `POST /tasks` (with `project_id` and `parent_task_id`)

### Step 4: Add Comments

1. Add comment: `POST /comments` (with `task_id`)
2. Get all comments: `GET /comments/task/:taskId`

### Step 5: Filter and Search

1. Get all TODO tasks: `GET /tasks?status=TODO`
2. Get high priority tasks: `GET /tasks?priority=HIGH`
3. Search tasks: `GET /tasks?search=design`

---

## Common Error Responses

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Solution:** Check if you're sending the Bearer token correctly.

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Task not found"
}
```

**Solution:** Verify the ID exists in the database.

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["title should not be empty"],
  "error": "Bad Request"
}
```

**Solution:** Check the request body matches the DTO requirements.

---

## Tools for Testing

### VS Code Extensions:

- **Thunder Client** (Recommended)
- **REST Client**

### Standalone Tools:

- **Postman**
- **Insomnia**
- **cURL** (command line)

---

## cURL Examples

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"pass123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"pass123"}'
```

### Create Project (with token)

```bash
curl -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"My Project"}'
```

### Get Tasks with Filters

```bash
curl -X GET "http://localhost:3000/tasks?status=TODO&priority=HIGH" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
