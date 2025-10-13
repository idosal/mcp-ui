# OpenAI Apps SDK Integration

The Apps SDK adapter in `@mcp-ui/server` ensures your HTML runs inside ChatGPT, but you still need to wire the resource into the Apps lifecycle so existing MCP clients keep working. This guide walks through the manual flow the adapter expects today.

## Why two resources?

- **Static template for Apps SDK** – referenced from your tool descriptor via `_meta["openai/outputTemplate"]`. This version must enable the Apps SDK adapter so ChatGPT injects the bridge script and uses the `text/html+skybridge` MIME type.
- **Embedded resource in tool results** – returned each time your tool runs. This version should *not* enable the adapter so MCP-native hosts continue to receive standard MCP-UI HTML.

## Step-by-step workflow

### 1. Register the Apps SDK template

Use `createUIResource` with `adapters.appsSdk.enabled: true` and expose it through the MCP Resources API so both Apps SDK and traditional MCP hosts can fetch it.

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createUIResource } from '@mcp-ui/server';

const server = new McpServer({ name: 'weather-bot', version: '1.0.0' });
const TEMPLATE_URI = 'ui://widgets/weather';

const appsSdkTemplate = createUIResource({
  uri: TEMPLATE_URI,
  encoding: 'text',
  adapters: {
    appsSdk: {
      enabled: true,
      config: { intentHandling: 'prompt' },
    },
  },
  content: {
    type: 'rawHtml',
    htmlString: renderInitialShell(),
  },
});

server.registerResource(TEMPLATE_URI, async () => appsSdkTemplate.resource);
```

> **Note:** The adapter switches the MIME type to `text/html+skybridge` and injects the Apps bridge script automatically. No extra HTML changes are required.

### 2. Reference the template in your tool descriptor

The Apps SDK looks for `_meta["openai/outputTemplate"]` to know which resource to render. Mirror the rest of the Apps-specific metadata you need (status text, accessibility hints, security schemes, etc.).

```ts
server.registerTool(
  'forecast',
  {
    title: 'Get the forecast',
    description: 'Returns a UI that displays the current weather.',
    inputSchema: {
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
    },
    _meta: {
      'openai/outputTemplate': TEMPLATE_URI,
      'openai/toolInvocation/invoking': 'Fetching forecast…',
      'openai/toolInvocation/invoked': 'Forecast ready',
      'openai/widgetAccessible': true,
    },
  },
  async ({ city }) => {
    const forecast = await fetchForecast(city);

    // Step 3 happens inside the handler.
    return {
      content: [
        {
          type: 'text',
          text: `Forecast prepared for ${city}.`,
        },
      ],
      structuredContent: {
        forecast,
      },
    };
  },
);
```

For the complete list of supported metadata fields, refer to the official documentation. [Apps SDK Reference](https://developers.openai.com/apps-sdk/reference)

