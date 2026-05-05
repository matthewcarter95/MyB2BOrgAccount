import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  handleLogin,
  handleSignup,
  handleCallback,
  handleLogout,
  handleGetMe,
  handleAuthStatus,
  handleBackchannelLogout,
  getSessionIdFromCookie,
} from './routes/auth.js';
import {
  handleGetOrgDetails,
  handleUpdateOrgDetails,
  handleGetOrgConfig,
  handleGetIdentityProviders,
  handleCreateIdentityProvider,
  handleUpdateIdentityProvider,
  handleDeleteIdentityProvider,
  handleSwitchOrg,
} from './routes/org.js';
import { handleGetCommodities } from './routes/commodities.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://myaccount.demo-connect.us';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': FRONTEND_URL,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {}
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

function redirectResponse(
  statusCode: number,
  headers: Record<string, string>
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      ...headers,
    },
  };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { requestContext, rawPath } = event;
  const method = requestContext.http.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
    };
  }

  const sessionId = getSessionIdFromCookie(event);

  try {
    // Route matching
    const path = rawPath.replace(/\/$/, ''); // Remove trailing slash

    // Public routes
    if (method === 'GET' && path === '/commodities') {
      const result = handleGetCommodities();
      return jsonResponse(200, result);
    }

    // Auth routes
    if (method === 'GET' && path === '/auth/login') {
      const { statusCode, headers } = handleLogin();
      return redirectResponse(statusCode, headers);
    }

    if (method === 'GET' && path === '/auth/signup') {
      const { statusCode, headers } = handleSignup();
      return redirectResponse(statusCode, headers);
    }

    if (method === 'GET' && path === '/auth/callback') {
      const result = await handleCallback(event);
      if (result.body) {
        return jsonResponse(result.statusCode, JSON.parse(result.body), result.headers);
      }
      return redirectResponse(result.statusCode, result.headers);
    }

    if ((method === 'GET' || method === 'POST') && path === '/auth/logout') {
      const result = await handleLogout(sessionId);
      if (result.body) {
        return jsonResponse(result.statusCode, JSON.parse(result.body), result.headers);
      }
      return redirectResponse(result.statusCode, result.headers);
    }

    if (method === 'GET' && path === '/auth/me') {
      const result = await handleGetMe(sessionId);
      return jsonResponse(result.success ? 200 : 401, result);
    }

    if (method === 'GET' && path === '/auth/status') {
      const result = await handleAuthStatus(sessionId);
      return jsonResponse(200, result);
    }

    if (method === 'POST' && path === '/auth/backchannel-logout') {
      const result = await handleBackchannelLogout(event);
      return {
        statusCode: result.statusCode,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        body: result.body,
      };
    }

    // Organization routes
    if (method === 'GET' && path === '/org/details') {
      const result = await handleGetOrgDetails(sessionId);
      return jsonResponse(result.success ? 200 : (result.error === 'Not authenticated' ? 401 : 500), result);
    }

    if (method === 'PATCH' && path === '/org/details') {
      const result = await handleUpdateOrgDetails(sessionId, event);
      return jsonResponse(result.success ? 200 : (result.error === 'Admin access required' ? 403 : 401), result);
    }

    if (method === 'GET' && path === '/org/config') {
      const result = await handleGetOrgConfig(sessionId);
      return jsonResponse(result.success ? 200 : 401, result);
    }

    if (method === 'GET' && path === '/org/identity-providers') {
      const result = await handleGetIdentityProviders(sessionId);
      return jsonResponse(result.success ? 200 : 401, result);
    }

    if (method === 'POST' && path === '/org/identity-providers') {
      const result = await handleCreateIdentityProvider(sessionId, event);
      return jsonResponse(result.success ? 201 : (result.error === 'Admin access required' ? 403 : 401), result);
    }

    // Identity provider routes with ID parameter
    const idpMatch = path.match(/^\/org\/identity-providers\/([^/]+)$/);
    if (idpMatch) {
      const providerId = idpMatch[1];

      if (method === 'PATCH') {
        const result = await handleUpdateIdentityProvider(sessionId, providerId, event);
        return jsonResponse(result.success ? 200 : (result.error === 'Admin access required' ? 403 : 401), result);
      }

      if (method === 'DELETE') {
        const result = await handleDeleteIdentityProvider(sessionId, providerId);
        return jsonResponse(result.success ? 200 : (result.error === 'Admin access required' ? 403 : 401), result);
      }
    }

    if (method === 'POST' && path === '/org/switch') {
      const result = await handleSwitchOrg(sessionId, event);
      return jsonResponse(result.success ? 200 : (result.error === 'Not authenticated' ? 401 : 400), result);
    }

    // 404 for unmatched routes
    return jsonResponse(404, { success: false, error: 'Not found' });
  } catch (err) {
    console.error('Handler error:', err);
    return jsonResponse(500, { success: false, error: 'Internal server error' });
  }
}
