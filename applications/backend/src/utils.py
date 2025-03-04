import logging
from logging import Formatter, LogRecord
from typing import Any, cast


class ColorFormatter(Formatter):
    """Logging formatter with colorized output.

    Attributes:
      LEVEL_COLORS (dict): Dictionary of log level to color code for levelname
      NAMED_COLORS (dict): Dictionary of named color strings to color code for message
      RESET (str): Reset color code
    """

    LEVEL_COLORS = {
        logging.DEBUG: "\033[34m",  # Blue
        logging.INFO: "\033[32m",  # Green
        logging.WARNING: "\033[33m",  # Yellow
        logging.ERROR: "\033[31m",  # Red
        logging.CRITICAL: "\033[35m",  # Magenta
    }

    NAMED_COLORS = {
        "gray": "\033[90m",
        "red": "\033[31m",
        "green": "\033[32m",
        "yellow": "\033[33m",
        "blue": "\033[34m",
        "magenta": "\033[35m",
        "cyan": "\033[36m",
        "white": "\033[97m",
    }

    RESET = "\033[0m"  # reset color

    def format(self, record: LogRecord) -> str:
        """Format log record with colorized output.

        Args:
          record (LogRecord): log record

        Returns:
          str: formatted log record
        """
        # Colorize levelname
        level_color = self.LEVEL_COLORS.get(record.levelno, self.RESET)
        levelname_colored = f"{level_color}{record.levelname}{self.RESET}"

        msg_color_name = getattr(record, "color", None)
        if msg_color_name and msg_color_name in self.NAMED_COLORS:
            msg_color = self.NAMED_COLORS[msg_color_name]
        else:
            msg_color = ""

        original_msg = record.getMessage()
        colored_msg = f"{msg_color}{original_msg}{self.RESET}"

        backup = record.msg
        record.msg = colored_msg

        show_prefix = getattr(record, "show_prefix", True)
        if show_prefix:
            log_format = f"[%(name)s] {levelname_colored}: %(message)s"
        else:
            log_format = "%(message)s"

        self._style = logging.PercentStyle(log_format)

        try:
            formatted = super().format(record)
        finally:
            record.msg = backup

        return formatted


class ColorLogger(logging.Logger):
    """Logger with colorized output.

    Attributes:
      info (Callable): Info log with colorized output
    """

    def info(  # type: ignore[override]
        self,
        msg: str,
        color: str = "gray",
        show_prefix: bool = True,
        *args: Any,
        **kwargs: Any,
    ) -> None:
        """Info log with colorized output.

        Args:
          msg (str): log message
          color (str, optional): color name. Defaults to "gray".
          show_prefix (bool, optional): whether to include the prefix. Defaults to True.
          *args: extra arguments (We don't use this)
          **kwargs: extra keyword arguments (We use this to pass color and show_prefix)
        """
        if "extra" not in kwargs:
            kwargs["extra"] = {}
        kwargs["extra"]["color"] = color
        kwargs["extra"]["show_prefix"] = show_prefix
        super().info(msg, *args, **kwargs)


def setup_logger(name: str, level: int = logging.INFO) -> ColorLogger:
    """Setup logger with colorized output.

    Args:
      name (str): logger name
      level (int, optional): logging level. Defaults to logging.INFO.

    Returns:
      ColorLogger: The colorized logger
    """
    logging.setLoggerClass(ColorLogger)

    logger = cast(ColorLogger, logging.getLogger(name))
    logger.setLevel(level)

    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)

    # Add color formatter to console handler
    console_handler.setFormatter(ColorFormatter())

    # Add console handler to logger if not exists
    if not logger.hasHandlers():
        logger.addHandler(console_handler)

    # Disable propagation to avoid duplicate logs
    logger.propagate = False

    return logger
