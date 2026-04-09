# Authentication

myfitnesspal-cli uses MyFitnessPal's internal session cookies for authentication. There are two ways to authenticate.

## Method 1: Login with credentials

```bash
mfp login
```

You'll be prompted for your email and password. You can also pass them directly:

```bash
mfp login --email you@example.com --password yourpass
```

This sends credentials to MFP's next-auth `/api/auth/callback/credentials` endpoint and stores the returned session token.

**Note:** This may fail if Cloudflare challenges the request. Use Method 2 as fallback.

## Method 2: Set session cookie manually

1. Open https://www.myfitnesspal.com and log in
2. Open DevTools (F12) -> Application -> Cookies -> `www.myfitnesspal.com`
3. Copy the value of `__Secure-next-auth.session-token`
4. Run:

```bash
mfp auth set-cookie "eyJhbG..."
```

## Check auth status

```bash
mfp auth status
mfp auth status --json
```

## How it works

- Session token is stored in `~/.config/mfp-cli/auth.json` with `0600` permissions
- The token is sent as a cookie with every API request
- MFP uses two session systems:
  - **next-auth session** (`/api/auth/*`) - for the Next.js frontend, shorter lived
  - **Service session** (`/api/services/*`, `/api/user-measurements/*`) - for backend APIs, longer lived
- If `auth status` shows empty but other commands work, the next-auth session expired while the service session is still valid

## Token expiry

Session tokens expire after approximately 30 days. When expired, commands will return 401/403 errors. Re-authenticate using either method above.

## Config file

`~/.config/mfp-cli/auth.json`:

```json
{
  "sessionToken": "eyJhbG...",
  "buildId": "WUqel2fuJzZCpcOfgs7xR",
  "buildIdUpdatedAt": "2026-04-09T15:00:00.000Z",
  "userId": "101867535101485"
}
```

- `sessionToken` - MFP session cookie
- `buildId` - Next.js build ID (for food search), auto-refreshed every 24h
- `userId` - MFP user ID, populated on login/set-cookie
