"""Type definitions for MCP UI Server SDK."""

from typing import Any, Literal

from pydantic import BaseModel

# Primary identifier for the resource. Starts with ui://
URI = str  # In TypeScript: `ui://${string}`, but Python doesn't have template literal types

# MIME types for different content types
MimeType = Literal[
    "text/html",
    "text/uri-list", 
    "application/vnd.mcp-ui.remote-dom+javascript; framework=react",
    "application/vnd.mcp-ui.remote-dom+javascript; framework=webcomponents",
]

UIActionType = Literal["tool", "prompt", "link", "intent", "notify"]


class RawHtmlPayload(BaseModel):
    """Raw HTML content payload."""
    type: Literal["rawHtml"]
    htmlString: str


class ExternalUrlPayload(BaseModel):
    """External URL content payload."""
    type: Literal["externalUrl"]
    iframeUrl: str


class RemoteDomPayload(BaseModel):
    """Remote DOM content payload."""
    type: Literal["remoteDom"]
    script: str
    framework: Literal["react", "webcomponents"]


ResourceContentPayload = RawHtmlPayload | ExternalUrlPayload | RemoteDomPayload


# UI Metadata constants
UI_METADATA_PREFIX = "mcpui.dev/ui-"


class UIMetadataKey:
    """Keys for UI metadata."""
    PREFERRED_FRAME_SIZE = "preferred-frame-size"
    INITIAL_RENDER_DATA = "initial-render-data"


class CreateUIResourceOptions(BaseModel):
    """Options for creating a UI resource."""
    uri: URI
    content: ResourceContentPayload
    encoding: Literal["text", "blob"]
    uiMetadata: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None


class GenericActionMessage(BaseModel):
    """Base message structure for UI actions."""
    messageId: str | None = None


class UIActionResultToolCall(GenericActionMessage):
    """Tool call action result."""
    
    class ToolCallPayload(BaseModel):
        """Payload for tool call actions."""
        toolName: str
    
        params: dict[str, Any]
    
    type: Literal["tool"]
    payload: ToolCallPayload


class UIActionResultPrompt(GenericActionMessage):
    """Prompt action result."""
    
    class PromptPayload(BaseModel):
        """Payload for prompt actions."""
        prompt: str
    
    type: Literal["prompt"]
    payload: PromptPayload


class UIActionResultLink(GenericActionMessage):
    """Link action result."""
    
    class LinkPayload(BaseModel):
        """Payload for link actions."""
        url: str
    
    type: Literal["link"]
    payload: LinkPayload


class UIActionResultIntent(GenericActionMessage):
    """Intent action result."""
    
    class IntentPayload(BaseModel):
        """Payload for intent actions."""
        intent: str
        params: dict[str, Any]
    
    type: Literal["intent"]
    payload: IntentPayload


class UIActionResultNotification(GenericActionMessage):
    """Notification action result."""
    
    class NotificationPayload(BaseModel):
        """Payload for notification actions."""
        message: str
    
    type: Literal["notify"]
    payload: NotificationPayload


UIActionResult = (
    UIActionResultToolCall
    | UIActionResultPrompt
    | UIActionResultLink
    | UIActionResultIntent
    | UIActionResultNotification
)