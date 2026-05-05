import type {
  ApiResponse,
  UserInfo,
  AuthStatusResponse,
  CommodityPrice,
  OrgDetails,
  OrgConfig,
  IdentityProvider,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response.json();
}

// Auth API
export function login(): void {
  window.location.href = `${API_URL}/auth/login`;
}

export function signup(): void {
  window.location.href = `${API_URL}/auth/signup`;
}

export function logout(): void {
  window.location.href = `${API_URL}/auth/logout`;
}

export async function getMe(): Promise<ApiResponse<UserInfo>> {
  return request<UserInfo>('/auth/me');
}

export async function getAuthStatus(): Promise<ApiResponse<AuthStatusResponse>> {
  return request<AuthStatusResponse>('/auth/status');
}

// Commodities API (public)
export async function getCommodities(): Promise<ApiResponse<CommodityPrice[]>> {
  return request<CommodityPrice[]>('/commodities');
}

// Organization API
export async function getOrgDetails(): Promise<ApiResponse<OrgDetails>> {
  return request<OrgDetails>('/org/details');
}

export async function updateOrgDetails(
  updates: Partial<OrgDetails>
): Promise<ApiResponse<OrgDetails>> {
  return request<OrgDetails>('/org/details', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function getOrgConfig(): Promise<ApiResponse<OrgConfig>> {
  return request<OrgConfig>('/org/config');
}

export async function getIdentityProviders(): Promise<ApiResponse<IdentityProvider[]>> {
  return request<IdentityProvider[]>('/org/identity-providers');
}

export async function createIdentityProvider(
  provider: Omit<IdentityProvider, 'id'>
): Promise<ApiResponse<IdentityProvider>> {
  return request<IdentityProvider>('/org/identity-providers', {
    method: 'POST',
    body: JSON.stringify(provider),
  });
}

export async function updateIdentityProvider(
  providerId: string,
  updates: Partial<IdentityProvider>
): Promise<ApiResponse<IdentityProvider>> {
  return request<IdentityProvider>(`/org/identity-providers/${providerId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteIdentityProvider(
  providerId: string
): Promise<ApiResponse<void>> {
  return request<void>(`/org/identity-providers/${providerId}`, {
    method: 'DELETE',
  });
}

export async function switchOrg(orgId: string): Promise<ApiResponse<{ orgId: string }>> {
  return request<{ orgId: string }>('/org/switch', {
    method: 'POST',
    body: JSON.stringify({ orgId }),
  });
}
