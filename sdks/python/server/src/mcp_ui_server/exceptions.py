"""Custom exceptions for MCP UI Server SDK."""


class MCPUIServerError(Exception):
    """Base exception for MCP UI Server SDK errors."""
    pass


class InvalidURIError(MCPUIServerError):
    """Error raised when URI validation fails."""
    pass


class InvalidContentError(MCPUIServerError):
    """Error raised when content validation fails."""
    pass


class EncodingError(MCPUIServerError):
    """Error raised when encoding operations fail."""
    pass