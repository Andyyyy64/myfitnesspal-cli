# Troubleshooting

## Common Issues

### "Not logged in" error

You need to authenticate first:

```bash
mfp login
# or
mfp auth set-cookie "your-token-here"
```

### `auth status` shows empty but other commands work

MFP uses two session systems. The `/api/auth/session` endpoint (next-auth) has a shorter session lifetime than the `/api/services/*` endpoints. If `auth status` returns empty data but commands like `mfp diary`, `mfp weight`, etc. still work, your service session is still valid.

To fix the display, re-authenticate with a fresh token.

### Food search returns empty results

The food search uses MFP's Next.js `/_next/data/` endpoint which depends on:

1. **Valid session** - The next-auth session must be active (not just the service session)
2. **Correct buildId** - Auto-cached and refreshed, but can become stale

If search returns empty:
- Re-authenticate with `mfp auth set-cookie` using a fresh token from your browser
- The buildId will auto-refresh on 404

### Login fails with no session token

MFP uses Cloudflare protection. If the login endpoint is behind a Cloudflare challenge, the CLI can't complete authentication.

**Workaround:** Use the manual cookie method:
1. Log in via browser
2. Copy the session token from DevTools
3. `mfp auth set-cookie "token"`

### "Failed to X: 401" or "Failed to X: 403"

Session expired. Re-authenticate.

### "Failed to X: 404"

The MFP internal API may have changed. This is a reverse-engineered tool and endpoints can change without notice.

### Commands hang or timeout

MFP's API occasionally has slow responses. If a command hangs:
- Check your internet connection
- Try again
- MFP might be experiencing issues

## Debug Tips

### View raw API responses

Use `--json` to see the full response:

```bash
mfp diary --json
mfp account profile --json
```

### Check config file

```bash
cat ~/.config/mfp-cli/auth.json
```

Verify:
- `sessionToken` is present and not empty
- `buildId` exists (needed for food search)
- `buildIdUpdatedAt` is within the last 24 hours

### Test connectivity

```bash
# Quick check - does the API respond?
mfp weight --json
mfp goals --json
```

If these work, your service session is valid.

## Two Session Types

MFP uses two separate session systems:

1. **next-auth session** (`/api/auth/session`) - Shorter lifetime. Required for food search via `/_next/data/` endpoint. When this expires, `auth status` shows empty and food search stops working.

2. **Service session** (`/api/services/*`) - Longer lifetime. Used by all other commands (diary, weight, water, goals, exercises, etc.). Can remain valid after the next-auth session expires.

If food search returns empty results but other commands work fine, your service session is still valid but the next-auth session has expired. Re-authenticate with a fresh browser cookie to fix food search.

### Food search requires fresh session

The food search endpoint (`/_next/data/{buildId}/...`) requires an active next-auth session. If your session was set via `auth set-cookie` and only the service session is alive, food search will return empty results or redirect to logout. Re-copy the cookie from your browser.

## Known Limitations

- **No OAuth flow** - MFP's partner API requires approval. This tool uses session cookies.
- **Session expiry** - Tokens expire after ~30 days. No auto-refresh.
- **Cloudflare** - Automated login may fail if Cloudflare challenges the request.
- **Rate limiting** - MFP may rate-limit requests. No built-in rate limiting in the CLI.
- **API instability** - Internal APIs can change without notice on any MFP deployment.
- **Exercise logging** - The exercise log POST endpoint (`POST /api/services/diary` with `type: "exercise_entry"`) is not fully working. The backend consistently rejects the request body with a "quantity" validation error. Exercise search, lookup, get, update, and delete all work.
- **Nutrient goals update** - The `POST /api/services/nutrient-goals` endpoint returns 422 for all attempted body formats. The MFP web frontend updates goals via `PATCH /api/services/users` instead. Read-only access to goals works fine.
