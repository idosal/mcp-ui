# HTMLResourceRenderer Component

The `<HTMLResourceRenderer />` component is an internal component used by `<UIResourceRenderer />` to render HTML and URL-based resources.

## Props

```typescript
import type { Resource } from '@modelcontextprotocol/sdk/types';
import type { MCPContextProps, ClientContextProps } from '@mcp-ui/client';

export interface HTMLResourceRendererProps {
  resource: Partial<Resource>;
  onUIAction?: (result: UIActionResult) => Promise<any>;
  style?: React.CSSProperties;
  proxy?: string;
  iframeRenderData?: Record<string, unknown>;
  mcpContextProps?: MCPContextProps;
  clientContextProps?: ClientContextProps;
  autoResizeIframe?: boolean | { width?: boolean; height?: boolean };
  sandboxPermissions?: string;
  iframeProps?: Omit<React.HTMLAttributes<HTMLIFrameElement>, 'src' | 'srcDoc' | 'ref' | 'style'>;
}
```

The component accepts the following props:

- **`resource`**: The resource object from an `UIResource`. It should include `uri`, `mimeType`, and either `text` or `blob`.
- **`onUIAction`**: An optional callback that fires when the iframe content (for `ui://` resources) posts a message to your app. The message should look like:
  ```typescript
  { type: 'tool', payload: { toolName: string, params: Record<string, unknown> }, messageId?: string } |
  { type: 'intent', payload: { intent: string, params: Record<string, unknown> }, messageId?: string } |
  { type: 'prompt', payload: { prompt: string }, messageId?: string } |
  { type: 'notify', payload: { message: string }, messageId?: string } |
  { type: 'link', payload: { url: string }, messageId?: string } |
  ```
  If you don't provide a callback for a specific type, the default handler will be used.
  
  **Asynchronous Response Handling**: When a message includes a `messageId` field, the iframe will automatically receive response messages:
  - `ui-message-received`: Sent immediately when the message is received
  - `ui-message-response`: Sent when your callback resolves successfully or throws an error
  
  See [Protocol Details](../protocol-details.md#asynchronous-communication-with-message-ids) for complete examples.
- **`style`**: (Optional) Custom styles for the iframe.
- **`proxy`**: (Optional) A URL to a proxy script. This is useful for hosts with a strict Content Security Policy (CSP). When provided, external URLs will be rendered in a nested iframe hosted at this URL. For example, if `proxy` is `https://my-proxy.com/`, the final URL will be `https://my-proxy.com/?url=<encoded_original_url>`. For your convenience, mcp-ui hosts a proxy script at `https://proxy.mcpui.dev`, which you can use as a the prop value without any setup (see `examples/external-url-demo`).
- **`iframeProps`**: (Optional) Custom props for the iframe.
- **`iframeRenderData`**: (Optional) Additional data merged into the render payload forwarded to the iframe. When `mcpContextProps.toolOutput` is provided, it takes precedence over this merged object.
- **`autoResizeIframe`**: (Optional) When enabled, the iframe will automatically resize based on messages from the iframe's content. This prop can be a boolean (to enable both width and height resizing) or an object (`{width?: boolean, height?: boolean}`) to control dimensions independently.
- **`sandboxPermissions`**: (Optional) Additional iframe sandbox permissions to add to the defaults. These are merged with:
  - External URLs (`text/uri-list`): `'allow-scripts allow-same-origin'`
  - Raw HTML content (`text/html`): `'allow-scripts'`
  
  For example, to allow forms in raw HTML: `sandboxPermissions="allow-forms"`

## How It Works

1.  **Checks Content Type**: If `resource.mimeType` isn't `"text/html"` or `"text/uri-list"`, you'll see an error.
2.  **Handles URI Schemes**:
    - For resources with `mimeType: 'text/uri-list'`:
      - Expects `resource.text` or `resource.blob` to contain a single URL in URI list format
      - **MCP-UI requires a single URL**: While the format supports multiple URLs, only the first valid `http/s` URL is used
      - Multiple URLs are supported for fallback specification but will trigger warnings
      - Ignores comment lines starting with `#` and empty lines
      - If using `blob`, it decodes it from Base64.
      - Renders an `<iframe>` with its `src` set to the first valid URL.
      - If a valid URL is passed to the `proxy` prop, it will be used as the source for the iframe, which then renders the external URL in a nested iframe. For example, if `proxy` is `https://my-proxy.com/`, the final URL will be `https://my-proxy.com/?url=<encoded_original_url>`.
      - Default sandbox: `allow-scripts allow-same-origin` (needed for some external sites; be mindful of security).
    - For resources with `mimeType: 'text/html'`:
      - Expects `resource.text` or `resource.blob` to contain HTML.
      - If using `blob`, it decodes it from Base64.
      - Renders an `<iframe>` with its `srcdoc` set to the HTML.
      - Default sandbox: `allow-scripts`.
    
  **Custom Sandbox Permissions**: You can provide additional permissions via the `sandboxPermissions` prop. These will be added to the default permissions listed above.
3.  **Listens for Messages**: Adds a global `message` event listener. If an iframe posts a message with `event.data.tool`, your `onUIAction` callback is called.

## Styling

By default, the iframe stretches to 100% width and is at least 200px tall. You can override this with the `style` prop or your own CSS.

## Example Usage

See [Client SDK Usage & Examples](./react-usage-examples.md) for examples using the recommended `<UIResourceRenderer />` component.

## Auto-Resizing the Iframe

To make the iframe auto-resize, two things need to happen:
1. The `autoResizeIframe` prop must be set in `htmlProps`when rendering `<UIResourceRenderer />`).
2. The content inside the iframe must send a `ui-size-change` message to the parent window when its size changes.

The payload of the message should be an object with `width` and/or `height` properties.

### Example Iframe Implementation

Here is an example of how you can use a `ResizeObserver` within your iframe's content to notify the host application of size changes:

```javascript
const resizeObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    window.parent.postMessage(
      {
        type: "ui-size-change",
        payload: {
          height: entry.contentRect.height,
        },
      },
      "*",
    );
  });
});

resizeObserver.observe(document.documentElement)
```

This will observe the root `<html>` element and send a message whenever its height changes. The `<HTMLResourceRenderer />` will catch this message and adjust the iframe's height accordingly. You can also include `width` in the payload if you need to resize the width.

## Security Notes

- **`sandbox` attribute**: Restricts what the iframe can do. Default permissions are:
  - External URLs: `allow-scripts allow-same-origin` (needed for external apps)
  - Raw HTML: `allow-scripts` (for JavaScript execution)
  
  Additional permissions can be granted via the `sandboxPermissions` prop (e.g., `allow-forms`, `allow-modals`). Be cautious when adding permissions as they reduce security isolation.
  
- **`postMessage` origin**: When sending messages from the iframe, always specify the target origin for safety. The component listens globally, so your iframe content should be explicit.
- **Content Sanitization**: HTML is rendered as-is. If you don't fully trust the source, sanitize the HTML before passing it in, or rely on the iframe's sandboxing.
