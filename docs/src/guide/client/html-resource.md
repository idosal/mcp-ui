# HtmlResource Component

The `<HtmlResource />` component is currently the main component of the`@mcp-ui/client` package. It's the only export you need to render interactive HTML resources in your React app.

## Props

```typescript
import type { Resource } from '@modelcontextprotocol/sdk/types';

export interface HtmlResourceProps {
  resource: Partial<Resource>;
  onUiAction?: (result: UiActionResult) => Promise<any>;
  style?: React.CSSProperties;
  renderMode?: 'iframe' | 'secure';
}
```

- **`resource`**: The resource object from an `HtmlResourceBlock`. It should include `uri`, `mimeType`, and either `text` or `blob`.
- **`onUiAction`**: An optional callback that fires when the iframe content (for `ui://` resources) posts a message to your app. The message should look like:
  ```typescript
  { type: 'tool', payload: { toolName: string, params: Record<string, unknown> } } |
  { type: 'intent', payload: { intent: string, params: Record<string, unknown> } } |
  { type: 'prompt', payload: { prompt: string } } |
  { type: 'notification', payload: { message: string } } |
  { type: 'link', payload: { url: string } } |
  ```
  If you don't provide a callback for a specific type, the default handler will be used.
- **`style`** (optional): Custom styles for the iframe.
- **`renderMode`** (optional): `'iframe'` (default) or `'secure'`. Secure mode
  sanitizes the HTML and renders it directly without an iframe. Actions are
  triggered by elements with `data-tool` and optional `data-params` attributes.

## How It Works

1.  **Checks Content Type**: If `resource.mimeType` isn't `"text/html"` or `"text/uri-list"`, you'll see an error.
2.  **Handles URI Schemes**:
    - For resources with `mimeType: 'text/uri-list'`:
      - Expects `resource.text` or `resource.blob` to contain a single URL in URI list format
      - **MCP-UI requires a single URL**: While the format supports multiple URLs, only the first valid URL is used
      - Multiple URLs are supported for fallback specification but will trigger warnings
      - Ignores comment lines starting with `#` and empty lines
      - If using `blob`, it decodes it from Base64.
      - Renders an `<iframe>` with its `src` set to the first valid URL.
      - Sandbox: `allow-scripts allow-same-origin` (needed for some external sites; be mindful of security).
    - For resources with `mimeType: 'text/html'`:
      - Expects `resource.text` or `resource.blob` to contain HTML.
      - If using `blob`, it decodes it from Base64.
      - Renders an `<iframe>` with its `srcdoc` set to the HTML.
      - Sandbox: `allow-scripts`.
3.  **Listens for Messages**: Adds a global `message` event listener. If an iframe posts a message with `event.data.tool`, your `onUiAction` callback is called.

## Styling

By default, the iframe stretches to 100% width and is at least 200px tall. You can override this with the `style` prop or your own CSS.

## Example Usage

See [Client SDK Usage & Examples](./usage-examples.md).

## Secure Renderer (Experimental)

When `renderMode` is set to `"secure"`, the HTML is sanitized using
[`DOMPurify`](https://github.com/cure53/DOMPurify) and injected directly into the
page. No iframe is used. Interactive elements should emit actions by including a
`data-tool` attribute and an optional `data-params` JSON string.

## Security Notes

- **`sandbox` attribute**: Restricts what the iframe can do. `allow-scripts` is needed for interactivity. `allow-same-origin` is only used for `ui-app://` URLs.
- **`postMessage` origin**: When sending messages from the iframe, always specify the target origin for safety.
- **Content Sanitization**: In `secure` mode the HTML is sanitized with DOMPurify before rendering. In `iframe` mode the HTML is rendered as-is and relies on the iframe's sandboxing.
