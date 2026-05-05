import * as jose from 'jose';
import type { TokenSet, IdTokenClaims } from './types.js';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'devlabs.demo-connect.us';
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || '';
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET || '';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || ''; // Custom API audience, not My Org
const AUTH0_MYORG_AUDIENCE = process.env.AUTH0_MYORG_AUDIENCE || ''; // My Org API (original tenant domain)
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://myaccount.demo-connect.us';
const BACKEND_URL = process.env.BACKEND_URL || ''; // Lambda Function URL for callbacks

// Basic OIDC scopes only - My Org API requires original tenant domain, not custom domain
const AUTH0_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
].join(' ');

let jwks: jose.JWTVerifyGetKey | null = null;

async function getJWKS(): Promise<jose.JWTVerifyGetKey> {
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));
  }
  return jwks;
}

export async function generateLoginUrl(state: string, codeVerifier: string): Promise<string> {
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  // Callback goes to BFF (Lambda), not frontend
  const callbackUrl = BACKEND_URL ? `${BACKEND_URL}/auth/callback` : `${FRONTEND_URL}/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH0_CLIENT_ID,
    redirect_uri: callbackUrl,
    scope: AUTH0_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  // Only add audience if configured (for custom API)
  if (AUTH0_AUDIENCE) {
    params.set('audience', AUTH0_AUDIENCE);
  }

  return `https://${AUTH0_DOMAIN}/authorize?${params.toString()}`;
}

export async function generateSignupUrl(state: string, codeVerifier: string): Promise<string> {
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const callbackUrl = BACKEND_URL ? `${BACKEND_URL}/auth/callback` : `${FRONTEND_URL}/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: AUTH0_CLIENT_ID,
    redirect_uri: callbackUrl,
    scope: AUTH0_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    screen_hint: 'signup',
  });

  // Only add audience if configured (for custom API)
  if (AUTH0_AUDIENCE) {
    params.set('audience', AUTH0_AUDIENCE);
  }

  return `https://${AUTH0_DOMAIN}/authorize?${params.toString()}`;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hashBuffer));
}

function base64UrlEncode(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<TokenSet> {
  const callbackUrl = BACKEND_URL ? `${BACKEND_URL}/auth/callback` : `${FRONTEND_URL}/callback`;

  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

export async function verifyIdToken(idToken: string): Promise<IdTokenClaims> {
  const jwksClient = await getJWKS();

  const { payload } = await jose.jwtVerify(idToken, jwksClient, {
    issuer: `https://${AUTH0_DOMAIN}/`,
    audience: AUTH0_CLIENT_ID,
  });

  return payload as unknown as IdTokenClaims;
}

export async function verifyLogoutToken(
  logoutToken: string
): Promise<{ sid?: string; sub?: string }> {
  const jwksClient = await getJWKS();

  const { payload } = await jose.jwtVerify(logoutToken, jwksClient, {
    issuer: `https://${AUTH0_DOMAIN}/`,
    audience: AUTH0_CLIENT_ID,
  });

  // Validate logout token claims
  if (!payload.events || !(payload.events as Record<string, unknown>)['http://schemas.openid.net/event/backchannel-logout']) {
    throw new Error('Invalid logout token: missing backchannel-logout event');
  }

  return {
    sid: payload.sid as string | undefined,
    sub: payload.sub as string | undefined,
  };
}

export async function getUserOrganizations(accessToken: string): Promise<string[]> {
  // The user's organizations come from the ID token org_id claim
  // or can be fetched from Auth0 Management API if needed
  // For now, we'll rely on the org_id from the ID token
  return [];
}

// Exchange refresh token for My Org API scoped access token
export async function exchangeForMyOrgToken(refreshToken: string): Promise<TokenSet | null> {
  if (!AUTH0_MYORG_AUDIENCE) {
    return null;
  }

  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      refresh_token: refreshToken,
      audience: AUTH0_MYORG_AUDIENCE,
      scope: [
        'openid',
        'offline_access',
        'read:my_org:configuration',
        'read:my_org:details',
        'update:my_org:details',
        'read:my_org:identity_providers',
        'create:my_org:identity_providers',
        'update:my_org:identity_providers',
        'delete:my_org:identity_providers',
      ].join(' '),
    }),
  });

  if (!response.ok) {
    console.error('My Org token exchange failed:', await response.text());
    return null;
  }

  return response.json();
}

export function generateLogoutUrl(returnTo: string): string {
  const params = new URLSearchParams({
    client_id: AUTH0_CLIENT_ID,
    returnTo,
  });

  return `https://${AUTH0_DOMAIN}/v2/logout?${params.toString()}`;
}
