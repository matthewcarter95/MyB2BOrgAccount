import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  getOrgDetails,
  updateOrgDetails,
  getOrgConfig,
  getIdentityProviders,
  createIdentityProvider,
  updateIdentityProvider,
  deleteIdentityProvider,
} from '../myorg.js';
import {
  getSession,
  getSessionWithDecryptedTokens,
  updateSessionOrg,
  updateSessionMyOrgToken,
  isSessionValid,
} from '../session.js';
import { exchangeForMyOrgToken } from '../auth.js';
import type { ApiResponse, OrgDetails, OrgConfig, IdentityProvider } from '../types.js';

async function getValidSession(sessionId: string | null) {
  if (!sessionId) {
    return { error: 'Not authenticated' };
  }

  const session = await getSessionWithDecryptedTokens(sessionId);
  if (!session || !isSessionValid(session)) {
    return { error: 'Session invalid or expired' };
  }

  return { session };
}

// Get My Org API access token via silent auth (refresh token exchange)
// Initial login has no audience - we exchange refresh token for My Org scoped token
async function getMyOrgAccessToken(session: Awaited<ReturnType<typeof getSessionWithDecryptedTokens>>): Promise<string | null> {
  if (!session) return null;

  // Log the session roles for debugging
  console.log('Session roles (https://example.com/roles):', session.roles);
  console.log('Session orgId:', session.orgId);

  // Prefer the initial access token from login if it has the My Org audience —
  // it carries the org-picker session context that refresh token exchanges may lack.
  try {
    const parts = session.decryptedAccessToken.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const aud: string[] = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (aud.some((a) => a.includes('/my-org/'))) {
      console.log('Using initial access token (my-org audience), scope:', payload.scope);
      return session.decryptedAccessToken;
    }
  } catch (e) {
    // not a decodable JWT
  }

  // Check if we have a cached My Org token with the correct audience
  if (session.decryptedMyOrgToken) {
    try {
      const parts = session.decryptedMyOrgToken.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const aud: string[] = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (aud.some((a) => a.includes('/my-org/'))) {
        console.log('Using cached My Org access token, scope:', payload.scope);
        return session.decryptedMyOrgToken;
      }
      console.log('Cached token has wrong audience, re-exchanging:', payload.aud);
    } catch (e) {
      console.log('Could not decode cached My Org token');
    }
  }

  // Exchange refresh token for My Org API scoped token with organization context
  if (session.decryptedRefreshToken && session.orgId) {
    console.log('Exchanging refresh token for My Org API token with org:', session.orgId);
    const tokens = await exchangeForMyOrgToken(session.decryptedRefreshToken, session.orgId);
    if (tokens) {
      try {
        const parts = tokens.access_token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log('Exchanged My Org token audience:', payload.aud, 'scope:', payload.scope);
      } catch (e) { /* ignore */ }
      await updateSessionMyOrgToken(session.sessionId, tokens.access_token);
      return tokens.access_token;
    }
  }

  console.log('No My Org token available');
  return null;
}

function requireAdmin(roles: string[]): string | null {
  if (!roles.includes('admin')) {
    return 'Admin access required';
  }
  return null;
}

export async function handleGetOrgDetails(
  sessionId: string | null
): Promise<ApiResponse<OrgDetails>> {
  const result = await getValidSession(sessionId);
  if ('error' in result) {
    return { success: false, error: result.error };
  }

  try {
    const myOrgToken = await getMyOrgAccessToken(result.session);
    if (!myOrgToken) {
      return { success: false, error: 'Failed to get My Org API token' };
    }
    const details = await getOrgDetails(myOrgToken);
    return { success: true, data: details };
  } catch (err) {
    console.error('Get org details error:', err);
    return { success: false, error: 'Failed to get organization details' };
  }
}

export async function handleUpdateOrgDetails(
  sessionId: string | null,
  event: APIGatewayProxyEventV2
): Promise<ApiResponse<OrgDetails>> {
  const result = await getValidSession(sessionId);
  if ('error' in result) {
    return { success: false, error: result.error };
  }

  const adminError = requireAdmin(result.session.roles);
  if (adminError) {
    return { success: false, error: adminError };
  }

  try {
    const myOrgToken = await getMyOrgAccessToken(result.session);
    if (!myOrgToken) {
      return { success: false, error: 'Failed to get My Org API token' };
    }
    const updates = JSON.parse(event.body || '{}');
    const details = await updateOrgDetails(myOrgToken, updates);
    return { success: true, data: details };
  } catch (err) {
    console.error('Update org details error:', err);
    return { success: false, error: 'Failed to update organization details' };
  }
}

export async function handleGetOrgConfig(
  sessionId: string | null
): Promise<ApiResponse<OrgConfig>> {
  const result = await getValidSession(sessionId);
  if ('error' in result) {
    return { success: false, error: result.error };
  }

  try {
    const myOrgToken = await getMyOrgAccessToken(result.session);
    if (!myOrgToken) {
      return { success: false, error: 'Failed to get My Org API token' };
    }
    const config = await getOrgConfig(myOrgToken);
    return { success: true, data: config };
  } catch (err) {
    console.error('Get org config error:', err);
    return { success: false, error: 'Failed to get organization configuration' };
  }
}

export async function handleGetIdentityProviders(
  sessionId: string | null
): Promise<ApiResponse<IdentityProvider[]>> {
  const result = await getValidSession(sessionId);
  if ('error' in result) {
    return { success: false, error: result.error };
  }

  try {
    const myOrgToken = await getMyOrgAccessToken(result.session);
    if (!myOrgToken) {
      return { success: false, error: 'Failed to get My Org API token' };
    }
    const providers = await getIdentityProviders(myOrgToken);
    return { success: true, data: providers };
  } catch (err) {
    console.error('Get identity providers error:', err);
    return { success: false, error: 'Failed to get identity providers' };
  }
}

export async function handleCreateIdentityProvider(
  sessionId: string | null,
  event: APIGatewayProxyEventV2
): Promise<ApiResponse<IdentityProvider>> {
  const result = await getValidSession(sessionId);
  if ('error' in result) {
    return { success: false, error: result.error };
  }

  const adminError = requireAdmin(result.session.roles);
  if (adminError) {
    return { success: false, error: adminError };
  }

  try {
    const myOrgToken = await getMyOrgAccessToken(result.session);
    if (!myOrgToken) {
      return { success: false, error: 'Failed to get My Org API token' };
    }
    const provider = JSON.parse(event.body || '{}');
    const created = await createIdentityProvider(myOrgToken, provider);
    return { success: true, data: created };
  } catch (err) {
    console.error('Create identity provider error:', err);
    return { success: false, error: 'Failed to create identity provider' };
  }
}

export async function handleUpdateIdentityProvider(
  sessionId: string | null,
  providerId: string,
  event: APIGatewayProxyEventV2
): Promise<ApiResponse<IdentityProvider>> {
  const result = await getValidSession(sessionId);
  if ('error' in result) {
    return { success: false, error: result.error };
  }

  const adminError = requireAdmin(result.session.roles);
  if (adminError) {
    return { success: false, error: adminError };
  }

  try {
    const myOrgToken = await getMyOrgAccessToken(result.session);
    if (!myOrgToken) {
      return { success: false, error: 'Failed to get My Org API token' };
    }
    const updates = JSON.parse(event.body || '{}');
    const updated = await updateIdentityProvider(
      myOrgToken,
      providerId,
      updates
    );
    return { success: true, data: updated };
  } catch (err) {
    console.error('Update identity provider error:', err);
    return { success: false, error: 'Failed to update identity provider' };
  }
}

export async function handleDeleteIdentityProvider(
  sessionId: string | null,
  providerId: string
): Promise<ApiResponse<void>> {
  const result = await getValidSession(sessionId);
  if ('error' in result) {
    return { success: false, error: result.error };
  }

  const adminError = requireAdmin(result.session.roles);
  if (adminError) {
    return { success: false, error: adminError };
  }

  try {
    const myOrgToken = await getMyOrgAccessToken(result.session);
    if (!myOrgToken) {
      return { success: false, error: 'Failed to get My Org API token' };
    }
    await deleteIdentityProvider(myOrgToken, providerId);
    return { success: true };
  } catch (err) {
    console.error('Delete identity provider error:', err);
    return { success: false, error: 'Failed to delete identity provider' };
  }
}

export async function handleSwitchOrg(
  sessionId: string | null,
  event: APIGatewayProxyEventV2
): Promise<ApiResponse<{ orgId: string }>> {
  const result = await getValidSession(sessionId);
  if ('error' in result) {
    return { success: false, error: result.error };
  }

  try {
    const { orgId } = JSON.parse(event.body || '{}');

    if (!orgId) {
      return { success: false, error: 'Missing orgId' };
    }

    // Verify user has access to this org
    if (!result.session.orgs.includes(orgId)) {
      return { success: false, error: 'Access denied to organization' };
    }

    // Update session with new org
    await updateSessionOrg(result.session.sessionId, orgId);

    return { success: true, data: { orgId } };
  } catch (err) {
    console.error('Switch org error:', err);
    return { success: false, error: 'Failed to switch organization' };
  }
}
