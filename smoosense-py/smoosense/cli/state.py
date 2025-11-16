"""
Server state management for SmooSense.

Manages server state file to track running instances and enable idempotent server startup.
Uses file locking to prevent race conditions when multiple terminals start the server.
"""

import errno
import fcntl
import json
import os
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field


class ServerState(BaseModel):
    """Model for server state information."""

    pid: int = Field(description="Process ID of the running server")
    port: int = Field(description="Port number the server is running on")


def get_state_file_path() -> Path:
    """Get the path to the server state file."""
    state_dir = Path.home() / ".smoosense"
    state_dir.mkdir(exist_ok=True)
    return state_dir / "server-state.json"


def is_process_running(pid: int) -> bool:
    """
    Check if a process with given PID is running.

    Args:
        pid: Process ID to check

    Returns:
        True if process is running, False otherwise
    """
    try:
        # Signal 0 doesn't kill the process, just checks if it exists
        os.kill(pid, 0)
        return True
    except OSError as e:
        # ESRCH = No such process
        return e.errno != errno.ESRCH


def read_server_state() -> Optional[ServerState]:
    """
    Read server state from file with file locking.

    Returns:
        ServerState if file exists and is valid, None otherwise
    """
    state_file = get_state_file_path()

    if not state_file.exists():
        return None

    try:
        with open(state_file) as f:
            # Acquire shared lock for reading
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            try:
                data = json.load(f)
                return ServerState(**data)
            finally:
                # Release lock
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
    except (json.JSONDecodeError, ValueError, OSError):
        # Invalid or corrupted state file
        return None


def write_server_state(state: ServerState) -> None:
    """
    Write server state to file with file locking.

    Args:
        state: ServerState to write
    """
    state_file = get_state_file_path()

    with open(state_file, "w") as f:
        # Acquire exclusive lock for writing
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)
        try:
            json.dump(state.model_dump(), f, indent=2)
            f.flush()
            os.fsync(f.fileno())  # Ensure data is written to disk
        finally:
            # Release lock
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)


def get_running_server() -> Optional[ServerState]:
    """
    Get information about running server if one exists.

    Returns:
        ServerState if server is running, None if no server or server is dead
    """
    state = read_server_state()

    if state is None:
        return None

    # Verify the process is actually running
    if is_process_running(state.pid):
        return state
    else:
        # Process is dead, clean up stale state file
        remove_server_state()
        return None


def remove_server_state() -> None:
    """Remove the server state file."""
    state_file = get_state_file_path()
    try:
        state_file.unlink(missing_ok=True)
    except OSError:
        pass  # Ignore errors if file doesn't exist or can't be removed


def create_server_state(port: int) -> ServerState:
    """
    Create and save server state for current process.

    Args:
        port: Port number the server is running on

    Returns:
        Created ServerState
    """
    state = ServerState(
        pid=os.getpid(),
        port=port,
    )
    write_server_state(state)
    return state


def get_server_url(state: ServerState, path: str = "") -> str:
    """
    Construct full server URL from state.

    Args:
        state: ServerState containing server information
        path: Optional path to append (e.g., "/FolderBrowser")

    Returns:
        Full URL string
    """
    return f"http://localhost:{state.port}{path}"
