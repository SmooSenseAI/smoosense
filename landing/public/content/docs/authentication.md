# Authentication

SmooSense supports optional authentication using Auth0. When configured, all pages require users to log in before accessing the application.

## Overview

Authentication is **optional** by default. If no Auth0 credentials are configured, SmooSense runs without authentication and all pages and APIs are publicly accessible. This is suitable for local development or private deployments.

When Auth0 is configured:
- **Pages**: Unauthenticated users are redirected to Auth0's login page
- **APIs**: Unauthenticated requests return a `401 Unauthorized` JSON error

## Setting Up Auth0

### 1. Create an Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications > Applications**
3. Click **Create Application**
4. Choose **Regular Web Application**
5. Note your **Domain**, **Client ID**, and **Client Secret**

### 2. Configure Callback URLs

In your Auth0 application settings, configure:

- **Allowed Callback URLs**: `http://localhost:8000/auth/callback`
- **Allowed Logout URLs**: `http://localhost:8000, http://localhost:8000/auth/login`

For production, replace `localhost:8000` with your actual domain (e.g., `https://app.example.com` and `https://app.example.com/auth/login`).

### 3. Set Environment Variables

Set the following environment variables before starting SmooSense:

```bash
export AUTH0_DOMAIN="your-tenant.auth0.com"
export AUTH0_CLIENT_ID="your-client-id"
export AUTH0_CLIENT_SECRET="your-client-secret"
export APP_SECRET_KEY="your-random-secret-key"  # Optional, auto-generated if not set
```

You can also create a `.env` file in your project directory with these values.

### 4. Start SmooSense

```bash
sense
```

When Auth0 is properly configured, you'll see a log message:
```
Auth0 authentication enabled
```

## Authentication Flow

1. User visits any protected page (e.g., `/`, `/FolderBrowser`, `/Table`)
2. If not authenticated, user is redirected to `/auth/login`
3. Auth0 handles the login (username/password, SSO, etc.)
4. After successful login, user is redirected back to the application
5. User session is stored and maintained until logout

## API Endpoints

SmooSense provides the following authentication endpoints:

| Endpoint | Description |
|----------|-------------|
| `/auth/login` | Initiates Auth0 login flow (shows account picker) |
| `/auth/logout` | Clears session, logs out from Auth0, and redirects to home |
| `/auth/retry` | Clears session, logs out from Auth0, and redirects to login |
| `/auth/callback` | Handles OAuth callback from Auth0 |
| `/auth/me` | Returns current user info as JSON |

### Check Authentication Status

Visit `/auth/me` in your browser to check the current authentication status.

Returns:
```json
{
  "authenticated": true,
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://..."
}
```

Or if not authenticated:
```json
{
  "authenticated": false
}
```

### API Authentication Errors

When authentication is enabled and an API is called without a valid session, it returns:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

With HTTP status code `401`.

## Restricting Access by Email Domain

You can restrict access to users from specific email domains using Auth0 Actions. In your Auth0 Dashboard:

1. Go to **Actions > Flows > Login**
2. Create a new Action with this code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  if (!event.user.email) {
    api.access.deny('access_denied', 'Email required');
    return;
  }

  const allowList = ['mycorp.com', 'partner.com']; // Your allowed domains

  const parts = event.user.email.split('@');
  const domain = parts[parts.length - 1].toLowerCase();

  if (!allowList.includes(domain)) {
    api.access.deny(
      'access_denied',
      'Only specific email domains are allowed to access this app.'
    );
  }
};
```

3. Deploy the Action and add it to your Login flow

## Troubleshooting

### "Auth0 not configured, running without authentication"

This message appears when environment variables are not set. Verify:
- `AUTH0_DOMAIN` is set
- `AUTH0_CLIENT_ID` is set
- `AUTH0_CLIENT_SECRET` is set

### Callback URL Mismatch

Ensure your Auth0 application's "Allowed Callback URLs" exactly matches `http://your-host:port/auth/callback`.

### Session Not Persisting

If sessions aren't persisting across requests, ensure:
1. `APP_SECRET_KEY` is set consistently (not auto-generated each restart)
2. Cookies are enabled in the browser
