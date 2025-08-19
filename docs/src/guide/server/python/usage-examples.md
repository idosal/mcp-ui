# mcp-ui-server Usage & Examples

This page provides practical examples for using the `mcp-ui-server` package.

For a complete example, see the [`python-server-demo`](https://github.com/idosal/mcp-ui/tree/main/examples/python-server-demo).

## Basic Setup

First, ensure you have `mcp-ui-server` available in your project:

```bash
pip install mcp-ui-server
```

Or with uv:

```bash
uv add mcp-ui-server
```

## Basic Usage

The core function is `create_UIResource`.

```python
from mcp_ui_server import create_UIResource

# Example 1: Direct HTML, delivered as text
resource1 = create_UIResource({
    "uri": "ui://my-component/instance-1",
    "content": {
        "type": "rawHtml", 
        "htmlString": "<p>Hello World</p>"
    },
    "encoding": "text"
})

print("Resource 1:", resource1.model_dump_json(indent=2))
# Output for Resource 1:
# {
#   "type": "resource",
#   "resource": {
#     "uri": "ui://my-component/instance-1",
#     "mimeType": "text/html",
#     "text": "<p>Hello World</p>"
#   }
# }

# Example 2: Direct HTML, delivered as a Base64 blob
resource2 = create_UIResource({
    "uri": "ui://my-component/instance-2",
    "content": {
        "type": "rawHtml", 
        "htmlString": "<h1>Complex HTML</h1>"
    },
    "encoding": "blob"
})

print("Resource 2 (blob will be Base64):", resource2.model_dump_json(indent=2))
# Output for Resource 2:
# {
#   "type": "resource",
#   "resource": {
#     "uri": "ui://my-component/instance-2",
#     "mimeType": "text/html",
#     "blob": "PGgxPkNvbXBsZXggSFRNTDwvaDE+"
#   }
# }

# Example 3: External URL, text encoding
dashboard_url = "https://my.analytics.com/dashboard/123"
resource3 = create_UIResource({
    "uri": "ui://analytics-dashboard/main",
    "content": {
        "type": "externalUrl", 
        "iframeUrl": dashboard_url
    },
    "encoding": "text"
})

print("Resource 3:", resource3.model_dump_json(indent=2))
# Output for Resource 3:
# {
#   "type": "resource",
#   "resource": {
#     "uri": "ui://analytics-dashboard/main",
#     "mimeType": "text/uri-list",
#     "text": "https://my.analytics.com/dashboard/123"
#   }
# }

# Example 4: External URL, blob encoding (URL is Base64 encoded)
chart_api_url = "https://charts.example.com/api?type=pie&data=1,2,3"
resource4 = create_UIResource({
    "uri": "ui://live-chart/session-xyz",
    "content": {
        "type": "externalUrl", 
        "iframeUrl": chart_api_url
    },
    "encoding": "blob"
})

print("Resource 4 (blob will be Base64 of URL):", resource4.model_dump_json(indent=2))
# Output for Resource 4:
# {
#   "type": "resource",
#   "resource": {
#     "uri": "ui://live-chart/session-xyz",
#     "mimeType": "text/uri-list",
#     "blob": "aHR0cHM6Ly9jaGFydHMuZXhhbXBsZS5jb20vYXBpP3R5cGU9cGllJmRhdGE9MSwyLDM="
#   }
# }

# Example 5: Remote DOM script, text encoding
remote_dom_script = """
const button = document.createElement('ui-button');
button.setAttribute('label', 'Click me for a tool call!');
button.addEventListener('press', () => {
    window.parent.postMessage({ 
        type: 'tool', 
        payload: { 
            toolName: 'uiInteraction', 
            params: { action: 'button-click', from: 'remote-dom' } 
        } 
    }, '*');
});
root.appendChild(button);
"""

resource5 = create_UIResource({
    "uri": "ui://remote-component/action-button",
    "content": {
        "type": "remoteDom",
        "script": remote_dom_script.strip(),
        "framework": "react"  # or "webcomponents"
    },
    "encoding": "text"
})

print("Resource 5:", resource5.model_dump_json(indent=2))
# Output for Resource 5:
# {
#   "type": "resource",
#   "resource": {
#     "uri": "ui://remote-component/action-button",
#     "mimeType": "application/vnd.mcp-ui.remote-dom+javascript; framework=react",
#     "text": "\\nconst button = document.createElement('ui-button');\\n..."
#   }
# }

# These resource objects would then be included in the 'content' array
# of a toolResult in an MCP interaction.
```

## Using with FastMCP

Here's how to use `create_UIResource` with the FastMCP framework:

```python
import argparse
from mcp.server.fastmcp import FastMCP
from mcp_ui_server import create_UIResource
from mcp_ui_server.core import UIResource

# Create FastMCP instance
mcp = FastMCP("my-server")

@mcp.tool()
def show_dashboard() -> list[UIResource]:
    """Display an analytics dashboard."""
    ui_resource = create_UIResource({
        "uri": "ui://dashboard/analytics",
        "content": {
            "type": "externalUrl",
            "iframeUrl": "https://my.analytics.com/dashboard"
        },
        "encoding": "text"
    })
    return [ui_resource]

@mcp.tool()
def show_welcome() -> list[UIResource]:
    """Display a welcome message."""
    ui_resource = create_UIResource({
        "uri": "ui://welcome/main",
        "content": {
            "type": "rawHtml",
            "htmlString": "<h1>Welcome to My MCP Server!</h1><p>How can I help you today?</p>"
        },
        "encoding": "text"
    })
    return [ui_resource]

if __name__ == "__main__":
    mcp.run()
```

## Advanced URI List Example

You can provide multiple URLs in the `text/uri-list` format for fallback purposes. However, **MCP-UI requires a single URL** and will only use the first valid URL found:

```python
# Example 6: Multiple URLs with fallbacks (MCP-UI uses only the first)
multi_url_content = """# Primary dashboard
https://dashboard.example.com/main

# Backup dashboard (will be logged but not used)
https://backup.dashboard.example.com/main

# Emergency fallback (will be logged but not used)  
https://emergency.dashboard.example.com/main"""

resource6 = create_UIResource({
    "uri": "ui://dashboard-with-fallbacks/session-123",
    "content": {
        "type": "externalUrl", 
        "iframeUrl": multi_url_content
    },
    "encoding": "text"
})

# The client will:
# 1. Use https://dashboard.example.com/main for rendering
# 2. Log a warning about the ignored backup URLs
# This allows you to specify fallback URLs in the standard format 
# while MCP-UI focuses on the primary URL
```

## Error Handling

The `create_UIResource` function will raise exceptions if invalid combinations are provided, for example:

- URI not starting with `ui://` for any content type
- Invalid content type specified

```python
from mcp_ui_server.exceptions import InvalidURIError

try:
    create_UIResource({
        "uri": "invalid://should-be-ui",
        "content": {
            "type": "externalUrl", 
            "iframeUrl": "https://example.com"
        },
        "encoding": "text"
    })
except InvalidURIError as e:
    print(f"Caught expected error: {e}")
    # URI must start with 'ui://' but got: invalid://should-be-ui
```
