import type { NotificationEvent } from './notificationEvents.ts';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function oauthToken(serviceAccountJson: string): Promise<{ token: string; projectId: string }> {
  const account = JSON.parse(serviceAccountJson) as ServiceAccount;
  if (!account.project_id || !account.client_email || !account.private_key) {
    throw new Error('Incomplete FCM service account');
  }
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return { token: cachedToken.value, projectId: account.project_id };
  }

  const now = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const header = base64Url(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = base64Url(encoder.encode(JSON.stringify({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })));
  const unsigned = `${header}.${claims}`;
  const privateKey = Uint8Array.from(atob(account.private_key
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')),
  (character) => character.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', privateKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(unsigned));
  const assertion = `${unsigned}.${base64Url(new Uint8Array(signature))}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`FCM OAuth HTTP ${response.status}`);
  const data = await response.json() as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Math.min(data.expires_in, 3600) * 1000 - 60_000 };
  return { token: data.access_token, projectId: account.project_id };
}

export async function sendFcm(
  serviceAccountJson: string,
  deviceToken: string,
  event: NotificationEvent,
): Promise<void> {
  const { token, projectId } = await oauthToken(serviceAccountJson);
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        android: {
          priority: event.sticky ? 'NORMAL' : 'HIGH',
          ttl: '90s',
          notification: {
            title: event.title,
            body: event.body,
            tag: event.tag,
            sticky: event.sticky,
            channel_id: event.channelId,
          },
        },
      },
    }),
  });
  if (!response.ok) throw new Error(`FCM HTTP ${response.status}`);
}
