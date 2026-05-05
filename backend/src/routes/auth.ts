import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  generateLoginUrl,
  generateSignupUrl,
  generateCodeVerifier,
  generateState,
  exchangeCodeForTokens,
  verifyIdToken,
  verifyLogoutToken,
  generateLogoutUrl,
} from '../auth.js';
import {
  createSession,
  getSession,
  getSessionWithDecryptedTokens,
  revokeSession,
  revokeSessionsBySid,
  revokeSessionsByUserId,
  isSessionValid,
} from '../session.js';
import type { ApiResponse, UserInfo, AuthStatusResponse } from '../types.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://myaccount.demo-connect.us';

// In-memory store for PKCE state (in production, use Redis or DynamoDB)
const pkceStore = new Map<string, { codeVerifier: string; expiresAt: number }>();

function cleanupPkceStore(): void {
  const now = Date.now();
  for (const [key, value] of pkceStore.entries()) {
    if (value.expiresAt < now) {
      pkceStore.delete(key);
    }
  }
}

export function handleLogin(): { statusCode: number; headers: Record<string, string> } {
  cleanupPkceStore();

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  // Store PKCE verifier with 10 minute expiry
  pkceStore.set(state, {
    codeVerifier,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const loginUrl = generateLoginUrl(state, codeVerifier);

  return {
    statusCode: 302,
    headers: {
      Location: loginUrl,
      'Cache-Control': 'no-store',
    },
  };
}

export function handleSignup(): { statusCode: number; headers: Record<string, string> } {
  cleanupPkceStore();

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  pkceStore.set(state, {
    codeVerifier,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const signupUrl = generateSignupUrl(state, codeVerifier);

  return {
    statusCode: 302,
    headers: {
      Location: signupUrl,
      'Cache-Control': 'no-store',
    },
  };
}

export async function handleCallback(
  event: APIGatewayProxyEventV2
): Promise<{ statusCode: number; headers: Record<string, string>; body?: string }> {
  const params = event.queryStringParameters || {};
  const { code, state, error, error_description } = params;

  if (error) {
    return {
      statusCode: 302,
      headers: {
        Location: `${FRONTEND_URL}?error=${encodeURIComponent(error_description || error)}`,
      },
    };
  }

  if (!code || !state) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing code or state parameter' }),
    };
  }

  const pkceData = pkceStore.get(state);
  if (!pkceData) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid or expired state' }),
    };
  }

  pkceStore.delete(state);

  try {
    const tokens = await exchangeCodeForTokens(code, pkceData.codeVerifier);
    const claims = await verifyIdToken(tokens.id_token);

    // Get user's organizations (from ID token or Management API)
    const orgs = claims.org_id ? [claims.org_id] : [];

    const session = await createSession(tokens, claims, orgs);

    // Set HTTP-only session cookie
    const cookieOptions = [
      `session=${session.sessionId}`,
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Path=/',
      `Max-Age=${24 * 60 * 60}`, // 24 hours
    ].join('; ');

    return {
      statusCode: 302,
      headers: {
        Location: `${FRONTEND_URL}/dashboard`,
        'Set-Cookie': cookieOptions,
        'Cache-Control': 'no-store',
      },
    };
  } catch (err) {
    console.error('Callback error:', err);
    return {
      statusCode: 302,
      headers: {
        Location: `${FRONTEND_URL}?error=${encodeURIComponent('Authentication failed')}`,
      },
    };
  }
}

export async function handleLogout(
  sessionId: string | null
): Promise<{ statusCode: number; headers: Record<string, string>; body?: string }> {
  if (sessionId) {
    await revokeSession(sessionId);
  }

  const logoutUrl = generateLogoutUrl(FRONTEND_URL);

  // Clear session cookie
  const clearCookie = [
    'session=',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
  ].join('; ');

  return {
    statusCode: 302,
    headers: {
      Location: logoutUrl,
      'Set-Cookie': clearCookie,
      'Cache-Control': 'no-store',
    },
  };
}

export async function handleGetMe(sessionId: string | null): Promise<ApiResponse<UserInfo>> {
  if (!sessionId) {
    return { success: false, error: 'Not authenticated' };
  }

  const session = await getSessionWithDecryptedTokens(sessionId);
  if (!session || !isSessionValid(session)) {
    return { success: false, error: 'Session invalid or expired' };
  }

  // Parse user info from ID token
  let claims;
  try {
    const parts = session.decryptedIdToken.split('.');
    claims = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  } catch {
    return { success: false, error: 'Failed to parse token' };
  }

  const userInfo: UserInfo = {
    userId: session.userId,
    email: claims.email,
    name: claims.name,
    picture: claims.picture,
    orgId: session.orgId,
    orgs: session.orgs,
    roles: session.roles,
    subscriptionTier: session.subscriptionTier,
    isAdmin: session.roles.includes('admin'),
  };

  return { success: true, data: userInfo };
}

export async function handleAuthStatus(
  sessionId: string | null
): Promise<ApiResponse<AuthStatusResponse>> {
  if (!sessionId) {
    return {
      success: true,
      data: { valid: false, reason: 'not_found' },
    };
  }

  const session = await getSession(sessionId);

  if (!session) {
    return {
      success: true,
      data: { valid: false, reason: 'not_found' },
    };
  }

  if (session.revokedAt) {
    return {
      success: true,
      data: { valid: false, reason: 'revoked' },
    };
  }

  const now = Math.floor(Date.now() / 1000);
  if (session.expiresAt < now) {
    return {
      success: true,
      data: { valid: false, reason: 'expired' },
    };
  }

  return {
    success: true,
    data: { valid: true },
  };
}

export async function handleBackchannelLogout(
  event: APIGatewayProxyEventV2
): Promise<{ statusCode: number; body?: string }> {
  try {
    // Parse form-encoded body
    const body = event.body || '';
    const params = new URLSearchParams(
      event.isBase64Encoded ? Buffer.from(body, 'base64').toString() : body
    );
    const logoutToken = params.get('logout_token');

    if (!logoutToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing logout_token' }),
      };
    }

    const { sid, sub } = await verifyLogoutToken(logoutToken);

    let revokedCount = 0;

    // Revoke sessions by Auth0 session ID if present
    if (sid) {
      revokedCount = await revokeSessionsBySid(sid);
    }

    // Fallback to revoking by user ID
    if (revokedCount === 0 && sub) {
      revokedCount = await revokeSessionsByUserId(sub);
    }

    console.log(`Backchannel logout: revoked ${revokedCount} sessions for sid=${sid} sub=${sub}`);

    return { statusCode: 200 };
  } catch (err) {
    console.error('Backchannel logout error:', err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid logout token' }),
    };
  }
}

export function getSessionIdFromCookie(event: APIGatewayProxyEventV2): string | null {
  const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );

  return cookies.session || null;
}
