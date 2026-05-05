import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import type { Session, IdTokenClaims, TokenSet } from './types.js';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.SESSIONS_TABLE || 'eadm-sessions';

const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || 'default-dev-key-change-in-prod';

function encrypt(text: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const key = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const encrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length];
  }
  return Buffer.from(encrypted).toString('base64');
}

function decrypt(encoded: string): string {
  const data = Buffer.from(encoded, 'base64');
  const encoder = new TextEncoder();
  const key = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const decrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    decrypted[i] = data[i] ^ key[i % key.length];
  }
  return new TextDecoder().decode(decrypted);
}

export async function createSession(
  tokens: TokenSet,
  claims: IdTokenClaims,
  orgs: string[]
): Promise<Session> {
  const sessionId = uuidv4();
  const now = Date.now();
  const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  const namespace = 'https://example.com';
  const roles = claims[`${namespace}/roles`] || [];
  const subscriptionTier = claims[`${namespace}/subscription_tier`] || 'basic';
  const fgaUserId = claims[`${namespace}/fga_user_id`] || '';

  const session: Session = {
    sessionId,
    sid: claims.sid,
    userId: claims.sub,
    fgaUserId,
    orgId: claims.org_id || orgs[0] || '',
    orgs,
    roles,
    subscriptionTier,
    idToken: encrypt(tokens.id_token),
    accessToken: encrypt(tokens.access_token),
    refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : '',
    expiresAt: Math.floor((now + SESSION_DURATION_MS) / 1000),
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: session,
    })
  );

  return session;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { sessionId },
    })
  );

  if (!result.Item) {
    return null;
  }

  return result.Item as Session;
}

export async function getSessionWithDecryptedTokens(
  sessionId: string
): Promise<(Session & { decryptedAccessToken: string; decryptedIdToken: string }) | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  return {
    ...session,
    decryptedAccessToken: decrypt(session.accessToken),
    decryptedIdToken: decrypt(session.idToken),
  };
}

export async function updateSessionOrg(sessionId: string, newOrgId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { sessionId },
      UpdateExpression: 'SET orgId = :orgId',
      ExpressionAttributeValues: {
        ':orgId': newOrgId,
      },
    })
  );
}

export async function updateSessionTokens(
  sessionId: string,
  tokens: TokenSet
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { sessionId },
      UpdateExpression: 'SET accessToken = :accessToken, idToken = :idToken, refreshToken = :refreshToken',
      ExpressionAttributeValues: {
        ':accessToken': encrypt(tokens.access_token),
        ':idToken': encrypt(tokens.id_token),
        ':refreshToken': tokens.refresh_token ? encrypt(tokens.refresh_token) : '',
      },
    })
  );
}

export async function revokeSession(sessionId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { sessionId },
      UpdateExpression: 'SET revokedAt = :revokedAt',
      ExpressionAttributeValues: {
        ':revokedAt': Date.now(),
      },
    })
  );
}

export async function revokeSessionsBySid(sid: string): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'sid-index',
      KeyConditionExpression: 'sid = :sid',
      ExpressionAttributeValues: {
        ':sid': sid,
      },
    })
  );

  const sessions = result.Items || [];
  const now = Date.now();

  await Promise.all(
    sessions.map((session) =>
      docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { sessionId: session.sessionId },
          UpdateExpression: 'SET revokedAt = :revokedAt',
          ExpressionAttributeValues: {
            ':revokedAt': now,
          },
        })
      )
    )
  );

  return sessions.length;
}

export async function revokeSessionsByUserId(userId: string): Promise<number> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    })
  );

  const sessions = result.Items || [];
  const now = Date.now();

  await Promise.all(
    sessions.map((session) =>
      docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { sessionId: session.sessionId },
          UpdateExpression: 'SET revokedAt = :revokedAt',
          ExpressionAttributeValues: {
            ':revokedAt': now,
          },
        })
      )
    )
  );

  return sessions.length;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { sessionId },
    })
  );
}

export function isSessionValid(session: Session): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (session.revokedAt) return false;
  if (session.expiresAt < now) return false;
  return true;
}

// PKCE state storage for OAuth flow (survives across Lambda invocations)
interface PkceState {
  sessionId: string; // PK - use state as sessionId with 'pkce:' prefix
  codeVerifier: string;
  expiresAt: number; // TTL
}

export async function storePkceState(state: string, codeVerifier: string): Promise<void> {
  const item: PkceState = {
    sessionId: `pkce:${state}`,
    codeVerifier,
    expiresAt: Math.floor((Date.now() + 10 * 60 * 1000) / 1000), // 10 min TTL
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}

export async function getPkceState(state: string): Promise<string | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { sessionId: `pkce:${state}` },
    })
  );

  if (!result.Item) {
    return null;
  }

  const pkce = result.Item as PkceState;

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (pkce.expiresAt < now) {
    return null;
  }

  return pkce.codeVerifier;
}

export async function deletePkceState(state: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { sessionId: `pkce:${state}` },
    })
  );
}
