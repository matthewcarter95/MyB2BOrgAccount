import type { OrgDetails, OrgConfig, IdentityProvider } from './types.js';

const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'https://violet-hookworm-18506.cic-demo-platform.auth0app.com/my-org/';

async function myOrgRequest<T>(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${AUTH0_AUDIENCE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`My Org API error (${response.status}): ${error}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export async function getOrgDetails(accessToken: string): Promise<OrgDetails> {
  return myOrgRequest<OrgDetails>(accessToken, 'details');
}

export async function updateOrgDetails(
  accessToken: string,
  updates: Partial<OrgDetails>
): Promise<OrgDetails> {
  return myOrgRequest<OrgDetails>(accessToken, 'details', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function getOrgConfig(accessToken: string): Promise<OrgConfig> {
  return myOrgRequest<OrgConfig>(accessToken, 'configuration');
}

export async function getIdentityProviders(accessToken: string): Promise<IdentityProvider[]> {
  return myOrgRequest<IdentityProvider[]>(accessToken, 'identity-providers');
}

export async function createIdentityProvider(
  accessToken: string,
  provider: Omit<IdentityProvider, 'id'>
): Promise<IdentityProvider> {
  return myOrgRequest<IdentityProvider>(accessToken, 'identity-providers', {
    method: 'POST',
    body: JSON.stringify(provider),
  });
}

export async function updateIdentityProvider(
  accessToken: string,
  providerId: string,
  updates: Partial<IdentityProvider>
): Promise<IdentityProvider> {
  return myOrgRequest<IdentityProvider>(accessToken, `identity-providers/${providerId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteIdentityProvider(
  accessToken: string,
  providerId: string
): Promise<void> {
  await myOrgRequest<void>(accessToken, `identity-providers/${providerId}`, {
    method: 'DELETE',
  });
}
