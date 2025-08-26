# Python MCP Server Demo

A Python MCP server implementation inspired by the TypeScript server demo. This server demonstrates how to create MCP UI resources using the MCP UI Server SDK.

## Features

This server provides three tools that create different types of UI resources:

- **showExternalUrl** - Creates a UI resource displaying an external URL (example.com)
- **showRawHtml** - Creates a UI resource with raw HTML content
- **showRemoteDom** - Creates a UI resource with remote DOM script using React framework

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