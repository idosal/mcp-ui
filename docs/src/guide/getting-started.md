# Getting Started

This guide will help you get started with the MCP-UI SDK, which provides tools for building Model Context Protocol (MCP) enabled applications with interactive UI components.

## Prerequisites

- Node.js (v22.x recommended)
- pnpm (v9 or later recommended)

## Installation

1.  **Clone the Monorepo**:

    ```bash
    git clone https://github.com/idosal/mcp-ui.git
    cd mcp-ui
    ```

2.  **Install Dependencies**:
    From the root of the `mcp-ui` monorepo, run:
    ```bash
    pnpm install
    ```
    This command installs dependencies for all packages (`shared`, `client`, `server`, `docs`) and links them together using pnpm.

## Building Packages

To build all library packages (`shared`, `client`, `server`):

```bash
pnpm --filter=!@mcp-ui/docs build
```

Each package uses Vite for building and will output distributable files to its respective `dist` directory.

## Running Tests

To run all tests across the monorepo using Vitest:

```bash
pnpm test
```

Or for coverage:

```bash
pnpm run coverage
```

## Using the Packages

Once built, you can typically import from the packages as you would with any other npm module, assuming your project is set up to resolve them.

### In a Node.js Project (Server-Side Example)

```typescript
// main.ts (your server-side application)
import { createUIResource } from '@mcp-ui/server';

const myHtmlPayload = `<h1>Hello from Server!</h1><p>Timestamp: ${new Date().toISOString()}</p>`;

const resourceBlock = createUIResource({
  uri: 'ui://server-generated/item1',
  content: { type: 'rawHtml', htmlString: myHtmlPayload },
  delivery: 'text',
});


// Send this resourceBlock as part of your MCP response...
```

### In a React Project (Client-Side Example)

```tsx
// App.tsx (your React application)
import React, { useState, useEffect } from 'react';
import { UIResourceRenderer, UIActionResult } from '@mcp-ui/client';

// Dummy MCP response structure
interface McpToolResponse {
  content: any[];
}

function App() {
  const [mcpData, setMcpData] = useState<McpToolResponse | null>(null);

  // Simulate fetching MCP data
  useEffect(() => {
    const fakeMcpResponse: McpToolResponse = {
      content: [
        {
          type: 'resource',
          resource: {
            uri: 'ui://client-example/dynamic-section',
            mimeType: 'text/html',
            text: '<h2>Dynamic Content via MCP-UI</h2><button onclick="alert(\'Clicked!\')">Click me</button>',
          },
        },
      ],
    };
    setMcpData(fakeMcpResponse);
  }, []);

  const handleResourceAction = async (result: UIActionResult) => {
    if (result.type === 'tool') {
      console.log(`Action from resource (tool: ${result.payload.toolName}):`, result.payload.params);
    } else if (result.type === 'prompt') {
      console.log(`Prompt from resource:`, result.payload.prompt);
    } else if (result.type === 'link') {
      console.log(`Link from resource:`, result.payload.url);
    } else if (result.type === 'intent') {
      console.log(`Intent from resource:`, result.payload.intent);
    } else if (result.type === 'notification') {
      console.log(`Notification from resource:`, result.payload.message);
    }
    // Add your handling logic (e.g., initiate followup tool call)
    return { status: 'Action received by client' };
  };

  return (
    <div className="App">
      <h1>MCP Client Application</h1>
      {mcpData?.content.map((item, index) => {
        if (
          item.type === 'resource' &&
          item.resource.uri?.startsWith('ui://')
        ) {
          return (
            <div
              key={item.resource.uri || index}
              style={{
                border: '1px solid #eee',
                margin: '10px',
                padding: '10px',
              }}
            >
              <h3>Resource: {item.resource.uri}</h3>
              <UIResourceRenderer
                resource={item.resource}
                onUIAction={handleResourceAction}
              />
            </div>
          );
        }
        return <p key={index}>Unsupported content item</p>;
      })}
    </div>
  );
}

export default App;
```

Next, explore the specific guides for each SDK package to learn more about their APIs and capabilities.

To build specifically this package from the monorepo root:

```bash
pnpm build -w @mcp-ui/server
```

See the [Server SDK Usage & Examples](./server/usage-examples.md) page for practical examples.

To build specifically this package from the monorepo root:

```bash
pnpm build -w @mcp-ui/client
```

See the following pages for more details:

## Basic Setup

For MCP servers, ensure you have `@mcp-ui/server` available in your Node.js project. If you're working outside this monorepo, you would typically install them.

For MCP clients, ensure `@mcp-ui/client` and its peer dependencies (`react` and potentially `@modelcontextprotocol/sdk`) are installed in your React project.

```bash
npm i @mcp-ui/client
```

## Key Components

### Server Side (`@mcp-ui/server`)
- **`createUIResource`**: Creates UI resource objects for MCP tool responses
- Handles HTML content, external URLs, Remote DOM JS, and encoding options

### Client Side (`@mcp-ui/client`)
- **`<UIResourceRenderer />`**: Main component for rendering all types of MCP-UI resources
- **`<HTMLResourceRenderer />`**: Internal component for HTML resources
- **`<RemoteDOMResourceRenderer />`**: Internal component for Remote DOM resources

## Resource Types

MCP-UI supports several resource types:

1. **HTML Resources** (`text/html`): Direct HTML content
2. **External URLs** (`text/uri-list`): External applications and websites  
3. **Remote DOM Resources** (`application/vnd.mcp-ui.remote-dom+javascript`): Javascript-defined UI that use host-native components

All resource types are handled automatically by `<UIResourceRenderer />`.

## Next Steps

- [Server SDK Usage & Examples](./server/usage-examples.md) - Learn how to create resources
- [Client SDK Usage & Examples](./client/usage-examples.md) - Learn how to render resources
- [Protocol Details](./protocol-details.md) - Understand the underlying protocol
- [UIResourceRenderer Component](./client/resource-renderer.md) - Comprehensive component guide
