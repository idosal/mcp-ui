# Introduction

Welcome to the MCP-UI documentation!

This SDK provides tools for building Model Context Protocol (MCP) enabled applications with interactive UI components. It aims to standardize how models and tools can request the display of rich HTML interfaces within a client application.

You can use [GitMCP](https://gitmcp.io/idosal/mcp-ui) to give your IDE access to `mcp-ui`'s latest documentation! 
<a href="https://gitmcp.io/idosal/mcp-ui"><img src="https://img.shields.io/endpoint?url=https://gitmcp.io/badge/idosal/mcp-ui" alt="MCP Documentation"></a>

## What is MCP-UI?

MCP-UI provides SDKs for multiple languages, including:

- **`@mcp-ui/client`**: A Typescript package with UI components for easy rendering of interactive UI. It includes a React component (`<UIResourceRenderer />`) and a standard Web Component (`<ui-resource-renderer>`).
- **`@mcp-ui/server`**: A Typescript package with helper functions (like `createUIResource`) for server-side logic to easily construct `UIResource` objects.
- **`mcp_ui_server`**: A Ruby gem with helper methods (like `create_ui_resource`) for server-side logic in Ruby applications.
- **`mcp-ui-server`**: A Python package with helper methods (like `create_ui_resource`) for server-side logic in Python applications.

## The Interactive UI Resource Protocol

The central piece of this SDK is the `UIResource`. This object defines a contract for how interactive UI should be structured and delivered from a server/tool to a client.

### `UIResource` Structure

```typescript
interface UIResource {
  type: 'resource';
  resource: {
    uri: string;       // ui://component/id
    mimeType: 'text/html' | 'text/uri-list' | 'application/vnd.mcp-ui.remote-dom'; // text/html for HTML content, text/uri-list for URL content, application/vnd.mcp-ui.remote-dom for remote-dom content (Javascript)
    text?: string;      // Inline HTML or external URL
    blob?: string;      // Base64-encoded HTML or URL
  };
}
```

### Key Field Details:

- **`uri` (Uniform Resource Identifier)**:
  - All UI resources use the `ui://` scheme (e.g., `ui://my-custom-form/instance-01`)
  - The rendering method is determined by the `mimeType`:
    - `mimeType: 'text/html'` → HTML content rendered via `<iframe srcdoc>`
    - `mimeType: 'text/uri-list'` → URL content rendered via `<iframe src>`
- **`mimeType`**: `'text/html'` for HTML content, `'text/uri-list'` for URL content
- **`text` or `blob`**: The actual content (HTML string or URL string), either as plain text or Base64 encoded

## How It Works

1. **Server Side**: Use the server SDK for your language to create `UIResource` objects.
2. **Client Side**: Use `@mcp-ui/client` to render these resources in your frontend application.

### Example Flow

**Server (MCP Tool):**
::: code-group

```typescript [TypeScript]
import { createUIResource } from '@mcp-ui/server';

const resource = createUIResource({
  uri: 'ui://my-tool/dashboard',
  content: { type: 'rawHtml', htmlString: '<h1>Dashboard</h1>' },
  encoding: 'text'
});

// Return in MCP response
return { content: [resource] };
```

```ruby [Ruby]
require 'mcp_ui_server'

resource = McpUiServer.create_ui_resource(
  uri: 'ui://my-tool/dashboard',
  content: { type: :raw_html, htmlString: '<h1>Dashboard</h1>' },
  encoding: :text
)

# Return in MCP response
{ content: [resource] }
```

:::

**Client (Frontend App):**
::: code-group

```tsx [React]
import { UIResourceRenderer } from '@mcp-ui/client';

function App({ mcpResponse }) {
  return (
    <div>
      {mcpResponse.content.map((item) => (
        <UIResourceRenderer
          key={item.resource.uri}
          resource={item.resource}
          onUIAction={(result) => {
            console.log('Action:', result);
            return { status: 'handled' };
          }}
        />
      ))}
    </div>
  );
}
```

```html [Web Component]
<!-- index.html -->
<ui-resource-renderer id="resource-renderer"></ui-resource-renderer>

<!-- main.js -->
<script type="module">
  // 1. Import the script to register the component
  import '@mcp-ui/client/ui-resource-renderer.wc.js';

  // 2. This object would come from your MCP response
  const mcpResource = {
    resource: {
      uri: 'ui://user-form/1',
      mimeType: 'text/uri-list',
      text: 'https://example.com'
    }
  };

  // 3. Get the element and pass data
  const renderer = document.getElementById('resource-renderer');
  renderer.resource = mcpResource.resource;

  // 4. Listen for events
  renderer.addEventListener('onUIAction', (event) => {
    console.log('User action:', event.detail);
  });
</script>
```
:::

## Key Benefits

- **Standardized**: Consistent interface for UI resources across MCP applications
- **Secure**: Sandboxed iframe execution prevents malicious code from affecting the host
- **Interactive**: Two-way communication between resources and host application
- **Flexible**: Supports both direct HTML content and external applications
- **Future-proof**: Extensible design supports new resource types as they're added

## Philosophy

Allowing MCP servers to respond with UI snippets is a powerful way to create interactive experiences in hosts. Nailing down the best way to do it is challenging, and is an ongoing discussion in the MCP community and the [UI Community Working Group](https://github.com/modelcontextprotocol-community/working-groups/issues/35).
This project is an experimental playground for MCP-UI ideas, that aims to test out philosophies in the wild.

## Next Steps

- [Getting Started](./getting-started.md) - Set up your development environment
- [Server Walkthroughs](./server/typescript/walkthrough.md) - Step-by-step guides for integrating `mcp-ui` into your server
- [Client SDK](./client/overview.md) - Learn to render UI resources
- [Typescript Server SDK](./server/typescript/overview.md) - Learn to create UI resources in Typescript
- [Ruby Server SDK](./server/ruby/overview.md) - Learn to create UI resources in Ruby
- [Apps SDK Integration](./apps-sdk.md) - Wire the existing adapter into ChatGPT's Apps SDK
- [Protocol Details](./protocol-details.md) - Understand the underlying protocol
