# @mcp-ui/server Overview

The `@mcp-ui/server` package provides utilities to generate UI resources (`UIResource`) on your MCP server. It allows you to define UI snippets on the server-side, which can then be seamlessly and securely rendered on the client.

For a complete example, see the [`typescript-server-demo`](https://github.com/idosal/mcp-ui/tree/docs/ts-example/examples/typescript-server-demo).

## Key Exports

- **`createUIResource(options: CreateUIResourceOptions): UIResource`**:
  The primary function for creating UI snippets. It takes an options object to define the URI, content (direct HTML or external URL), encoding method (text or blob), and metadata configuration.

## Purpose

- **Ease of Use**: Simplifies the creation of valid `UIResource` objects.
- **Validation**: Includes basic validation (e.g., URI prefixes matching content type).
- **Encoding**: Handles Base64 encoding when `encoding: 'blob'` is specified.
- **Metadata Support**: Provides flexible metadata configuration for enhanced client-side rendering and resource management.

## Metadata Features

The `createUIResource()` function supports three types of metadata configuration to enhance resource functionality:

### `metadata`
Standard MCP resource metadata that becomes the `_meta` property on the resource. This follows the MCP specification for resource metadata.

### `uiMetadata`
MCP-UI specific configuration options. These keys are automatically prefixed with `mcpui.dev/ui-` in the resource metadata:

- **`preferred-frame-size`**: Define the resource's preferred initial frame size (e.g., `{ width: 800, height: 600 }`)
- **`initial-render-data`**: Provide data that should be passed to the iframe when rendering

### `resourceProps`
Additional properties that are spread directly onto the actual resource definition, allowing you to add/override any MCP specification-supported properties.

### `embeddedResourceProps`
Additional properties that are spread directly onto the embedded resource top-level definition, allowing you to add any MCP embedded resource [specification-supported](https://modelcontextprotocol.io/specification/2025-06-18/schema#embeddedresource) properties, like `annotations`.

## Building

This package is built using Vite in library mode, targeting Node.js environments. It outputs ESM (`.mjs`) and CJS (`.js`) formats, along with TypeScript declaration files (`.d.ts`).

To build specifically this package from the monorepo root:

```bash
pnpm build --filter @mcp-ui/server
```

See the [Server SDK Usage & Examples](./usage-examples.md) page for practical examples.
