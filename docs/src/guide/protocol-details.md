# Protocol Details

This section dives deeper into the `HtmlResourceBlock` and its intended usage.

## `HtmlResourceBlock` Recap

```typescript
export interface HtmlResourceBlock {
  type: 'resource';
  resource: {
    uri: string;
    mimeType: 'text/html' | 'text/uri-list';
    text?: string;
    blob?: string;
  };
}
```

## URI Schemes

- **`ui://<component-name>/<instance-id>`**

  - **Purpose**: For all UI resources. The rendering method is determined by `mimeType`.
  - **Content**: `text` or `blob` contains either HTML string or URL string.
  - **Client Action**: 
    - If `mimeType: 'text/html'` → Render in a sandboxed iframe using `srcdoc`
    - If `mimeType: 'text/uri-list'` → Render in an iframe using `src`
  - **Examples**: 
    - HTML content: A custom button, a small form, a data visualization snippet
    - URL content: Embedding a Grafana dashboard, a third-party widget, a mini-application

## Content Delivery: `text` vs. `blob`

- **`text`**: Simple, direct string. Good for smaller, less complex content.
- **`blob`**: Base64 encoded string.
  - **Pros**: Handles special characters robustly, can be better for larger payloads, ensures integrity during JSON transport.
  - **Cons**: Requires Base64 decoding on the client, slightly increases payload size.

## URI List Format Support

When using `mimeType: 'text/uri-list'`, the content follows the standard URI list format (RFC 2483). However, **MCP-UI requires a single URL** for rendering.

- **Single URL Requirement**: MCP-UI will use only the first valid URL found
- **Multiple URLs**: If multiple URLs are provided, the client will use the first valid URL and log a warning about the ignored alternatives
- **Comments**: Lines starting with `#` are treated as comments and ignored
- **Empty lines**: Blank lines are ignored

**Example URI List Content:**
```
# Primary dashboard URL
https://dashboard.example.com/main

# Backup dashboard URL (will be ignored but logged)
https://backup.dashboard.example.com/main
```

**Client Behavior:**
- Uses `https://dashboard.example.com/main` for rendering
- Logs: `"Multiple URLs found in uri-list content. Using the first URL: "https://dashboard.example.com/main". Other URLs ignored: ["https://backup.dashboard.example.com/main"]"`

This design allows for fallback URLs to be specified in the standard format while maintaining simple client implementation that focuses on a single primary URL.

## Recommended Client-Side Pattern

Client-side hosts should check for the `ui://` URI scheme first to identify MCP-UI resources, rather than checking mimeType:

```tsx
// ✅ Recommended: Check URI scheme first
if (
  mcpResource.type === 'resource' &&
  mcpResource.resource.uri?.startsWith('ui://')
) {
  return <HtmlResource resource={mcpResource.resource} onUiAction={handleAction} />;
}

// ❌ Not recommended: Check mimeType first
if (
  mcpResource.type === 'resource' &&
  (mcpResource.resource.mimeType === 'text/html' || mcpResource.resource.mimeType === 'text/uri-list')
) {
  return <HtmlResource resource={mcpResource.resource} onUiAction={handleAction} />;
}
```

**Benefits of URI-first checking:**
- Future-proof: Works with new content types like `application/javascript`
- Semantic clarity: `ui://` clearly indicates this is a UI resource
- Simpler logic: Let the `HtmlResource` component handle mimeType-based rendering internally

## Communication (Client <-> Iframe)

For `ui://` resources, you can use `window.parent.postMessage` to send data or actions from the iframe back to the host client application. The client application should set up an event listener for `message` events.

**Iframe Script Example:**

```html
<button onclick="handleAction()">Submit Data</button>
<script>
  function handleAction() {
    const data = { action: 'formData', value: 'someValue' };
    // IMPORTANT: Always specify the targetOrigin for security!
    // Use '*' only if the parent origin is unknown or variable and security implications are understood.
    window.parent.postMessage({ tool: 'myCustomTool', params: data }, '*');
  }
</script>
```

**Client-Side Handler:**

```typescript
window.addEventListener('message', (event) => {
  // Add origin check for security: if (event.origin !== "expectedOrigin") return;
  if (event.data && event.data.tool) {
    // Call the onUiAction prop of HtmlResource
  }
});
```

For URL-based resources (`mimeType: 'text/uri-list'`), communication depends on what the external application supports (e.g., its own `postMessage` API, URL parameters, etc.).

## Backwards Compatibility

The MCP-UI client library maintains backwards compatibility with legacy `ui-app://` URI schemes used by older servers until MAJOR version 4.

### Legacy URI Support

- **`ui-app://`**: Legacy scheme for external applications containing URLs, but historically used incorrect `mimeType: 'text/html'`
- **Automatic Detection**: Client automatically detects and handles legacy URIs by overriding the incorrect mimeType
- **Migration Path**: Servers can gradually migrate from `ui-app://` to `ui://` + `mimeType: 'text/uri-list'`
- **Deprecation Warning**: Client logs warnings to encourage server updates

### Migration Examples

```typescript
// Legacy pattern (still supported):
{
  type: 'resource',
  resource: {
    uri: 'ui-app://dashboard/main',
    mimeType: 'text/html',
    text: 'https://grafana.example.com/dashboard'
  }
}

// Modern equivalent:
{
  type: 'resource',
  resource: {
    uri: 'ui://dashboard/main',
    mimeType: 'text/uri-list',
    text: 'https://grafana.example.com/dashboard'
  }
}
```

### Client Pattern for Both Legacy and Modern

```tsx
// This pattern works for both legacy and modern URIs:
if (
  mcpResource.type === 'resource' &&
  (mcpResource.resource.uri?.startsWith('ui://') || mcpResource.resource.uri?.startsWith('ui-app://'))
) {
  return <HtmlResource resource={mcpResource.resource} onUiAction={handleAction} />;
}
```