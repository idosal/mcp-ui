# MCP Apps Integration

The MCP Apps adapter in `@mcp-ui/server` enables your MCP-UI HTML widget to run inside MCP Apps-compliant hosts that implement the [MCP Apps SEP protocol](https://github.com/modelcontextprotocol/ext-apps). This guide walks you through the integration process.

## Overview

MCP-UI has been standardized into MCP Apps. There were changes in the messaging protocol that will break existing MCP-UI apps (e.g., event names, JSON-RPC format, etc.) The adapter automatically translates the MCP-UI protocol to MCP Apps SEP, allowing you to maintain compatibility with both MCP-UI and MCP Apps hosts.

With this adapter, your MCP-UI apps will work in both legacy MCP-UI hosts and new MCP Apps hosts out-of-the-box, allowing for a smooth migration. MCP-UI's server SDK will soon support MCP Apps directly.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP Apps Host                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Sandbox Iframe                        │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                  Tool UI Iframe                     │  │  │
│  │  │  ┌───────────────┐    ┌──────────────────────────┐  │  │  │
│  │  │  │  MCP-UI       │───▶│  MCP Apps Adapter        │  │  │  │
│  │  │  │  Widget       │◀───│  (injected script)       │  │  │  │
│  │  │  └───────────────┘    └──────────────────────────┘  │  │  │
│  │  │         │                        │                  │  │  │
│  │  │         │ MCP-UI Protocol        │ JSON-RPC         │  │  │
│  │  │         ▼                        ▼                  │  │  │
│  │  │   postMessage              postMessage              │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│                    MCP Apps SEP Protocol                         │
└─────────────────────────────────────────────────────────────────┘
```

The adapter:
1. Intercepts MCP-UI messages from your widget
2. Translates them to MCP Apps SEP JSON-RPC format
3. Sends them to the host via postMessage
4. Receives host responses and translates them back to MCP-UI format

## Quick Start

### 1. Create a UI Resource with the MCP Apps Adapter

```typescript
import { createUIResource } from '@mcp-ui/server';

const widgetUI = createUIResource({
  uri: 'ui://my-server/widget',
  encoding: 'text',
  content: {
    type: 'rawHtml',
    htmlString: `
      <html>
        <body>
          <div id="app">Loading...</div>
          <script>
            // Listen for render data from the adapter
            window.addEventListener('message', (event) => {
              if (event.data.type === 'ui-lifecycle-iframe-render-data') {
                const { toolInput, toolOutput } = event.data.payload.renderData;
                document.getElementById('app').textContent = 
                  JSON.stringify({ toolInput, toolOutput }, null, 2);
              }
            });
            
            // Signal that the widget is ready
            window.parent.postMessage({ type: 'ui-lifecycle-iframe-ready' }, '*');
          </script>
        </body>
      </html>
    `,
  },
  adapters: {
    mcpApps: {
      enabled: true,
    },
  },
});
```

### 2. Register the Resource and Tool

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createUIResource, RESOURCE_URI_META_KEY } from '@mcp-ui/server';

const server = new McpServer({ name: 'my-server', version: '1.0.0' });

// Create the UI resource (from step 1)
const widgetUI = createUIResource({
  uri: 'ui://my-server/widget',
  // ... (same as above)
});

// Register the resource so the host can fetch it
server.registerResource(
  widgetUI.resource.uri,
  {},  // Resource metadata
  async () => widgetUI.resource
);

// Register the tool with _meta linking to the UI resource
server.registerTool(
  'my_widget',
  {
    description: 'An interactive widget',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'User query' }
      },
      required: ['query']
    },
    // This tells MCP Apps hosts where to find the UI
    _meta: {
      [RESOURCE_URI_META_KEY]: widgetUI.resource.uri
    }
  },
  async ({ query }) => {
    return {
      content: [{ type: 'text', text: `Processing: ${query}` }],
    };
  }
);
```

The key requirement for MCP Apps hosts is that the tool's `_meta` contains the `ui/resourceUri` key pointing to the UI resource URI. This tells the host where to fetch the widget HTML.

## Protocol Translation Reference

### Widget → Host (Outgoing)

| MCP-UI Action | MCP Apps Method | Description |
|--------------|-----------------|-------------|
| `tool` | `tools/call` | Call another tool |
| `prompt` | `ui/message` | Send a follow-up message to the conversation |
| `link` | `ui/open-link` | Open a URL in a new tab |
| `notify` | `notifications/message` | Log a message to the host |
| `intent` | `ui/message` | Send an intent (translated to message) |
| `ui-size-change` | `ui/notifications/size-change` | Request widget resize |

### Host → Widget (Incoming)

| MCP Apps Notification | MCP-UI Message | Description |
|----------------------|----------------|-------------|
| `ui/notifications/tool-input` | `ui-lifecycle-iframe-render-data` | Complete tool arguments |
| `ui/notifications/tool-input-partial` | `ui-lifecycle-iframe-render-data` | Streaming partial arguments |
| `ui/notifications/tool-result` | `ui-lifecycle-iframe-render-data` | Tool execution result |
| `ui/notifications/host-context-changed` | `ui-lifecycle-iframe-render-data` | Theme, locale, viewport changes |

## Configuration Options

```typescript
createUIResource({
  // ...
  adapters: {
    mcpApps: {
      enabled: true,
      config: {
        // Timeout for async operations (default: 30000ms)
        timeout: 60000,
      },
    },
  },
});
```

## MIME Type

When the MCP Apps adapter is enabled, the resource MIME type is automatically set to `text/html+mcp`. This is the expected MIME type for MCP Apps-compliant hosts.

## Receiving Data in Your Widget

The adapter sends data to your widget via the standard MCP-UI `ui-lifecycle-iframe-render-data` message:

```typescript
window.addEventListener('message', (event) => {
  if (event.data.type === 'ui-lifecycle-iframe-render-data') {
    const { renderData } = event.data.payload;
    
    // Tool input arguments
    const toolInput = renderData.toolInput;
    
    // Tool execution result (if available)
    const toolOutput = renderData.toolOutput;
    
    // Widget state (if supported by host)
    const widgetState = renderData.widgetState;
    
    // Host context
    const theme = renderData.theme;      // 'light' | 'dark' | 'system'
    const locale = renderData.locale;    // e.g., 'en-US'
    const displayMode = renderData.displayMode; // 'inline' | 'fullscreen' | 'pip'
    const maxHeight = renderData.maxHeight;
    
    // Update your UI with the data
    updateWidget(renderData);
  }
});
```

## Sending Actions from Your Widget

Use standard MCP-UI postMessage calls - the adapter translates them automatically:

```typescript
// Send a prompt to the conversation
window.parent.postMessage({
  type: 'prompt',
  payload: { prompt: 'What is the weather like today?' }
}, '*');

// Open a link
window.parent.postMessage({
  type: 'link',
  payload: { url: 'https://example.com' }
}, '*');

// Call another tool
window.parent.postMessage({
  type: 'tool',
  payload: { 
    toolName: 'get_weather',
    params: { city: 'San Francisco' }
  }
}, '*');

// Send a notification
window.parent.postMessage({
  type: 'notify',
  payload: { message: 'Widget loaded successfully' }
}, '*');

// Request resize
window.parent.postMessage({
  type: 'ui-size-change',
  payload: { width: 500, height: 400 }
}, '*');
```

## Mutual Exclusivity with Apps SDK Adapter

Only one adapter can be enabled at a time. The TypeScript types enforce this:

```typescript
// ✅ Valid: MCP Apps adapter only
adapters: { mcpApps: { enabled: true } }

// ✅ Valid: Apps SDK adapter only (for ChatGPT)
adapters: { appsSdk: { enabled: true } }

// ❌ TypeScript error: Cannot enable both
adapters: { mcpApps: { enabled: true }, appsSdk: { enabled: true } }
```

If you need to support both MCP Apps hosts and ChatGPT, create separate resources:

```typescript
// For MCP Apps hosts
const mcpAppsResource = createUIResource({
  uri: 'ui://my-server/widget-mcp-apps',
  content: { type: 'rawHtml', htmlString: widgetHtml },
  adapters: { mcpApps: { enabled: true } },
});

// For ChatGPT/Apps SDK hosts
const appsSdkResource = createUIResource({
  uri: 'ui://my-server/widget-apps-sdk',
  content: { type: 'rawHtml', htmlString: widgetHtml },
  adapters: { appsSdk: { enabled: true } },
});
```

## Complete Example

See the [mcp-apps-demo](https://github.com/idosal/mcp-ui/tree/main/examples/mcp-apps-demo) example for a complete working implementation.

```typescript
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createUIResource, RESOURCE_URI_META_KEY } from '@mcp-ui/server';
import { z } from 'zod';

const app = express();
app.use(cors({ origin: '*', exposedHeaders: ['Mcp-Session-Id'] }));
app.use(express.json());

// ... (transport setup)

const server = new McpServer({ name: 'demo', version: '1.0.0' });

const graphUI = createUIResource({
  uri: 'ui://demo/graph',
  encoding: 'text',
  content: {
    type: 'rawHtml',
    htmlString: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: system-ui; padding: 20px; }
          .data { background: #f5f5f5; padding: 10px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>graph</h1>
        <div class="data" id="data">Waiting for data...</div>
        <button onclick="sendPrompt()">Ask Follow-up</button>
        
        <script>
          window.addEventListener('message', (e) => {
            if (e.data.type === 'ui-lifecycle-iframe-render-data') {
              document.getElementById('data').textContent = 
                JSON.stringify(e.data.payload.renderData, null, 2);
            }
          });
          
          function sendPrompt() {
            window.parent.postMessage({
              type: 'prompt',
              payload: { prompt: 'Tell me more about this data' }
            }, '*');
          }
          
          window.parent.postMessage({ type: 'ui-lifecycle-iframe-ready' }, '*');
        </script>
      </body>
      </html>
    `,
  },
  adapters: {
    mcpApps: { enabled: true },
  },
});

// Register the UI resource
server.registerResource(
  graphUI.resource.uri,
  {},
  async () => graphUI.resource
);

// Register the tool with _meta linking to the UI resource
server.registerTool(
  'show_graph',
  {
    description: 'Display an interactive graph',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'graph title' }
      },
      required: ['title']
    },
    _meta: {
      [RESOURCE_URI_META_KEY]: graphUI.resource.uri
    }
  },
  async ({ title }) => ({
    content: [{ type: 'text', text: `graph: ${title}` }],
  })
);

// ... (server setup)
```

## Debugging

The adapter logs debug information to the browser console. Look for messages prefixed with `[MCP Apps Adapter]`:

```
[MCP Apps Adapter] Initializing adapter...
[MCP Apps Adapter] Sending ui/initialize request
[MCP Apps Adapter] Received JSON-RPC message: {...}
[MCP Apps Adapter] Intercepted MCP-UI message: prompt
```

## Related Resources

- [MCP Apps SEP Specification](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/draft/apps.mdx)
- [@modelcontextprotocol/ext-apps](https://github.com/modelcontextprotocol/ext-apps)
- [Apps SDK Integration](./apps-sdk.md) - For ChatGPT integration
- [Protocol Details](./protocol-details.md) - MCP-UI protocol reference

