# @mcp-ui/client Overview

The `@mcp-ui/client` package helps you render UI resources sent from an MCP-enabled server. The primary component for this is `<UIResourceRenderer />`, which automatically detects the resource type and renders the appropriate component for it.

## What's Included?

### Components
- **`<UIResourceRenderer />`**: The main component you'll use. It inspects the resource's `mimeType` and renders either `<HTMLResourceRenderer />` or `<RemoteDOMResourceRenderer />` internally.
- **`<HTMLResourceRenderer />`**: Internal component for HTML/URL resources
- **`<RemoteDOMResourceRenderer />`**: Internal component for remote DOM resources

### Utility Functions
- **`getResourceMetadata(resource)`**: Extracts the resource's `_meta` content (standard MCP metadata)
- **`getUIResourceMetadata(resource)`**: Extracts only the MCP-UI specific metadata keys (prefixed with `mcpui.dev/ui-`) from the resource's `_meta` content

## Purpose
- **Standardized UI**: mcp-ui's client guarantees full compatibility with the latest MCP UI standards.
- **Simplified Rendering**: Abstract away the complexities of handling different resource types.
- **Security**: Renders user-provided HTML and scripts within sandboxed iframes.
- **Interactivity**: Provides a unified mechanism (`onUIAction` prop) for UI resources to communicate back to the host application.

## Building

This package uses Vite in library mode. It outputs ESM (`.mjs`) and UMD (`.js`) formats, plus TypeScript declarations (`.d.ts`). `react` is externalized.

To build just this package from the monorepo root:

```bash
pnpm build --filter @mcp-ui/client
```

## Utility Functions Reference

### `getResourceMetadata(resource)`

Extracts the standard MCP metadata from a resource's `_meta` property.

```typescript
import { getResourceMetadata } from '@mcp-ui/client';

const resource = {
  uri: 'ui://example/demo',
  mimeType: 'text/html',
  text: '<div>Hello</div>',
  _meta: {
    title: 'Demo Component',
    version: '1.0.0',
    'mcpui.dev/ui-preferred-frame-size': ['800px', '600px'],
    'mcpui.dev/ui-initial-render-data': { theme: 'dark' },
    author: 'Development Team'
  }
};

const metadata = getResourceMetadata(resource);
console.log(metadata);
// Output: {
//   title: 'Demo Component',
//   version: '1.0.0',
//   'mcpui.dev/ui-preferred-frame-size': ['800px', '600px'],
//   'mcpui.dev/ui-initial-render-data': { theme: 'dark' },
//   author: 'Development Team'
// }
```

### `getUIResourceMetadata(resource)`

Extracts only the MCP-UI specific metadata keys (those prefixed with `mcpui.dev/ui-`) from a resource's `_meta` property, with the prefixes removed for easier access.

```typescript
import { getUIResourceMetadata } from '@mcp-ui/client';

const resource = {
  uri: 'ui://example/demo',
  mimeType: 'text/html',
  text: '<div>Hello</div>',
  _meta: {
    title: 'Demo Component',
    version: '1.0.0',
    'mcpui.dev/ui-preferred-frame-size': ['800px', '600px'],
    'mcpui.dev/ui-initial-render-data': { theme: 'dark' },
    'mcpui.dev/ui-preferred-context': 'hero',
    author: 'Development Team'
  }
};

const uiMetadata = getUIResourceMetadata(resource);
console.log(uiMetadata);
// Output: {
//   'preferred-frame-size': ['800px', '600px'],
//   'initial-render-data': { theme: 'dark' },
//   'preferred-context': 'hero'
// }
```

### Usage Examples

These utility functions are particularly useful when you need to access metadata programmatically:

```typescript
import { getUIResourceMetadata, UIResourceRenderer } from '@mcp-ui/client';

function SmartResourceRenderer({ resource }) {
  const uiMetadata = getUIResourceMetadata(resource);
  
  // Use metadata to make rendering decisions
  const preferredContext = uiMetadata['preferred-context'];
  const containerClass = preferredContext === 'hero' ? 'hero-container' : 'default-container';
  
  return (
    <div className={containerClass}>
      {preferredContext === 'hero' && (
        <h2>Featured Component</h2>
      )}
      <UIResourceRenderer resource={resource} />
    </div>
  );
}
```

## See More

See the following pages for more details:

- [UIResourceRenderer Component](./resource-renderer.md) - **Main entry point**
- [HTMLResourceRenderer Component](./html-resource.md)
- [RemoteDOMResourceRenderer Component](./remote-dom-resource.md)
- [React Usage & Examples](./react-usage-examples.md)
- [Web Component Usage & Examples](./wc-usage-examples.md)
