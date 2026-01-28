# API Documentation

Base URL: `http://localhost:3000`

## 1. App

| Method | Path | Description                | Access |
| :----- | :--- | :------------------------- | :----- |
| `GET`  | `/`  | Health check / Hello World | Public |

## 2. Authentication (`/auth`)

| Method | Path             | Description         | Access |
| :----- | :--------------- | :------------------ | :----- |
| `POST` | `/auth/register` | Register a new user | Public |
| `POST` | `/auth/login`    | Login user          | Public |

## 3. Users (`/users`)

| Method   | Path         | Description                    | Access             |
| :------- | :----------- | :----------------------------- | :----------------- |
| `POST`   | `/users`     | Create a user (Admin/Internal) | Public (currently) |
| `GET`    | `/users`     | Get all users                  | Public (currently) |
| `GET`    | `/users/:id` | Get user details               | Public (currently) |
| `PATCH`  | `/users/:id` | Update user details            | Public (currently) |
| `DELETE` | `/users/:id` | Delete user                    | Public (currently) |

## 4. Projects (`/projects`)

_Protected: Requires JWT Token_

| Method   | Path                            | Description                       | Access Control       |
| :------- | :------------------------------ | :-------------------------------- | :------------------- |
| `POST`   | `/projects`                     | Create a new project              | Authenticated User   |
| `GET`    | `/projects`                     | Get all projects for current user | Authenticated User   |
| `GET`    | `/projects/:id`                 | Get project details               | Project Member       |
| `PATCH`  | `/projects/:id`                 | Update project                    | Project Owner/Editor |
| `DELETE` | `/projects/:id`                 | Delete project                    | Project Owner        |
| `POST`   | `/projects/:id/members`         | Add member to project             | Project Owner        |
| `GET`    | `/projects/:id/members`         | Get project members               | Project Member       |
| `PATCH`  | `/projects/:id/members/:userId` | Update member role                | Project Owner        |
| `DELETE` | `/projects/:id/members/:userId` | Remove member                     | Project Owner        |

## 5. Tasks (`/tasks`)

_Protected: Requires JWT Token_

| Method   | Path         | Description                      | Access Control                         |
| :------- | :----------- | :------------------------------- | :------------------------------------- |
| `POST`   | `/tasks`     | Create a new task                | Project Owner/Editor                   |
| `GET`    | `/tasks`     | Get all tasks (supports filters) | Authenticated User                     |
| `GET`    | `/tasks/:id` | Get task details                 | Authenticated User                     |
| `PATCH`  | `/tasks/:id` | Update task                      | Project Owner/Editor (Task Role Guard) |
| `DELETE` | `/tasks/:id` | Delete task                      | Project Owner/Editor (Task Role Guard) |

### Query Parameters for `GET /tasks`:

- `project_id`: Filter by project
- `status`: Filter by status (TODO, IN_PROGRESS, DONE)
- `priority`: Filter by priority (LOW, MEDIUM, HIGH)
- `assignee_id`: Filter by assignee
- `search`: Search term for title/description

## 6. Comments (`/comments`)

_Protected: Requires JWT Token_

| Method   | Path                     | Description             | Access Control     |
| :------- | :----------------------- | :---------------------- | :----------------- |
| `POST`   | `/comments`              | Create a comment        | Authenticated User |
| `GET`    | `/comments/task/:taskId` | Get comments for a task | Authenticated User |
| `GET`    | `/comments/:id`          | Get a specific comment  | Authenticated User |
| `PATCH`  | `/comments/:id`          | Update a comment        | Authenticated User |
| `DELETE` | `/comments/:id`          | Delete a comment        | Authenticated User |

## 7. Activity Log (`/activity-log`)

_Protected: Requires JWT Token_

| Method | Path                               | Description              | Access Control     |
| :----- | :--------------------------------- | :----------------------- | :----------------- |
| `GET`  | `/activity-log`                    | Get all logs (paginated) | Admin              |
| `GET`  | `/activity-log/me`                 | Get current user's logs  | Authenticated User |
| `GET`  | `/activity-log/recent`             | Get recent activities    | Authenticated User |
| `GET`  | `/activity-log/user/:userId`       | Get logs by user         | Admin              |
| `GET`  | `/activity-log/project/:projectId` | Get logs by project      | Authenticated User |
| `GET`  | `/activity-log/task/:taskId`       | Get logs by task         | Authenticated User |

## 8. Statistics (`/statistics`)

_Protected: Requires JWT Token_

| Method | Path                      | Description              | Access Control     |
| :----- | :------------------------ | :----------------------- | :----------------- |
| `GET`  | `/statistics/dashboard`   | Get user dashboard stats | Authenticated User |
| `GET`  | `/statistics/project/:id` | Get project statistics   | Project Member     |

## 9. Automation (`/automation`)

_Protected: Requires JWT Token_

| Method   | Path                    | Description                    | Access Control     |
| :------- | :---------------------- | :----------------------------- | :----------------- |
| `POST`   | `/automation/rules`     | Create a new automation rule   | Authenticated User |
| `GET`    | `/automation/rules`     | Get all rules for current user | Authenticated User |
| `DELETE` | `/automation/rules/:id` | Delete a rule                  | Authenticated User |

## 10. Google Calendar Sync (`/calendar`)

_Protected: Requires JWT Token_

| Method   | Path                   | Description                               | Access Control     |
| :------- | :--------------------- | :---------------------------------------- | :----------------- |
| `GET`    | `/calendar/auth-url`   | Get OAuth authorization URL               | Authenticated User |
| `GET`    | `/calendar/callback`   | OAuth callback (Google redirects here)    | Authenticated User |
| `GET`    | `/calendar/status`     | Get calendar sync status                  | Authenticated User |
| `POST`   | `/calendar/sync`       | Sync all pending tasks to Google Calendar | Authenticated User |
| `DELETE` | `/calendar/disconnect` | Disconnect Google Calendar                | Authenticated User |
