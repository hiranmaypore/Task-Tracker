/**
 * Centralized Routes Configuration
 * 
 * This file serves as the single source of truth for:
 * 1. Backend API endpoints
 * 2. Frontend route paths
 * 3. Route metadata (public/protected, roles, etc.)
 * 
 * Benefits:
 * - Frontend can import this to ensure type-safe routing
 * - Documentation is always in sync with implementation
 * - Easy to generate API documentation
 * - Consistent naming across frontend and backend
 */

// ============================================
// BACKEND API ROUTES
// ============================================

export const API_ROUTES = {
  // Base API prefix
  BASE: '/api',

  // Authentication
  AUTH: {
    BASE: '/auth',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: '/users/:id',
    ME: '/users/me',
    UPDATE_PROFILE: '/users/:id',
    DELETE: '/users/:id',
  },

  // Projects
  PROJECTS: {
    BASE: '/projects',
    BY_ID: '/projects/:id',
    MEMBERS: '/projects/:id/members',
    MEMBER_BY_ID: '/projects/:id/members/:userId',
    TASKS: '/projects/:id/tasks',
  },

  // Tasks
  TASKS: {
    BASE: '/tasks',
    BY_ID: '/tasks/:id',
    BY_PROJECT: '/tasks?project_id=:projectId',
    COMMENTS: '/tasks/:id/comments',
  },

  // Comments
  COMMENTS: {
    BASE: '/comments',
    BY_ID: '/comments/:id',
    BY_TASK: '/comments/task/:taskId',
  },

  // Statistics
  STATISTICS: {
    BASE: '/statistics',
    DASHBOARD: '/statistics/dashboard',
    PROJECT: '/statistics/project/:id',
  },

  // Analytics (Admin only)
  ANALYTICS: {
    BASE: '/analytics',
    DAU: '/analytics/dau',
    TASK_COMPLETION: '/analytics/tasks/completion',
    AUTOMATION_EXECUTIONS: '/analytics/automation/executions',
  },

  // Automation
  AUTOMATION: {
    BASE: '/automation',
    RULES: '/automation/rules',
    RULE_BY_ID: '/automation/rules/:id',
  },

  // Calendar
  CALENDAR: {
    BASE: '/calendar',
    AUTH_URL: '/calendar/auth-url',
    CALLBACK: '/calendar/callback',
    STATUS: '/calendar/status',
    SYNC: '/calendar/sync',
    DISCONNECT: '/calendar/disconnect',
  },

  // Activity Log
  ACTIVITY_LOG: {
    BASE: '/activity-log',
    ME: '/activity-log/me',
    RECENT: '/activity-log/recent',
    BY_USER: '/activity-log/user/:userId',
    BY_PROJECT: '/activity-log/project/:projectId',
    BY_TASK: '/activity-log/task/:taskId',
  },
} as const;

// ============================================
// FRONTEND ROUTES
// ============================================

export const FRONTEND_ROUTES = {
  // Public routes
  PUBLIC: {
    LANDING: '/',
    HOME: '/home',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password/:token',
  },

  // Protected routes
  PROTECTED: {
    DASHBOARD: '/dashboard',
    
    // Projects
    PROJECTS: '/projects',
    PROJECT_DETAIL: '/projects/:id',
    PROJECT_NEW: '/projects/new',
    
    // Tasks
    TASKS: '/tasks',
    TASK_DETAIL: '/tasks/:id',
    TASK_NEW: '/tasks/new',
    
    // Calendar
    CALENDAR: '/calendar',
    
    // Statistics
    STATISTICS: '/statistics',
    
    // Analytics (Admin only)
    ANALYTICS: '/analytics',
    
    // Automation
    AUTOMATION: '/automation',
    AUTOMATION_NEW: '/automation/new',
    AUTOMATION_EDIT: '/automation/:id/edit',
    
    // Activity
    ACTIVITY: '/activity',
    
    // User
    PROFILE: '/profile',
    SETTINGS: '/settings',
  },
} as const;

// ============================================
// ROUTE METADATA
// ============================================

export interface RouteMetadata {
  path: string;
  name: string;
  description: string;
  isPublic: boolean;
  requiredRoles?: ('USER' | 'ADMIN')[];
  icon?: string;
  showInNav?: boolean;
}

export const ROUTE_METADATA: Record<string, RouteMetadata> = {
  // Public Routes
  LANDING: {
    path: FRONTEND_ROUTES.PUBLIC.LANDING,
    name: 'Home',
    description: 'Landing page',
    isPublic: true,
    showInNav: false,
  },
  LOGIN: {
    path: FRONTEND_ROUTES.PUBLIC.LOGIN,
    name: 'Login',
    description: 'User login',
    isPublic: true,
    showInNav: false,
  },
  REGISTER: {
    path: FRONTEND_ROUTES.PUBLIC.REGISTER,
    name: 'Register',
    description: 'User registration',
    isPublic: true,
    showInNav: false,
  },

  // Protected Routes
  DASHBOARD: {
    path: FRONTEND_ROUTES.PROTECTED.DASHBOARD,
    name: 'Dashboard',
    description: 'Main dashboard with overview',
    isPublic: false,
    icon: 'LayoutDashboard',
    showInNav: true,
  },
  PROJECTS: {
    path: FRONTEND_ROUTES.PROTECTED.PROJECTS,
    name: 'Projects',
    description: 'All projects',
    isPublic: false,
    icon: 'FolderKanban',
    showInNav: true,
  },
  TASKS: {
    path: FRONTEND_ROUTES.PROTECTED.TASKS,
    name: 'Tasks',
    description: 'All tasks',
    isPublic: false,
    icon: 'CheckSquare',
    showInNav: true,
  },
  CALENDAR: {
    path: FRONTEND_ROUTES.PROTECTED.CALENDAR,
    name: 'Calendar',
    description: 'Calendar view of tasks',
    isPublic: false,
    icon: 'Calendar',
    showInNav: true,
  },
  STATISTICS: {
    path: FRONTEND_ROUTES.PROTECTED.STATISTICS,
    name: 'Statistics',
    description: 'Task and project statistics',
    isPublic: false,
    icon: 'BarChart3',
    showInNav: true,
  },
  ACTIVITY: {
    path: FRONTEND_ROUTES.PROTECTED.ACTIVITY,
    name: 'Activity',
    description: 'Activity log',
    isPublic: false,
    icon: 'Activity',
    showInNav: true,
  },
  AUTOMATION: {
    path: FRONTEND_ROUTES.PROTECTED.AUTOMATION,
    name: 'Automation',
    description: 'Automation rules',
    isPublic: false,
    icon: 'Zap',
    showInNav: true,
  },
  ANALYTICS: {
    path: FRONTEND_ROUTES.PROTECTED.ANALYTICS,
    name: 'Analytics',
    description: 'System analytics (Admin only)',
    isPublic: false,
    requiredRoles: ['ADMIN'],
    icon: 'TrendingUp',
    showInNav: true,
  },
  SETTINGS: {
    path: FRONTEND_ROUTES.PROTECTED.SETTINGS,
    name: 'Settings',
    description: 'User settings',
    isPublic: false,
    icon: 'Settings',
    showInNav: true,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build API URL with parameters
 * @example buildApiUrl(API_ROUTES.TASKS.BY_ID, { id: '123' }) => '/tasks/123'
 */
export function buildApiUrl(
  route: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return route;

  let url = route;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, String(value));
  });
  return url;
}

/**
 * Build frontend URL with parameters
 * @example buildFrontendUrl(FRONTEND_ROUTES.PROTECTED.PROJECT_DETAIL, { id: '123' }) => '/projects/123'
 */
export function buildFrontendUrl(
  route: string,
  params?: Record<string, string | number>,
): string {
  return buildApiUrl(route, params);
}

/**
 * Get navigation items for sidebar
 * @param userRole - Current user's role
 */
export function getNavigationItems(userRole: 'USER' | 'ADMIN' = 'USER') {
  return Object.values(ROUTE_METADATA)
    .filter((route) => {
      if (!route.showInNav) return false;
      if (route.requiredRoles && !route.requiredRoles.includes(userRole)) {
        return false;
      }
      return true;
    })
    .map((route) => ({
      path: route.path,
      name: route.name,
      icon: route.icon,
    }));
}

/**
 * Check if route requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  return Object.values(FRONTEND_ROUTES.PROTECTED).includes(path as any);
}

/**
 * Check if user has access to route
 */
export function hasRouteAccess(
  path: string,
  userRole: 'USER' | 'ADMIN',
): boolean {
  const metadata = Object.values(ROUTE_METADATA).find((r) => r.path === path);
  if (!metadata) return false;
  if (metadata.isPublic) return true;
  if (!metadata.requiredRoles) return true;
  return metadata.requiredRoles.includes(userRole);
}

// ============================================
// HTTP METHODS
// ============================================

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

// ============================================
// API ENDPOINT DEFINITIONS
// ============================================

export interface ApiEndpoint {
  method: keyof typeof HTTP_METHODS;
  path: string;
  description: string;
  requiresAuth: boolean;
  requiredRoles?: ('USER' | 'ADMIN')[];
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  // Auth
  {
    method: 'POST',
    path: API_ROUTES.AUTH.LOGIN,
    description: 'User login',
    requiresAuth: false,
  },
  {
    method: 'POST',
    path: API_ROUTES.AUTH.REGISTER,
    description: 'User registration',
    requiresAuth: false,
  },

  // Projects
  {
    method: 'GET',
    path: API_ROUTES.PROJECTS.BASE,
    description: 'Get all user projects',
    requiresAuth: true,
  },
  {
    method: 'POST',
    path: API_ROUTES.PROJECTS.BASE,
    description: 'Create new project',
    requiresAuth: true,
  },
  {
    method: 'GET',
    path: API_ROUTES.PROJECTS.BY_ID,
    description: 'Get project by ID',
    requiresAuth: true,
  },
  {
    method: 'PATCH',
    path: API_ROUTES.PROJECTS.BY_ID,
    description: 'Update project',
    requiresAuth: true,
  },
  {
    method: 'DELETE',
    path: API_ROUTES.PROJECTS.BY_ID,
    description: 'Delete project',
    requiresAuth: true,
  },

  // Tasks
  {
    method: 'GET',
    path: API_ROUTES.TASKS.BASE,
    description: 'Get all tasks',
    requiresAuth: true,
  },
  {
    method: 'POST',
    path: API_ROUTES.TASKS.BASE,
    description: 'Create new task',
    requiresAuth: true,
  },
  {
    method: 'GET',
    path: API_ROUTES.TASKS.BY_ID,
    description: 'Get task by ID',
    requiresAuth: true,
  },
  {
    method: 'PATCH',
    path: API_ROUTES.TASKS.BY_ID,
    description: 'Update task',
    requiresAuth: true,
  },
  {
    method: 'DELETE',
    path: API_ROUTES.TASKS.BY_ID,
    description: 'Delete task',
    requiresAuth: true,
  },

  // Analytics (Admin only)
  {
    method: 'GET',
    path: API_ROUTES.ANALYTICS.DAU,
    description: 'Get daily active users',
    requiresAuth: true,
    requiredRoles: ['ADMIN'],
  },
];

// ============================================
// EXPORT ALL
// ============================================

export default {
  API_ROUTES,
  FRONTEND_ROUTES,
  ROUTE_METADATA,
  API_ENDPOINTS,
  buildApiUrl,
  buildFrontendUrl,
  getNavigationItems,
  isProtectedRoute,
  hasRouteAccess,
};
