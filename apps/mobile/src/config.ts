/**
 * App configuration.
 *
 * The mobile app talks ONLY to the live production backend (EC2 + Docker) —
 * there is no local/dev backend. Both debug (on-device dev) and release builds
 * use the same production API, reached through Caddy exactly like the website.
 */

// Live production API (Caddy strips the /api prefix and proxies to the Nest API
// container). Health check: GET https://65.0.112.234.sslip.io/api/ -> { status: 'ok' }
export const API_BASE_URL = 'https://65.0.112.234.sslip.io/api';

// Google OAuth *Web* client ID — this is the audience the backend verifies the
// ID token ("credential") against. Client IDs are not secrets (they ship in
// every OAuth client), so this is safe to keep in source.
export const GOOGLE_WEB_CLIENT_ID =
  '610341952875-kjn2ja26mnbt1f8o6kes7ke48p3dmo9u.apps.googleusercontent.com';

export const APP_NAME = 'Zamindar Plus';
export const APP_VERSION = '1.0.0';
