import logging

from rich.console import Console
from rich.logging import RichHandler


class CommaFormatter(logging.Formatter):
    """Custom formatter that adds commas to relativeCreated time"""

    def format(self, record: logging.LogRecord) -> str:
        # Format relativeCreated with commas
        record.relativeCreatedFormatted = f"{int(record.relativeCreated):,}"
        return super().format(record)


# Configure Rich logger with custom formatter and auto-detected console width
console = Console()  # Auto-detect terminal width
handler = RichHandler(rich_tracebacks=True, console=console)
handler.setFormatter(
    CommaFormatter("[%(relativeCreatedFormatted)sms] %(filename)s:%(lineno)d - %(message)s")
)

logging.basicConfig(level=logging.INFO, handlers=[handler])


def getLogger(name: str) -> logging.Logger:
    return logging.getLogger(name)
