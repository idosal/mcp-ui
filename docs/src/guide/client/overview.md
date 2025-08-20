# @mcp-ui/client Overview

The `@mcp-ui/client` package helps you render UI resources sent from an MCP-enabled server. The primary component for this is `<UIResourceRenderer />`, which automatically detects the resource type and renders the appropriate component for it.

## What's Included?

- **`<UIResourceRenderer />`**: The main component you'll use. It inspects the resource's `mimeType` and renders either `<HTMLResourceRenderer />` or `<RemoteDOMResourceRenderer />` internally.
- **`<HTMLResourceRenderer />`**: Internal component for HTML/URL resources
- **`<RemoteDOMResourceRenderer />`**: Internal component for remote DOM resources
- **`isUIResource()`**: Utility function to check if content is a UI resource (replaces manual `content.type === 'resource' && content.resource.uri?.startsWith('ui://')` checks)

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

See the following pages for more details:

- [UIResourceRenderer Component](./resource-renderer.md) - **Main entry point**
- [HTMLResourceRenderer Component](./html-resource.md)
- [RemoteDOMResourceRenderer Component](./remote-dom-resource.md)
- [React Usage & Examples](./react-usage-examples.md)
- [Web Component Usage & Examples](./wc-usage-examples.md)
