import logging
from functools import wraps
from typing import Any, Callable

from flask import Response, jsonify, request
from werkzeug.exceptions import BadRequest

from smoosense.exceptions import AccessDeniedException, InvalidInputException

logger = logging.getLogger(__name__)


def make_error_response(e: Exception, code: int = 500) -> tuple[Response, int]:
    c = e.__class__
    return jsonify({"error": str(e), "exception": c.__module__ + "." + c.__name__}), code


def handle_api_errors(f: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator to handle API errors consistently across all endpoint handlers.
    Returns 400 for InvalidInputException and 500 for unknown exceptions.
    """

    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        try:
            return f(*args, **kwargs)
        except (AssertionError, InvalidInputException, BadRequest) as e:
            return make_error_response(e, 400)
        except (PermissionError, AccessDeniedException) as e:
            return make_error_response(e, 403)
        except FileNotFoundError as e:
            return make_error_response(e, 404)
        except Exception as e:
            logger.exception(e)
            return make_error_response(e, 500)

    return wrapper


def require_arg(key: str) -> str:
    value = request.args.get(key)
    if not value:
        raise InvalidInputException(f"Missing required parameter: {key}")
    return value
