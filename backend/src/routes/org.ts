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
  isSessionValid,
} from '../session.js';
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
    const details = await getOrgDetails(result.session.decryptedAccessToken);
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
    const updates = JSON.parse(event.body || '{}');
    const details = await updateOrgDetails(result.session.decryptedAccessToken, updates);
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
    const config = await getOrgConfig(result.session.decryptedAccessToken);
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
    const providers = await getIdentityProviders(result.session.decryptedAccessToken);
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
    const provider = JSON.parse(event.body || '{}');
    const created = await createIdentityProvider(result.session.decryptedAccessToken, provider);
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
    const updates = JSON.parse(event.body || '{}');
    const updated = await updateIdentityProvider(
      result.session.decryptedAccessToken,
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
    await deleteIdentityProvider(result.session.decryptedAccessToken, providerId);
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
