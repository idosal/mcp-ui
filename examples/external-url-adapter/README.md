# External URL Adapter Demo

This example demonstrates the new feature that automatically fetches external URLs and converts them to `rawHtml` when adapters are enabled.

## Overview

When you use `externalUrl` content type with `mcpApps` or `appsSdk` adapters enabled, `createUIResource` automatically:

1. **Fetches the HTML** from the external URL at runtime
2. **Adds a `<base>` tag** pointing to the original URL's origin (ensures relative paths work correctly)
3. **Injects adapter scripts** to enable protocol translation
4. **Converts to `rawHtml`** with the appropriate MIME type

This follows the pattern used by Vercel for embedding external apps in ChatGPT.

## Key Features Demonstrated

### 1. External URL with MCP Apps Adapter

```typescript
const resource = await createUIResource({
  uri: 'ui://external-app/demo',
  content: {
    type: 'externalUrl',
    iframeUrl: 'https://grahamthe.dev/demos/doom/',
  },
  adapters: {
    mcpApps: {
      enabled: true,
    },
  },
});
```

**Note**: `createUIResource` becomes **async** when `externalUrl` + adapters are used.

### 2. Pre-registered External URL Resource

The `show_external_app` tool uses a pre-registered resource that fetches the Doom game demo:

```typescript
const externalAppUI = await createUIResource({
  uri: 'ui://external-app/demo',
  content: {
    type: 'externalUrl',
    iframeUrl: 'https://grahamthe.dev/demos/doom/',
  },
  adapters: {
    mcpApps: { enabled: true },
  },
});

server.registerResource('external_app_ui', externalAppUI.resource.uri, {}, async () => ({
  contents: [externalAppUI.resource]
}));
```

### 3. Traditional External URL (No Adapter)

For comparison, external URLs without adapters work synchronously:

```typescript
const resource = createUIResource({
  uri: 'ui://external-app/no-adapter',
  content: {
    type: 'externalUrl',
    iframeUrl: 'https://grahamthe.dev/demos/doom/',
  },
  // No adapters - returns immediately (synchronous)
});
```

## Setup

1. **Install dependencies**:
   ```bash
   cd examples/external-url-adapter
   npm install
   # or
   pnpm install
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

   The server will start on `http://localhost:3002`

## Usage with MCP Apps Client

1. **Connect your MCP Apps client** to `http://localhost:3002/mcp`

2. **Call the tools**:
   - `show_external_app` - Fetches Doom game demo (https://grahamthe.dev/demos/doom/) with adapter enabled
   - `show_weather_app` - Fetches a W3C example page
   - `show_external_url_no_adapter` - Traditional iframe (no adapter)

3. **Observe the behavior**:
   - Tools with adapters will fetch the HTML, add a base tag, and inject adapter scripts
   - The resource MIME type will be `text/html+mcp` (instead of `text/uri-list`)
   - The HTML will include the adapter runtime for protocol translation

## What Happens Under the Hood

When `externalUrl` + adapters are enabled:

1. **Fetch**: The HTML is fetched from the external URL using `fetch()`
2. **Base Tag**: A `<base href="${origin}">` tag is inserted to ensure relative paths resolve correctly
3. **Adapter Injection**: Adapter scripts are injected into the HTML
4. **Type Conversion**: The resource is converted from `externalUrl` (mimeType: `text/uri-list`) to `rawHtml` (mimeType: `text/html+mcp`)

## Testing

You can test with any MCP Apps-compatible client. The server logs will show:
- Session initialization
- Session closure
- Any errors during URL fetching

## Error Handling

If a URL fails to fetch, `createUIResource` will throw an error that you can catch:

```typescript
try {
  const resource = await createUIResource({
    uri: 'ui://test',
    content: {
      type: 'externalUrl',
      iframeUrl: 'https://invalid-url-that-does-not-exist.com',
    },
    adapters: {
      mcpApps: { enabled: true },
    },
  });
} catch (error) {
  console.error('Failed to fetch external URL:', error);
}
```

## Development

For development with auto-reload:

```bash
npm run dev
```

This uses `tsx watch` to automatically restart the server when files change.

