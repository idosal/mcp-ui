# MCP UI Server SDK for Python

A Python SDK for creating MCP UI resources on the server side, enabling rich interactive experiences in MCP applications.

## Installation

```bash
pip install mcp-ui-server
```

## Quick Start

```python
from mcp_ui_server import create_ui_resource

# Create an HTML resource
resource = create_ui_resource({
    "uri": "ui://my-component",
    "content": {
        "type": "rawHtml",
        "htmlString": "<h1>Hello MCP UI!</h1>"
    },
    "encoding": "text"
})

# Use in MCP tool result
tool_result = {
    "content": [resource.to_dict()]
}
```

## Features

### Resource Types

The SDK supports three main content types:

#### 1. Raw HTML
Direct HTML content for embedding in the UI:

```python
html_resource = create_ui_resource({
    "uri": "ui://html-example",
    "content": {
        "type": "rawHtml", 
        "htmlString": "<div><h1>Dynamic Content</h1><p>Generated server-side</p></div>"
    },
    "encoding": "text"  # or "blob" for base64 encoding
})
```

#### 2. External URLs
Embed external websites via iframe:

```python
url_resource = create_ui_resource({
    "uri": "ui://external-site",
    "content": {
        "type": "externalUrl",
        "iframeUrl": "https://example.com"
    },
    "encoding": "text"
})
```

#### 3. Remote DOM Components
Interactive components using React or Web Components:

```python
# React component
react_resource = create_ui_resource({
    "uri": "ui://react-component",
    "content": {
        "type": "remoteDom",
        "script": """
            function WeatherWidget({ location }) {
                return (
                    <div>
                        <h3>Weather for {location}</h3>
                        <p>Temperature: 72°F</p>
                    </div>
                );
            }
        """,
        "framework": "react"
    },
    "encoding": "text"
})

# Web Components
wc_resource = create_ui_resource({
    "uri": "ui://web-component", 
    "content": {
        "type": "remoteDom",
        "script": """
            class StatusIndicator extends HTMLElement {
                connectedCallback() {
                    this.innerHTML = `
                        <div style="color: green;">
                            ✅ System Online
                        </div>
                    `;
                }
            }
            customElements.define('status-indicator', StatusIndicator);
        """,
        "framework": "webcomponents"
    },
    "encoding": "blob"
})
```

### Encoding Options

Choose between text and blob encoding:

- **text**: Direct string content (recommended for development)
- **blob**: Base64-encoded content (recommended for production)

```python
# Text encoding - content stored as plain text
text_resource = create_ui_resource({
    "uri": "ui://text-example",
    "content": {"type": "rawHtml", "htmlString": "<p>Text content</p>"},
    "encoding": "text"
})

# Blob encoding - content base64 encoded
blob_resource = create_ui_resource({
    "uri": "ui://blob-example", 
    "content": {"type": "rawHtml", "htmlString": "<p>Blob content</p>"},
    "encoding": "blob"
})
```

### UI Actions

Create action results for user interactions:

```python
from mcp_ui_server import (
    ui_action_result_tool_call,
    ui_action_result_prompt,
    ui_action_result_link,
    ui_action_result_intent,
    ui_action_result_notification
)

# Tool execution
tool_action = ui_action_result_tool_call("search_database", {
    "query": "user input",
    "limit": 10
})

# User prompt
prompt_action = ui_action_result_prompt("Enter search query:")

# External link
link_action = ui_action_result_link("https://docs.example.com")

# Intent trigger
intent_action = ui_action_result_intent("show_details", {
    "item_id": "123"
})

# Notification
notify_action = ui_action_result_notification("Search completed!")
```

## Advanced Usage

### MCP Integration

Convert UI resources for MCP tool results:

```python
from mcp_ui_server.utils import create_mcp_tool_result_content

# Create resource
resource = create_ui_resource({...})

# Convert to MCP format
mcp_content = create_mcp_tool_result_content(resource)

# Use in tool result
return {
    "content": [mcp_content],
    "isError": False
}
```

### HTML Enhancement

Automatically enhance HTML with communication capabilities:

```python
from mcp_ui_server.utils import wrap_html_with_communication

# Basic HTML
html = "<div>My content</div>"

# Enhanced with MCP UI communication
enhanced_html = wrap_html_with_communication(html)

# Use in resource
resource = create_ui_resource({
    "uri": "ui://enhanced-html",
    "content": {"type": "rawHtml", "htmlString": enhanced_html},
    "encoding": "text"
})
```

### Error Handling

The SDK provides specific exception types:

```python
from mcp_ui_server.exceptions import (
    MCPUIServerError,
    InvalidURIError,
    InvalidContentError,
    EncodingError
)

try:
    resource = create_ui_resource({
        "uri": "invalid://test",  # Must start with ui://
        "content": {"type": "rawHtml", "htmlString": "<p>Test</p>"},
        "encoding": "text"
    })
except InvalidURIError as e:
    print(f"URI validation failed: {e}")
except InvalidContentError as e:
    print(f"Content validation failed: {e}")
except MCPUIServerError as e:
    print(f"General SDK error: {e}")
```

## API Reference

### Core Functions

#### `create_ui_resource(options: CreateUIResourceOptions) -> UIResource`

Creates a UI resource from the given options.

**Parameters:**
- `options`: Configuration dictionary with `uri`, `content`, and `encoding`

**Returns:**
- `UIResource` instance ready for use in MCP tool results

#### Action Result Functions

- `ui_action_result_tool_call(tool_name: str, params: dict) -> UIActionResultToolCall`
- `ui_action_result_prompt(prompt: str) -> UIActionResultPrompt`
- `ui_action_result_link(url: str) -> UIActionResultLink`
- `ui_action_result_intent(intent: str, params: dict) -> UIActionResultIntent`
- `ui_action_result_notification(message: str) -> UIActionResultNotification`

### Types

#### `CreateUIResourceOptions`

```python
{
    "uri": str,  # Must start with "ui://"
    "content": Union[RawHtmlPayload, ExternalUrlPayload, RemoteDomPayload],
    "encoding": Literal["text", "blob"]
}
```

#### Content Payloads

```python
# Raw HTML
{
    "type": "rawHtml",
    "htmlString": str
}

# External URL
{
    "type": "externalUrl", 
    "iframeUrl": str
}

# Remote DOM
{
    "type": "remoteDom",
    "script": str,
    "framework": Literal["react", "webcomponents"]
}
```

## Examples

See the `examples/` directory for complete usage examples:

- `basic_server_usage.py`: Basic resource creation and action results
- `advanced_features.py`: Advanced patterns and integrations
- `mcp_tool_integration.py`: Complete MCP tool implementation

## Development

### Setup

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run linting
ruff check .
black .

# Type checking
mypy src/
```

### Project Structure

```
src/mcp_ui_server/
├── __init__.py          # Main exports
├── types.py             # Type definitions
├── core.py              # Core functionality
├── utils.py             # Utility functions
└── exceptions.py        # Custom exceptions
```

## License

Apache 2.0

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.