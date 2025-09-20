# @mcp-ui/server Usage & Examples

This page provides practical examples for using the `@mcp-ui/server` package.

For a complete example, see the [`typescript-server-demo`](https://github.com/idosal/mcp-ui/tree/docs/ts-example/examples/typescript-server-demo).

## Basic Setup

First, ensure you have `@mcp-ui/server` available in your project:

```bash
npm i @mcp-ui/server
```

## Basic Usage

The core function is `createUIResource`.

```typescript
import {
  createUIResource,
} from '@mcp-ui/server';

// Using a shared enum value (just for demonstration)
console.log('Shared Enum from server usage:', PlaceholderEnum.FOO);

// Example 1: Direct HTML, delivered as text
const resource1 = createUIResource({
  uri: 'ui://my-component/instance-1',
  content: { type: 'rawHtml', htmlString: '<p>Hello World</p>' },
  encoding: 'text',
});
console.log('Resource 1:', JSON.stringify(resource1, null, 2));
/* Output for Resource 1:
{
  "type": "resource",
  "resource": {
    "uri": "ui://my-component/instance-1",
    "mimeType": "text/html",
    "text": "<p>Hello World</p>"
  }
}
*/

// Example 2: Direct HTML, delivered as a Base64 blob
const resource2 = createUIResource({
  uri: 'ui://my-component/instance-2',
  content: { type: 'rawHtml', htmlString: '<h1>Complex HTML</h1>' },
  encoding: 'blob',
});
console.log(
  'Resource 2 (blob will be Base64):',
  JSON.stringify(resource2, null, 2),
);
/* Output for Resource 2:
{
  "type": "resource",
  "resource": {
    "uri": "ui://my-component/instance-2",
    "mimeType": "text/html",
    "blob": "PGRpdj48aDI+Q29tcGxleCBDb250ZW50PC9oMj48c2NyaXB0PmNvbnNvbGUubG9nKFwiTG9hZGVkIVwiKTwvc2NyaXB0PjwvZGl2Pg=="
  }
}
*/

// Example 3: External URL, text encoding
const dashboardUrl = 'https://my.analytics.com/dashboard/123';
const resource3 = createUIResource({
  uri: 'ui://analytics-dashboard/main',
  content: { type: 'externalUrl', iframeUrl: dashboardUrl },
  encoding: 'text',
});
console.log('Resource 3:', JSON.stringify(resource3, null, 2));
/* Output for Resource 3:
{
  "type": "resource",
  "resource": {
    "uri": "ui://analytics-dashboard/main",
    "mimeType": "text/uri-list",
    "text": "https://my.analytics.com/dashboard/123"
  }
}
*/

// Example 4: External URL, blob encoding (URL is Base64 encoded)
const chartApiUrl = 'https://charts.example.com/api?type=pie&data=1,2,3';
const resource4 = createUIResource({
  uri: 'ui://live-chart/session-xyz',
  content: { type: 'externalUrl', iframeUrl: chartApiUrl },
  encoding: 'blob',
});
console.log(
  'Resource 4 (blob will be Base64 of URL):',
  JSON.stringify(resource4, null, 2),
);
/* Output for Resource 4:
{
  "type": "resource",
  "resource": {
    "uri": "ui://live-chart/session-xyz",
    "mimeType": "text/uri-list",
    "blob": "aHR0cHM6Ly9jaGFydHMuZXhhbXBsZS5jb20vYXBpP3R5cGU9cGllJmRhdGE9MSwyLDM="
  }
}
*/

// Example 5: Remote DOM script, text encoding
const remoteDomScript = `
  const button = document.createElement('ui-button');
  button.setAttribute('label', 'Click me for a tool call!');
  button.addEventListener('press', () => {
    window.parent.postMessage({ type: 'tool', payload: { toolName: 'uiInteraction', params: { action: 'button-click', from: 'remote-dom' } } }, '*');
  });
  root.appendChild(button);
`;

const resource5 = createUIResource({
  uri: 'ui://remote-component/action-button',
  content: {
    type: 'remoteDom',
    script: remoteDomScript,
    framework: 'react', // or 'webcomponents'
  },
  encoding: 'text',
});
console.log('Resource 5:', JSON.stringify(resource5, null, 2));
/* Output for Resource 5:
{
  "type": "resource",
  "resource": {
    "uri": "ui://remote-component/action-button",
    "mimeType": "application/vnd.mcp-ui.remote-dom+javascript; framework=react",
    "text": "\\n  const button = document.createElement('ui-button');\\n  button.setAttribute('label', 'Click me for a tool call!');\\n  button.addEventListener('press', () => {\\n    window.parent.postMessage({ type: 'tool', payload: { toolName: 'uiInteraction', params: { action: 'button-click', from: 'remote-dom' } } }, '*');\\n  });\\n  root.appendChild(button);\\n"
  }
}
*/

// These resource objects would then be included in the 'content' array
// of a toolResult in an MCP interaction.
```

## Metadata Configuration Examples

The `createUIResource` function supports several types of metadata configuration to enhance your UI resources:

```typescript
import { createUIResource } from '@mcp-ui/server';

// Example 7: Using standard metadata
const resourceWithMetadata = createUIResource({
  uri: 'ui://analytics/dashboard',
  content: { type: 'rawHtml', htmlString: '<div id="dashboard">Loading...</div>' },
  encoding: 'text',
  metadata: {
    title: 'Analytics Dashboard',
    description: 'Real-time analytics and metrics',
    created: '2024-01-15T10:00:00Z',
    author: 'Analytics Team',
    preferredRenderContext: 'sidebar'
  }
});
console.log('Resource with metadata:', JSON.stringify(resourceWithMetadata, null, 2));
/* Output includes:
{
  "type": "resource",
  "resource": {
    "uri": "ui://analytics/dashboard",
    "mimeType": "text/html",
    "text": "<div id=\"dashboard\">Loading...</div>",
    "_meta": {
      "title": "Analytics Dashboard",
      "description": "Real-time analytics and metrics",
      "created": "2024-01-15T10:00:00Z",
      "author": "Analytics Team",
      "preferredRenderContext": "sidebar"
    }
  }
}
*/

// Example 8: Using uiMetadata for client-side configuration
const resourceWithUIMetadata = createUIResource({
  uri: 'ui://chart/interactive',
  content: { type: 'externalUrl', iframeUrl: 'https://charts.example.com/widget' },
  encoding: 'text',
  uiMetadata: {
    'preferred-frame-size': ['800px', '600px'],
    'initial-render-data': { 
      theme: 'dark', 
      chartType: 'bar',
      dataSet: 'quarterly-sales' 
    },
  }
});
console.log('Resource with UI metadata:', JSON.stringify(resourceWithUIMetadata, null, 2));
/* Output includes:
{
  "type": "resource",
  "resource": {
    "uri": "ui://chart/interactive",
    "mimeType": "text/uri-list",
    "text": "https://charts.example.com/widget",
    "_meta": {
      "mcpui.dev/ui-preferred-frame-size": ["800px", "600px"],
      "mcpui.dev/ui-initial-render-data": { 
        "theme": "dark", 
        "chartType": "bar",
        "dataSet": "quarterly-sales" 
      },
    }
  }
}
*/

// Example 9: Using embeddedResourceProps for additional MCP properties
const resourceWithProps = createUIResource({
  uri: 'ui://form/user-profile',
  content: { type: 'rawHtml', htmlString: '<form id="profile">...</form>' },
  encoding: 'text',
  embeddedResourceProps: {
    annotations: {
      audience: ['user'],
      priority: 'high'
    }
  }
});
console.log('Resource with additional props:', JSON.stringify(resourceWithProps, null, 2));
/* Output includes:
{
  "type": "resource",
  "resource": {
    "uri": "ui://form/user-profile",
    "mimeType": "text/html",
    "text": "<form id=\"profile\">...</form>",
  },
  "annotations": {
    "audience": ["user"],
    "priority": "high"
  }
}
*/
```

### Metadata Best Practices

- **Use `metadata` for standard MCP resource information** like titles, descriptions, timestamps, and authorship
- **Use `uiMetadata` for client rendering hints** like preferred sizes, initial data, and context preferences  
- **Use `resourceProps` for MCP specification properties**, descriptions at the resource level, and other standard fields
- **Use `embeddedResourceProps` for MCP embedded resource properties** like annotations.

## Advanced URI List Example

You can provide multiple URLs in the `text/uri-list` format for fallback purposes. However, **MCP-UI requires a single URL** and will only use the first valid URL found:

```typescript
// Example 10: Multiple URLs with fallbacks (MCP-UI uses only the first)
const multiUrlContent = `# Primary dashboard
https://dashboard.example.com/main

# Backup dashboard (will be logged but not used)
https://backup.dashboard.example.com/main

# Emergency fallback (will be logged but not used)  
https://emergency.dashboard.example.com/main`;

const resource = createUIResource({
  uri: 'ui://dashboard-with-fallbacks/session-123',
  content: { type: 'externalUrl', iframeUrl: multiUrlContent },
  encoding: 'text',
});

/* The client will:
 * 1. Use https://dashboard.example.com/main for rendering
 * 2. Log a warning about the ignored backup URLs
 * This allows you to specify fallback URLs in the standard format while MCP-UI focuses on the primary URL
 */
```

## Error Handling

The `createUIResource` function will throw errors if invalid combinations are provided, for example:

- URI not starting with `ui://` for any content type
- Invalid content type specified

```typescript
try {
  createUIResource({
    uri: 'invalid://should-be-ui',
    content: { type: 'externalUrl', iframeUrl: 'https://example.com' },
    encoding: 'text',
  });
} catch (e: any) {
  console.error('Caught expected error:', e.message);
  // MCP-UI SDK: URI must start with 'ui://' when content.type is 'externalUrl'.
}
```