---
layout: home

hero:
  name: MCP-UI
  text: Interactive UI Components for MCP
  tagline: Build rich, dynamic user interfaces for your MCP applications with SDKs that bring UI to AI interactions.
  image:
    light: /logo-lg-black.png
    dark: /logo-lg.png
    alt: MCP-UI Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/idosal/mcp-ui
    - theme: alt
      text: Live Demo
      link: https://scira-mcp-chat-git-main-idosals-projects.vercel.app/
    - theme: alt
      text: About
      link: /about

features:
  - title: ⚛️ Client SDK
    details: Provides a React component and Web Component for easy frontend integration. Render interactive UI resources and handle UI actions effortlessly.
  - title: 🛠️ Server SDKs
    details: Powerful utilities to construct interactive UI for MCP servers. Create HTML, React, Web Components, and external app UI with ergonomic APIs for Typescript and Ruby.
  - title: 🔒 Secure
    details: All remote code executes in sandboxed iframes, ensuring host and user security while maintaining rich interactivity.
  - title: 🎨 Flexible
    details: Support for multiple content types, including iframes and Remote DOM components that match your host's look-and-feel.
---

<!-- ## See MCP-UI in Action -->
<div style="display: flex; flex-direction: column; align-items: center; margin: 3rem 0 2rem 0;">
<span class="text animated-gradient-text" style="font-size: 30px; font-family: var(--vp-font-family-base); font-weight: 600;
    letter-spacing: -0.01em; margin-bottom: 0.5rem; text-align: center; line-height: 1.2;">See it in action</span>
<div class="video-container" style="display: flex; justify-content: center; align-items: center;">
  <video controls width="100%" style="max-width: 800px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
    <source src="https://github.com/user-attachments/assets/7180c822-2dd9-4f38-9d3e-b67679509483" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>
</div>

## Quick Example

**Server Side** - Create interactive resources to return in your MCP tool results:

::: code-group
```typescript [TypeScript]
import { createUIResource } from '@mcp-ui/server';

const interactiveForm = createUIResource({
  uri: 'ui://user-form/1',
  content: {
    type: 'externalUrl',
    iframeUrl: 'https://yourapp.com'
  },
  encoding: 'text',
});
```

```ruby [Ruby]
require 'mcp_ui_server'

interactive_form = McpUiServer.create_ui_resource(
  uri: 'ui://user-form/1',
  content: {
    type: :external_url,
    iframeUrl: 'https://yourapp.com'
  },
  encoding: :text
)
```
:::

**Client Side** - Render on the host with a single component:

::: code-group
```tsx [React]
import { UIResourceRenderer } from '@mcp-ui/client';

// `mcpResource` would come from your MCP response
function MyApp({ mcpResource }) {
  return (
    <UIResourceRenderer
      resource={mcpResource.resource}
      onUIAction={(action) => {
        console.log('User action:', action);
      }}
    />
  );
}
```

```html [Web Component / HTML]
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
  renderer.setAttribute('resource', JSON.stringify(mcpResource.resource));

  // 4. Listen for events
  renderer.addEventListener('onUIAction', (event) => {
    console.log('User action:', event.detail);
  });
</script>
```
:::


<style>
.video-container {
  text-align: center;
  margin: 2rem 0;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.action-button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action-button.primary {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

.action-button.primary:hover {
  background: var(--vp-c-brand-2);
}

.action-button.secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.action-button.secondary:hover {
  background: var(--vp-c-bg-mute);
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-button {
    width: 200px;
    text-align: center;
  }
}

a.VPButton.medium[href="/about"] {
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
}

a.VPButton.medium[href="/about"]:hover {
  background-color: var(--vp-c-bg-mute);
}
</style>
