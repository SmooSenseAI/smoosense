"""Auth0 authentication handler for SmooSense.

Documentation:
- Human: https://smoosense.ai/docs/authentication
- AI: Read ../../../landing/public/content/docs/authentication.md
"""

import json
import logging
import os
from functools import wraps
from typing import Any, Callable, Optional, TypeVar, Union
from urllib.parse import quote_plus, urlencode

from authlib.integrations.flask_client import OAuth
from flask import Blueprint, Response, current_app, redirect, request, session, url_for
from werkzeug.wrappers import Response as WerkzeugResponse

auth_bp = Blueprint("auth", __name__)

logger = logging.getLogger(__name__)

# Type variable for decorator
F = TypeVar("F", bound=Callable[..., Any])

# Union type for responses that could be either Flask or Werkzeug Response
AnyResponse = Union[Response, WerkzeugResponse]

# Cache the generated secret key so it persists across requests
_cached_secret_key: Optional[str] = None


def get_auth0_config() -> Optional[dict[str, str]]:
    """Get Auth0 configuration from environment variables.

    Returns None if Auth0 is not configured.
    """
    domain = os.getenv("AUTH0_DOMAIN")
    client_id = os.getenv("AUTH0_CLIENT_ID")
    client_secret = os.getenv("AUTH0_CLIENT_SECRET")

    if not all([domain, client_id, client_secret]):
        return None

    # We've already checked these are not None
    assert domain is not None
    assert client_id is not None
    assert client_secret is not None

    return {
        "domain": domain,
        "client_id": client_id,
        "client_secret": client_secret,
    }


def is_auth_enabled() -> bool:
    """Check if authentication is enabled."""
    return get_auth0_config() is not None


def init_oauth(app: Any) -> Optional[OAuth]:
    """Initialize OAuth with Auth0 configuration.

    Returns None if Auth0 is not configured.
    """
    global _cached_secret_key

    config = get_auth0_config()
    if config is None:
        return None

    # Set a secret key for session management
    # Use cached key to ensure consistency across the app lifecycle
    secret_key = os.getenv("APP_SECRET_KEY")
    if not secret_key:
        if _cached_secret_key is None:
            _cached_secret_key = os.urandom(24).hex()
            logger.warning(
                "APP_SECRET_KEY not set. Using auto-generated key. "
                "Sessions will be lost on restart."
            )
        secret_key = _cached_secret_key

    app.secret_key = secret_key

    oauth = OAuth(app)
    oauth.register(
        "auth0",
        client_id=config["client_id"],
        client_secret=config["client_secret"],
        client_kwargs={
            "scope": "openid profile email",
        },
        server_metadata_url=f"https://{config['domain']}/.well-known/openid-configuration",
    )

    return oauth


def _check_auth() -> Optional[str]:
    """Check if user is authenticated.

    Returns None if authenticated or auth is disabled.
    Returns error message if not authenticated.
    """
    if not is_auth_enabled():
        return None

    if "user" not in session:
        return "Authentication required"

    return None


def requires_auth(f: F) -> F:
    """Decorator to require authentication for a page route.

    If Auth0 is not configured, the route is accessible without authentication.
    Redirects to login page if not authenticated.
    Saves the original URL to redirect back after login.
    """

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        auth_error = _check_auth()
        if auth_error:
            # Save the original URL to redirect back after login
            session["next_url"] = request.url
            logger.info(f"No user in session, redirecting to login. Will return to: {request.url}")
            return redirect(url_for("auth.login"))

        return f(*args, **kwargs)

    return decorated  # type: ignore[return-value]


def requires_auth_api(f: F) -> F:
    """Decorator to require authentication for an API route.

    If Auth0 is not configured, the route is accessible without authentication.
    Returns 401 JSON error if not authenticated.
    """

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        auth_error = _check_auth()
        if auth_error:
            return Response(
                json.dumps({"error": "Unauthorized", "message": auth_error}),
                status=401,
                mimetype="application/json",
            )

        return f(*args, **kwargs)

    return decorated  # type: ignore[return-value]


@auth_bp.route("/login")
def login() -> AnyResponse:
    """Redirect to Auth0 login page."""
    oauth = current_app.config.get("OAUTH")
    if oauth is None:
        return redirect("/")

    callback_url = url_for("auth.callback", _external=True)
    logger.info(f"Redirecting to Auth0 with callback URL: {callback_url}")

    # prompt="select_account" forces account picker to show every time
    result: AnyResponse = oauth.auth0.authorize_redirect(
        redirect_uri=callback_url,
        prompt="select_account",
    )
    return result


@auth_bp.route("/callback")
def callback() -> AnyResponse:
    """Handle Auth0 callback after login."""
    logger.info(f"Auth0 callback received. Args: {request.args}")

    oauth = current_app.config.get("OAUTH")
    if oauth is None:
        logger.error("OAuth not configured in callback")
        return redirect("/")

    # Check for error from Auth0
    error = request.args.get("error")
    if error:
        error_description = request.args.get("error_description", "Unknown error")
        logger.error(f"Auth0 returned error: {error} - {error_description}")
        return Response(
            f"""<!DOCTYPE html>
<html>
<head>
    <title>Access Denied</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }}
        .container {{
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
        }}
        h1 {{ color: #e53e3e; margin-bottom: 16px; }}
        p {{ color: #666; margin-bottom: 24px; }}
        a {{
            display: inline-block;
            padding: 10px 20px;
            background: #3182ce;
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }}
        a:hover {{ background: #2c5282; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Access Denied</h1>
        <p>{error_description}</p>
        <a href="/auth/retry">Try Again</a>
    </div>
</body>
</html>""",
            status=403,
            mimetype="text/html",
        )

    try:
        logger.info("Exchanging authorization code for token...")
        token = oauth.auth0.authorize_access_token()
        userinfo = token.get("userinfo", {})
        logger.info(f"Auth0 callback successful for user: {userinfo.get('email')}")
        logger.info(f"Auth0 userinfo: {userinfo}")

        # Get the original URL before clearing it from session
        next_url = session.pop("next_url", "/")

        # Store only essential user info to avoid cookie size limits
        # Full token can be 4KB+ which exceeds browser cookie limits
        session["user"] = {
            "email": userinfo.get("email"),
            "name": userinfo.get("name"),
            "picture": userinfo.get("picture"),
            "sub": userinfo.get("sub"),  # Auth0 user ID
        }
        session.modified = True
        logger.info(f"Session after setting user - keys: {list(session.keys())}")
        logger.info(f"Redirecting to: {next_url}")
        return redirect(next_url)
    except Exception as e:
        logger.exception(f"Auth0 callback failed: {e}")
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            mimetype="application/json",
        )


@auth_bp.route("/logout")
def logout() -> AnyResponse:
    """Log out and redirect to home page."""
    session.clear()

    config = get_auth0_config()
    if config is None:
        return redirect("/")

    # Redirect to Auth0 logout endpoint, then back to home
    return redirect(
        f"https://{config['domain']}/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("pages.home", _external=True),
                "client_id": config["client_id"],
            },
            quote_via=quote_plus,
        )
    )


@auth_bp.route("/retry")
def retry() -> AnyResponse:
    """Clear session and redirect to login to pick a different account."""
    session.clear()

    config = get_auth0_config()
    if config is None:
        return redirect("/")

    # Redirect to Auth0 logout endpoint, then back to login
    return redirect(
        f"https://{config['domain']}/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("auth.login", _external=True),
                "client_id": config["client_id"],
            },
            quote_via=quote_plus,
        )
    )


@auth_bp.route("/me")
def me() -> Response:
    """Return current user info as JSON."""
    if "user" not in session:
        return Response(
            json.dumps({"authenticated": False}),
            status=200,
            mimetype="application/json",
        )

    user = session["user"]
    return Response(
        json.dumps(
            {
                "authenticated": True,
                "email": user.get("email"),
                "name": user.get("name"),
                "picture": user.get("picture"),
            }
        ),
        status=200,
        mimetype="application/json",
    )
