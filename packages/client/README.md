## 📦 Model Context Protocol UI SDK

<p align="center">
  <a href="https://www.npmjs.com/package/@mcp-ui/server"><img src="https://img.shields.io/npm/v/@mcp-ui/server?label=server&color=green" alt="Server Version"></a>
  <a href="https://www.npmjs.com/package/@mcp-ui/client"><img src="https://img.shields.io/npm/v/@mcp-ui/client?label=client&color=blue" alt="Client Version"></a>
</p>

<p align="center">
  <a href="#-what-is-mcp-ui">What's mcp-ui?</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-quickstart">Quickstart</a> •
  <a href="#-core-concepts">Core Concepts</a> •
  <a href="#-examples">Examples</a> •
  <a href="#-roadmap">Roadmap</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

----

**`mcp-ui`** brings interactive web components to the [Model Context Protocol](https://modelcontextprotocol.io/introduction) (MCP). Deliver rich, dynamic UI resources directly from your MCP server to be rendered by the client. Take AI interaction to the next level!

> *This project is an experimental playground for MCP UI ideas. Expect rapid iteration and community-driven enhancements!*

<video src="https://github.com/user-attachments/assets/51f7c712-8133-4d7c-86d3-fdca550b9767"></video>

## 💡 What's `mcp-ui`?

`mcp-ui` is a TypeScript SDK comprising two packages:

* **`@mcp-ui/server`**: Utilities to generate `HtmlResourceBlock` objects on your MCP server.
* **`@mcp-ui/client`**: UI components (e.g., `<HtmlResource />`) to render those blocks in the browser and handle their events.

Together, they let you define reusable UI resource blocks on the server side, seamlessly display them in the client, and react to their actions in the MCP host environment.


## ✨ Core Concepts

### HtmlResource

The primary payload exchanged between the server and the client:

```ts
interface HtmlResourceBlock {
  type: 'resource';
  resource: {
    uri: string;       // e.g. "ui://component/id"
    mimeType: 'text/html' | 'text/uri-list'; // text/html for HTML content, text/uri-list for URL content
    text?: string;      // Inline HTML or external URL
    blob?: string;      // Base64-encoded HTML or URL (for large payloads)
  };
}
```

* **`uri`**: Unique identifier for caching and routing
  * `ui://…` — UI resources (rendering method determined by mimeType)
* **`mimeType`**: `text/html` for HTML content (iframe srcDoc), `text/uri-list` for URL content (iframe src)
  * **MCP-UI requires a single URL**: While `text/uri-list` format supports multiple URLs, MCP-UI uses only the first valid URL and logs others
* **`text` vs. `blob`**: Choose `text` for simple strings; use `blob` for larger or encoded content.

It's rendered in the client with the `<HtmlResource>` React component.

`HtmlResource` now provides an optional `secure` render mode which sanitizes the incoming HTML using DOMPurify and avoids embedding untrusted content in an iframe. Future versions may adopt React Server Components or Remote DOM for even tighter isolation.

### UI Action

UI blocks must be able to interact with the agent. In `mcp-ui`, this is done by hooking into events sent from the UI block and reacting to them in the host. For example, an HTML may trigger a tool call when a button is clicked by sending an event which will be caught handled by the client.

## 🏗️ Installation

```bash
# using npm
npm install @mcp-ui/server @mcp-ui/client

# or pnpm
pnpm add @mcp-ui/server @mcp-ui/client

# or yarn
yarn add @mcp-ui/server @mcp-ui/client
```

## 🎬 Quickstart

1. **Server-side**: Build your resource blocks

   ```ts
   import { createHtmlResource } from '@mcp-ui/server';

   // Inline HTML
   const direct = createHtmlResource({
     uri: 'ui://greeting/1',
     content: { type: 'rawHtml', htmlString: '<p>Hello, MCP UI!</p>' },
     delivery: 'text',
   });

   // External URL
   const external = createHtmlResource({
     uri: 'ui://widget/session-42',
     content: { type: 'externalUrl', iframeUrl: 'https://example.com/widget' },
     delivery: 'text',
   });
   ```

2. **Client-side**: Render in your MCP host

   ```tsx
   import React from 'react';
   import { HtmlResource } from '@mcp-ui/client';

   function App({ mcpResource }) {
     if (
       mcpResource.type === 'resource' &&
       mcpResource.resource.uri?.startsWith('ui://')
     ) {
       return (
         <HtmlResource
           resource={mcpResource.resource}
           onUiAction={(result) => {
             console.log('Action:', result);
             return { status: 'ok' };
           }}
         />
       );
     }
     return <p>Unsupported resource</p>;
   }
   ```

3. **Enjoy** interactive MCP UIs — no extra configuration required.

## 🌍 Examples

**Client example**
* [ui-inspector](https://github.com/idosal/ui-inspector) - inspect local `mcp-ui`-enabled servers. Check out the [hosted version](https://scira-mcp-chat-git-main-idosals-projects.vercel.app/)!
* [MCP-UI Chat](https://github.com/idosal/scira-mcp-ui-chat) - interactive chat built with the `mcp-ui` client.

**Server example**
Try out the hosted app -
* **HTTP Streaming**: `https://remote-mcp-server-authless.idosalomon.workers.dev/mcp`
* **SSE**: `https://remote-mcp-server-authless.idosalomon.workers.dev/sse`

The app is deployed from `examples/server`.

Drop those URLs into any MCP-compatible host to see `mcp-ui` in action.


## 🛣️ Roadmap

- [X] Add online playground
- [ ] Support React Server Components
- [ ] Support Remote-DOM
- [ ] Support additional client-side libraries (e.g., Vue)
- [ ] Expand UI Action API (beyond tool calls)
- [ ] Do more with Resources and Sampling

## 🤝 Contributing

Contributions, ideas, and bug reports are welcome! See the [contribution guidelines](https://github.com/idosal/mcp-ui/blob/main/.github/CONTRIBUTING.md) to get started.


## 📄 License

Apache License 2.0 © [The MCP UI Authors](LICENSE)

## Disclaimer

This project is provided "as is", without warranty of any kind. The `mcp-ui` authors and contributors shall not be held liable for any damages, losses, or issues arising from the use of this software. Use at your own risk.
