# Python MCP Server Demo

A Python MCP server implementation inspired by the TypeScript server demo. This server demonstrates how to create MCP UI resources using the MCP UI Server SDK.

## Features

This server provides multiple tools that demonstrate different types of UI resources and metadata capabilities:

### Basic UI Resources
- **show_external_url** - Creates a UI resource displaying an external URL (example.com) with preferred frame size metadata
- **show_raw_html** - Creates a UI resource with raw HTML content
- **show_remote_dom** - Creates a UI resource with remote DOM script using React framework
- **show_action_html** - Creates a UI resource with interactive buttons demonstrating intent actions

## Installation

This project uses [uv](https://github.com/astral-sh/uv) for dependency management.

```bash
# Install dependencies
uv sync

# Or install manually
uv add mcp mcp-ui-server
```

## Running the Server

```bash
# Using uv
uv run python_server_demo.py

# Or directly with Python
python python_server_demo.py
```

The server uses stdio transport and communicates via stdin/stdout using the MCP protocol.

## Usage with MCP Clients

This server can be connected to by any MCP client that supports stdio transport. The server will:

1. Initialize the MCP connection
2. List the three available tools
3. Handle tool calls and return UI resources

### Example Tool Calls

Each tool returns an MCP resource that can be rendered by MCP UI clients:

- **External URL**: Returns a resource that displays example.com in an iframe
- **Raw HTML**: Returns a resource with HTML content `<h1>Hello from Raw HTML</h1>`
- **Remote DOM**: Returns a resource with JavaScript that creates UI elements dynamically

## UI Metadata

The SDK supports UI metadata through the `uiMetadata` parameter in `create_ui_resource()`.

### Metadata Keys

Use the `UIMetadataKey` constants for type-safe metadata keys:

- **`UIMetadataKey.PREFERRED_FRAME_SIZE`**: CSS dimensions for the iframe
  - Type: `list[str, str]` - [width, height] as CSS dimension strings
  - Examples: `["800px", "600px"]`, `["100%", "50vh"]`, `["50rem", "80%"]`
  - Must include CSS units (px, %, vh, vw, rem, em, etc.)

- **`UIMetadataKey.INITIAL_RENDER_DATA`**: Initial data for the UI component
  - Type: `dict[str, Any]` - Any JSON-serializable dictionary

### How It Works

1. All `uiMetadata` keys are automatically prefixed with `mcpui.dev/ui-`
2. Prefixed metadata is merged with any custom `metadata`
3. The combined metadata is added to the resource's `_meta` field
4. Custom metadata keys are preserved as-is (not prefixed)

### Example Usage

```python
from mcp_ui_server import create_ui_resource, UIMetadataKey

ui_resource = create_ui_resource({
    "uri": "ui://my-component",
    "content": {
        "type": "rawHtml",
        "htmlString": "<h1>Hello</h1>"
    },
    "encoding": "text",
    "uiMetadata": {
        UIMetadataKey.PREFERRED_FRAME_SIZE: ["1200px", "800px"],
        # Or use string literal: "preferred-frame-size": ["1200px", "800px"]
    },
    # Optional: custom metadata (not prefixed)
    "metadata": {
        "custom.author": "My Server",
        "custom.version": "1.0.0"
    }
})
```


## Development

```bash
# Install dev dependencies
uv sync --dev

# Run linting
uv run ruff check .

# Run tests (if any)
uv run pytest
```

## Architecture

- **Transport**: stdio (standard input/output)
- **Framework**: MCP Python SDK
- **UI Resources**: Created using mcp-ui-server SDK
- **Session Management**: Handled by MCP SDK

## Comparison to TypeScript Demo

| Feature | TypeScript Demo | Python Demo |
|---------|----------------|-------------|
| Transport | HTTP | stdio |
| Framework | Express.js | MCP Python SDK |
| Tools | 3 UI tools | Same 3 UI tools |
| Session Management | Manual | SDK handled |
| Deployment | Web server | CLI/Desktop integration |