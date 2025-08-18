"""Utility functions for MCP UI Server SDK."""

import json
from typing import TYPE_CHECKING, Any, cast

from .types import UIActionResult

if TYPE_CHECKING:
    from .core import UIResource


def validate_uri(uri: str) -> bool:
    """Validate that a URI starts with 'ui://'.
    
    Args:
        uri: The URI to validate
        
    Returns:
        True if valid, False otherwise
    """
    return uri.startswith("ui://")


def serialize_ui_resource(ui_resource: "UIResource") -> dict[str, Any]:
    """Serialize a UIResource to a dictionary.
    
    Args:
        ui_resource: The UIResource instance
        
    Returns:
        Dictionary representation suitable for JSON serialization
    """
    return ui_resource.model_dump()


def serialize_ui_action_result(action_result: UIActionResult) -> str:
    """Serialize a UI action result to JSON.
    
    Args:
        action_result: The action result to serialize
        
    Returns:
        JSON string representation
    """
    return action_result.model_dump_json()


def deserialize_ui_action_result(json_str: str) -> UIActionResult:
    """Deserialize a UI action result from JSON.
    
    Args:
        json_str: JSON string to deserialize
        
    Returns:
        UIActionResult instance
        
    Raises:
        ValueError: If JSON is invalid or doesn't match expected format
    """
    from .types import (
        UIActionResultIntent,
        UIActionResultLink,
        UIActionResultNotification,
        UIActionResultPrompt,
        UIActionResultToolCall,
    )
    
    try:
        data = json.loads(json_str)
        
        # Basic validation
        if not isinstance(data, dict) or "type" not in data or "payload" not in data:
            raise ValueError("Invalid UI action result format")
        
        action_type = cast(str, data["type"])
        
        # Deserialize based on type
        if action_type == "tool":
            return UIActionResultToolCall.model_validate(data)
        elif action_type == "prompt":
            return UIActionResultPrompt.model_validate(data)
        elif action_type == "link":
            return UIActionResultLink.model_validate(data)
        elif action_type == "intent":
            return UIActionResultIntent.model_validate(data)
        elif action_type == "notify":
            return UIActionResultNotification.model_validate(data)
        else:
            raise ValueError(f"Invalid action type: {action_type}")
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {e}") from e


class ReservedUrlParams:
    """Reserved URL parameters for MCP UI."""
    WAIT_FOR_RENDER_DATA = "waitForRenderData"


class InternalMessageType:
    """Internal message types for MCP UI communication."""
    UI_MESSAGE_RECEIVED = "ui-message-received"
    UI_MESSAGE_RESPONSE = "ui-message-response"
    UI_SIZE_CHANGE = "ui-size-change"
    UI_LIFECYCLE_IFRAME_READY = "ui-lifecycle-iframe-ready"
    UI_LIFECYCLE_IFRAME_RENDER_DATA = "ui-lifecycle-iframe-render-data"


def create_iframe_communication_script() -> str:
    """Create JavaScript code for iframe communication.
    
    This generates the JavaScript needed for UI resources to communicate
    with the parent frame.
    
    Returns:
        JavaScript code as a string
    """
    return """
// MCP UI communication script
(function() {
    window.mcpUI = {
        postMessage: function(data) {
            if (window.parent) {
                window.parent.postMessage(data, '*');
            }
        },
        
        onMessage: function(callback) {
            window.addEventListener('message', function(event) {
                callback(event.data);
            });
        }
    };
})();
"""

def wrap_html_with_communication(html_content: str, include_script: bool = True) -> str:
    """Wrap HTML content with MCP UI communication capabilities.
    
    Args:
        html_content: The HTML content to wrap
        include_script: Whether to include the communication script
        
    Returns:
        Enhanced HTML with communication capabilities
    """
    if not include_script:
        return html_content
    
    script = create_iframe_communication_script()
    
    # If HTML already has a head tag, insert script there
    if "<head>" in html_content:
        return html_content.replace(
            "<head>",
            f"<head><script>{script}</script>"
        )
    
    # If HTML has html tag but no head, add head
    if "<html>" in html_content:
        return html_content.replace(
            "<html>",
            f"<html><head><script>{script}</script></head>"
        )
    
    # Otherwise, wrap the entire content
    return f"""<!DOCTYPE html>
<html>
<head>
    <script>{script}</script>
</head>
<body>
{html_content}
</body>
</html>"""