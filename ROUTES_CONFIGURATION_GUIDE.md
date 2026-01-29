# 🗺️ Routes Configuration - Usage Guide

## Overview

The centralized routes configuration provides a **single source of truth** for all routes in your application (both backend API and frontend pages).

---

## 📁 Files Created

### Backend Files:

1. **`backend/src/routes.config.ts`** - Main configuration file
2. **`backend/src/routes.controller.ts`** - API endpoints to expose routes
3. **`backend/src/app.module.ts`** - Updated to include RoutesController

---

## 🎯 Benefits

✅ **Type Safety** - TypeScript autocomplete for all routes  
✅ **Single Source of Truth** - No route duplication  
✅ **Auto Documentation** - Routes are self-documenting  
✅ **Dynamic Navigation** - Frontend can fetch navigation structure  
✅ **Consistency** - Same route names across frontend and backend  
✅ **Easy Maintenance** - Update routes in one place

---

## 🔌 Backend API Endpoints

Your backend now exposes these endpoints:

### 1. Get All API Routes

```bash
GET http://localhost:3000/routes/api
```

**Response:**

```json
{
  "routes": {
    "AUTH": {
      "BASE": "/auth",
      "LOGIN": "/auth/login",
      "REGISTER": "/auth/register"
    },
    "TASKS": {
      "BASE": "/tasks",
      "BY_ID": "/tasks/:id"
    }
    // ... all API routes
  },
  "endpoints": [
    {
      "method": "POST",
      "path": "/auth/login",
      "description": "User login",
      "requiresAuth": false
    }
    // ... all endpoints with metadata
  ]
}
```

### 2. Get Frontend Routes

```bash
GET http://localhost:3000/routes/frontend
```

**Response:**

```json
{
  "routes": {
    "PUBLIC": {
      "LANDING": "/",
      "LOGIN": "/login",
      "REGISTER": "/register"
    },
    "PROTECTED": {
      "DASHBOARD": "/dashboard",
      "PROJECTS": "/projects",
      "TASKS": "/tasks"
    }
  },
  "metadata": {
    "DASHBOARD": {
      "path": "/dashboard",
      "name": "Dashboard",
      "description": "Main dashboard",
      "isPublic": false,
      "icon": "LayoutDashboard",
      "showInNav": true
    }
    // ... all route metadata
  }
}
```

### 3. Get Navigation Items

```bash
GET http://localhost:3000/routes/navigation
```

**Response:**

```json
{
  "user": [
    { "path": "/dashboard", "name": "Dashboard", "icon": "LayoutDashboard" },
    { "path": "/projects", "name": "Projects", "icon": "FolderKanban" },
    { "path": "/tasks", "name": "Tasks", "icon": "CheckSquare" }
  ],
  "admin": [
    // ... includes admin-only routes like Analytics
  ]
}
```

### 4. Get Complete Configuration

```bash
GET http://localhost:3000/routes/config
```

Returns everything in one call.

---

## 💻 Frontend Usage

### Option 1: Fetch Routes from Backend (Recommended)

```typescript
// frontend/src/lib/routes.ts
import { useEffect, useState } from 'react';

// Fetch routes from backend
export async function fetchRoutes() {
  const response = await fetch('http://localhost:3000/routes/config');
  return response.json();
}

// Use in component
function App() {
  const [routes, setRoutes] = useState(null);

  useEffect(() => {
    fetchRoutes().then(setRoutes);
  }, []);

  return (
    <Router>
      {/* Use routes.frontend.PROTECTED.DASHBOARD etc. */}
    </Router>
  );
}
```

### Option 2: Copy Configuration to Frontend

```typescript
// frontend/src/config/routes.ts
// Copy the routes.config.ts content here
// Or import it if using a monorepo

import { API_ROUTES, FRONTEND_ROUTES } from './routes.config';

// Use in API client
const apiClient = {
  login: (data) => fetch(API_ROUTES.AUTH.LOGIN, { method: 'POST', body: data }),
  getTasks: () => fetch(API_ROUTES.TASKS.BASE),
};

// Use in router
const router = createBrowserRouter([
  { path: FRONTEND_ROUTES.PUBLIC.LOGIN, element: <LoginPage /> },
  { path: FRONTEND_ROUTES.PROTECTED.DASHBOARD, element: <Dashboard /> },
]);
```

### Option 3: Generate TypeScript Types

```typescript
// frontend/src/types/routes.ts
export type ApiRoutes = typeof API_ROUTES;
export type FrontendRoutes = typeof FRONTEND_ROUTES;

// Now you get autocomplete!
const taskUrl: string = API_ROUTES.TASKS.BY_ID; // ✅ Autocomplete works
```

---

## 🛠️ Helper Functions

### Build URL with Parameters

```typescript
import { buildApiUrl, buildFrontendUrl } from "./routes.config";

// Backend
const taskUrl = buildApiUrl(API_ROUTES.TASKS.BY_ID, { id: "123" });
// Result: '/tasks/123'

// Frontend
const projectUrl = buildFrontendUrl(FRONTEND_ROUTES.PROTECTED.PROJECT_DETAIL, {
  id: "456",
});
// Result: '/projects/456'
```

### Get Navigation Items

```typescript
import { getNavigationItems } from './routes.config';

const userNav = getNavigationItems('USER');
const adminNav = getNavigationItems('ADMIN');

// Use in Sidebar component
function Sidebar({ userRole }) {
  const navItems = getNavigationItems(userRole);

  return (
    <nav>
      {navItems.map(item => (
        <Link key={item.path} to={item.path}>
          <Icon name={item.icon} />
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
```

### Check Route Access

```typescript
import { hasRouteAccess, isProtectedRoute } from "./routes.config";

// Check if route requires auth
if (isProtectedRoute("/dashboard")) {
  // Redirect to login
}

// Check if user has access
if (!hasRouteAccess("/analytics", userRole)) {
  // Show 403 Forbidden
}
```

---

## 🎨 Frontend Router Example

```typescript
// frontend/src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import { FRONTEND_ROUTES } from './config/routes';

export const router = createBrowserRouter([
  // Public routes
  {
    path: FRONTEND_ROUTES.PUBLIC.LANDING,
    element: <LandingPage />,
  },
  {
    path: FRONTEND_ROUTES.PUBLIC.LOGIN,
    element: <LoginPage />,
  },
  {
    path: FRONTEND_ROUTES.PUBLIC.REGISTER,
    element: <RegisterPage />,
  },

  // Protected routes
  {
    path: FRONTEND_ROUTES.PROTECTED.DASHBOARD,
    element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  },
  {
    path: FRONTEND_ROUTES.PROTECTED.PROJECTS,
    element: <ProtectedRoute><ProjectsPage /></ProtectedRoute>,
  },
  {
    path: FRONTEND_ROUTES.PROTECTED.PROJECT_DETAIL,
    element: <ProtectedRoute><ProjectDetailPage /></ProtectedRoute>,
  },
  // ... more routes
]);
```

---

## 🔥 API Client Example

```typescript
// frontend/src/api/client.ts
import { API_ROUTES, buildApiUrl } from "./config/routes";

const BASE_URL = "http://localhost:3000";

class ApiClient {
  // Auth
  async login(email: string, password: string) {
    return fetch(`${BASE_URL}${API_ROUTES.AUTH.LOGIN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  }

  // Tasks
  async getTasks() {
    return fetch(`${BASE_URL}${API_ROUTES.TASKS.BASE}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getTask(id: string) {
    const url = buildApiUrl(API_ROUTES.TASKS.BY_ID, { id });
    return fetch(`${BASE_URL}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Projects
  async getProjects() {
    return fetch(`${BASE_URL}${API_ROUTES.PROJECTS.BASE}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export const apiClient = new ApiClient();
```

---

## 📝 Adding New Routes

### 1. Add to Backend Configuration

```typescript
// backend/src/routes.config.ts

export const API_ROUTES = {
  // ... existing routes

  // Add new module
  NOTIFICATIONS: {
    BASE: "/notifications",
    BY_ID: "/notifications/:id",
    MARK_READ: "/notifications/:id/read",
  },
};

export const FRONTEND_ROUTES = {
  PROTECTED: {
    // ... existing routes

    // Add new page
    NOTIFICATIONS: "/notifications",
  },
};
```

### 2. Add Metadata

```typescript
export const ROUTE_METADATA: Record<string, RouteMetadata> = {
  // ... existing metadata

  NOTIFICATIONS: {
    path: FRONTEND_ROUTES.PROTECTED.NOTIFICATIONS,
    name: "Notifications",
    description: "User notifications",
    isPublic: false,
    icon: "Bell",
    showInNav: true,
  },
};
```

### 3. Frontend Automatically Gets Updates!

When you restart the backend, the `/routes/config` endpoint will return the new routes.

---

## 🧪 Testing

```bash
# Test the routes endpoint
curl http://localhost:3000/routes/config

# Test with jq for pretty output
curl http://localhost:3000/routes/config | jq

# Test navigation endpoint
curl http://localhost:3000/routes/navigation
```

---

## 🚀 Best Practices

1. ✅ **Always use route constants** instead of hardcoded strings
2. ✅ **Use helper functions** for building URLs with parameters
3. ✅ **Fetch routes on app startup** to ensure sync with backend
4. ✅ **Cache routes** in frontend to avoid repeated fetches
5. ✅ **Update both API and frontend routes** when adding features
6. ✅ **Use TypeScript** for type safety

---

## 🎯 Next Steps

1. **Frontend Setup:**
   - Fetch routes from `/routes/config` on app startup
   - Store in React Context or Zustand store
   - Use in router configuration

2. **API Client:**
   - Create typed API client using route constants
   - Add request/response interceptors

3. **Navigation:**
   - Build dynamic sidebar from route metadata
   - Show/hide routes based on user role

4. **Documentation:**
   - Auto-generate API docs from `API_ENDPOINTS`
   - Create interactive API explorer

---

**Your routes are now centralized and ready to use!** 🎉
