import { Env } from './utils/types';
import { handleCORS, jsonResponse, errorResponse } from './utils/cors';

// Import handlers
import { handleWebhookVerify, handleWebhookEvent } from './handlers/facebook-webhook';
import { handleAIFacebookAgent } from './handlers/ai-facebook-agent';
import { handleLogin, handleSignup, handlePasswordResetRequest, handleRefreshToken, handleGetUser } from './handlers/auth';
import { handleGetProducts, handleCreateProduct, handleUpdateProduct, handleDeleteProduct } from './handlers/products';
import { handleGetPageMemory, handleUpdatePageMemory, handleSyncProducts } from './handlers/page-memory';
import { handleDashboardStats, handleDashboardOverview } from './handlers/dashboard';
import { handleGetNotifications, handleMarkNotificationRead } from './handlers/notifications';
import { handleGetExecutionLogs, handleGetExecutionStats } from './handlers/execution-logs';
import { handleGetAIOrders, handleCreateAIOrder, handleUpdateAIOrder, handleGetAIOrderStats } from './handlers/ai-orders';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;
    
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    console.log(`[Router] ${method} ${path}`);
    
    try {
      // ============ Facebook Webhook ============
      if (path === '/facebook-webhook') {
        if (method === 'GET') {
          return handleWebhookVerify(request, env);
        }
        if (method === 'POST') {
          return handleWebhookEvent(request, env);
        }
      }
      
      // ============ AI Facebook Agent ============
      if (path === '/ai-facebook-agent' && method === 'POST') {
        return handleAIFacebookAgent(request, env);
      }
      
      // ============ Authentication ============
      if (path === '/auth-login' && method === 'POST') {
        return handleLogin(request, env);
      }
      
      if (path === '/auth-signup' && method === 'POST') {
        return handleSignup(request, env);
      }
      
      if (path === '/auth-request-password-reset' && method === 'POST') {
        return handlePasswordResetRequest(request, env);
      }
      
      if (path === '/auth-refresh-user' && method === 'POST') {
        return handleRefreshToken(request, env);
      }
      
      if (path === '/me' && method === 'GET') {
        return handleGetUser(request, env);
      }
      
      // ============ Products ============
      if (path === '/products') {
        if (method === 'GET') return handleGetProducts(request, env);
        if (method === 'POST') return handleCreateProduct(request, env);
      }
      
      if (path.startsWith('/products/') && path.split('/').length === 3) {
        if (method === 'PUT' || method === 'PATCH') return handleUpdateProduct(request, env);
        if (method === 'DELETE') return handleDeleteProduct(request, env);
      }
      
      // ============ Page Memory ============
      if (path === '/page-memory') {
        if (method === 'GET') return handleGetPageMemory(request, env);
        if (method === 'POST' || method === 'PUT') return handleUpdatePageMemory(request, env);
      }
      
      if (path === '/page-memory/sync-products' && method === 'POST') {
        return handleSyncProducts(request, env);
      }
      
      // ============ Dashboard ============
      if (path === '/dashboard-stats' && method === 'GET') {
        return handleDashboardStats(request, env);
      }
      
      if (path === '/dashboard-overview' && method === 'GET') {
        return handleDashboardOverview(request, env);
      }
      
      // ============ Notifications ============
      if (path === '/notifications') {
        if (method === 'GET') return handleGetNotifications(request, env);
        if (method === 'POST') return handleMarkNotificationRead(request, env);
      }
      
      // ============ Execution Logs ============
      if (path === '/execution-logs' && method === 'GET') {
        return handleGetExecutionLogs(request, env);
      }
      
      if (path === '/execution-logs/stats' && method === 'GET') {
        return handleGetExecutionStats(request, env);
      }
      
      // ============ AI Orders ============
      if (path === '/ai-orders') {
        if (method === 'GET') return handleGetAIOrders(request, env);
        if (method === 'POST') return handleCreateAIOrder(request, env);
      }
      
      if (path.startsWith('/ai-orders/') && path.split('/').length === 3) {
        if (method === 'PUT' || method === 'PATCH') return handleUpdateAIOrder(request, env);
      }
      
      if (path === '/ai-orders/stats' && method === 'GET') {
        return handleGetAIOrderStats(request, env);
      }
      
      // ============ Health Check ============
      if (path === '/health' || path === '/') {
        return jsonResponse({
          status: 'ok',
          service: 'autofloy-api',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          endpoints: [
            '/facebook-webhook',
            '/ai-facebook-agent',
            '/auth-login',
            '/auth-signup',
            '/products',
            '/page-memory',
            '/dashboard-stats',
            '/notifications',
            '/execution-logs',
            '/ai-orders',
          ],
        });
      }
      
      // ============ 404 Not Found ============
      return errorResponse(`Endpoint not found: ${method} ${path}`, 404);
      
    } catch (error: any) {
      console.error('[Router] Unhandled error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  },
};
