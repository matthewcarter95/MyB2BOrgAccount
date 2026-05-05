export interface Session {
  sessionId: string;
  sid: string;
  userId: string;
  fgaUserId: string;
  orgId: string;
  orgs: string[];
  roles: string[];
  subscriptionTier: string;
  idToken: string;
  accessToken: string;
  refreshToken: string;
  revokedAt?: number;
  expiresAt: number;
  createdAt: number;
}

export interface TokenSet {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export interface IdTokenClaims {
  sub: string;
  sid: string;
  org_id?: string;
  'https://example.com/roles'?: string[];
  'https://example.com/subscription_tier'?: string;
  'https://example.com/fga_user_id'?: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface UserInfo {
  userId: string;
  email?: string;
  name?: string;
  picture?: string;
  orgId: string;
  orgs: string[];
  roles: string[];
  subscriptionTier: string;
  isAdmin: boolean;
}

export interface OrgDetails {
  id: string;
  name: string;
  display_name?: string;
  branding?: {
    logo_url?: string;
    colors?: {
      primary?: string;
      page_background?: string;
    };
  };
  metadata?: Record<string, string>;
}

export interface OrgConfig {
  enabled_connections: {
    connection_id: string;
    assign_membership_on_login: boolean;
    show_as_button: boolean;
  }[];
}

export interface IdentityProvider {
  id: string;
  name: string;
  display_name?: string;
  strategy: string;
  options?: Record<string, unknown>;
}

export interface CommodityPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthStatusResponse {
  valid: boolean;
  reason?: 'expired' | 'revoked' | 'not_found';
}
