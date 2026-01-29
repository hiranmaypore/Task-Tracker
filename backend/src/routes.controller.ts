import { Controller, Get } from '@nestjs/common';
import {
  API_ROUTES,
  FRONTEND_ROUTES,
  ROUTE_METADATA,
  API_ENDPOINTS,
  getNavigationItems,
} from './routes.config';

/**
 * Routes Controller
 * 
 * Exposes route configuration to frontend
 * This allows frontend to dynamically generate:
 * - Navigation menus
 * - API client methods
 * - Route guards
 * - Breadcrumbs
 */
@Controller('routes')
export class RoutesController {
  /**
   * Get all API routes
   * GET /routes/api
   */
  @Get('api')
  getApiRoutes() {
    return {
      routes: API_ROUTES,
      endpoints: API_ENDPOINTS,
    };
  }

  /**
   * Get all frontend routes
   * GET /routes/frontend
   */
  @Get('frontend')
  getFrontendRoutes() {
    return {
      routes: FRONTEND_ROUTES,
      metadata: ROUTE_METADATA,
    };
  }

  /**
   * Get navigation items for sidebar
   * GET /routes/navigation?role=USER
   */
  @Get('navigation')
  getNavigation() {
    return {
      user: getNavigationItems('USER'),
      admin: getNavigationItems('ADMIN'),
    };
  }

  /**
   * Get complete routes configuration
   * GET /routes/config
   */
  @Get('config')
  getRoutesConfig() {
    return {
      api: API_ROUTES,
      frontend: FRONTEND_ROUTES,
      metadata: ROUTE_METADATA,
      endpoints: API_ENDPOINTS,
      navigation: {
        user: getNavigationItems('USER'),
        admin: getNavigationItems('ADMIN'),
      },
    };
  }
}
