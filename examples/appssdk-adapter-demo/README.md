# Apps SDK Adapter Demo

This example demonstrates how to use platform adapters in `@mcp-ui/server` to make MCP-UI widgets compatible with different environments. Specifically, this shows the Apps SDK adapter for environments like ChatGPT.

## What are Adapters?

Adapters enable MCP-UI widgets to work seamlessly across different platform environments by:
- Translating MCP-UI `postMessage` calls to platform-specific API calls (e.g., `window.openai` in ChatGPT)
- Handling bidirectional communication (tools, prompts, state management)
- Working transparently without requiring changes to your existing MCP-UI code

The adapters architecture supports multiple platforms, with Apps SDK being the first example.

## Example Code

```typescript
import { createUIResource } from '@mcp-ui/server';

// Example 1: Simple button with tool call
const simpleButtonResource = createUIResource({
  uri: 'ui://appssdk-demo/button',
  content: {
    type: 'rawHtml',
    htmlString: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          button {
            background-color: #10a37f;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          }
          button:hover {
            background-color: #0d8c6d;
          }
        </style>
      </head>
      <body>
        <h2>Apps SDK Adapter Demo</h2>
        <button onclick="handleClick()">Call Tool</button>
        <div id="result"></div>
        
        <script>
          function handleClick() {
            // Standard MCP-UI postMessage - the adapter translates this to window.openai.callTool()
            window.parent.postMessage({
              type: 'tool',
              payload: {
                toolName: 'getWeather',
                params: { city: 'San Francisco' }
              }
            }, '*');
            
            document.getElementById('result').innerText = 'Tool called!';
          }
        </script>
      </body>
      </html>
    `
  },
  encoding: 'text',
  // Enable adapters
  adapters: {
    appsSdk: {
      enabled: true,
      config: {
        intentHandling: 'prompt',
        timeout: 30000
      }
    }
  }
});

// Example 2: Widget that uses render data from Apps SDK
const renderDataResource = createUIResource({
  uri: 'ui://appssdk-demo/render-data',
  content: {
    type: 'rawHtml',
    htmlString: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .info { background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h2>Render Data Demo</h2>
        <div id="data">Loading...</div>
        
        <script>
          // Listen for render data from Apps SDK
          window.addEventListener('message', (event) => {
            if (event.data.type === 'ui-lifecycle-iframe-render-data') {
              const { renderData } = event.data.payload;
              document.getElementById('data').innerHTML = \`
                <div class="info">
                  <strong>Tool Input:</strong> \${JSON.stringify(renderData.toolInput, null, 2)}
                </div>
                <div class="info">
                  <strong>Theme:</strong> \${renderData.theme}
                </div>
                <div class="info">
                  <strong>Locale:</strong> \${renderData.locale}
                </div>
              \`;
            }
          });
          
          // Request render data
          window.parent.postMessage({
            type: 'ui-request-render-data'
          }, '*');
        </script>
      </body>
      </html>
    `
  },
  encoding: 'text',
  adapters: {
    appsSdk: {
      enabled: true
    }
  }
});

// Example 3: Interactive form with multiple actions
const interactiveFormResource = createUIResource({
  uri: 'ui://appssdk-demo/form',
  content: {
    type: 'rawHtml',
    htmlString: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          input, button { margin: 5px 0; padding: 8px; }
          button { background: #10a37f; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h2>Interactive Form</h2>
        <input type="text" id="messageInput" placeholder="Enter a message">
        <br>
        <button onclick="sendPrompt()">Send Prompt</button>
        <button onclick="sendNotification()">Notify</button>
        
        <script>
          function sendPrompt() {
            const message = document.getElementById('messageInput').value;
            window.parent.postMessage({
              type: 'prompt',
              payload: { prompt: message }
            }, '*');
          }
          
          function sendNotification() {
            const message = document.getElementById('messageInput').value;
            window.parent.postMessage({
              type: 'notify',
              payload: { message: 'User sent: ' + message }
            }, '*');
          }
        </script>
      </body>
      </html>
    `
  },
  encoding: 'text',
  adapters: {
    appsSdk: {
      enabled: true,
      config: {
        intentHandling: 'prompt'
      }
    }
  }
});
```

## How to Use

1. Install dependencies:
```bash
npm install @mcp-ui/server
```

2. Create your MCP server with the examples above.

3. **Register an Apps SDK template resource** – call `createUIResource` with the adapter enabled and expose it via `server.registerResource` (or the equivalent in your language SDK). The adapter wraps the HTML and switches the MIME type to `text/html+skybridge` so ChatGPT accepts it as an output template.

4. **Reference that template from your tool definition** – when calling `registerTool`, set `_meta["openai/outputTemplate"]` to the template URI and include any other Apps SDK metadata (`openai/toolInvocation/*`, `openai/widgetAccessible`, `securitySchemes`, etc.).

5. **Return plain MCP content from the tool runtime** – send text parts and/or `structuredContent` that match your declared schema. The template from step 3 is what ChatGPT actually renders, while other MCP hosts can still consume the textual/structured result.

6. Deploy your server and connect it to the target environment (e.g., ChatGPT). The manual wiring ensures both MCP-UI-native clients and Apps SDK clients share the same UI implementation.

## Supported Features

✅ **Tool Calls** - Call tools using `{ type: 'tool', payload: { toolName, params } }`

✅ **Prompts** - Send follow-up messages using `{ type: 'prompt', payload: { prompt } }`

✅ **Intents** - Express user intents (automatically converted to prompts)

✅ **Notifications** - Send notifications to the host

✅ **Render Data** - Access context like `toolInput`, `toolOutput`, `theme`, `locale`

⚠️ **Links** - Navigation may not be supported in all Apps SDK environments

## Configuration Options

```typescript
adapters: {
  appsSdk?: {
    enabled: boolean,  // Enable/disable the Apps SDK adapter
    config?: {
      intentHandling?: 'prompt' | 'ignore',  // How to handle intent messages
      timeout?: number,  // Timeout for async operations (ms)
      hostOrigin?: string  // Origin for MessageEvents
    }
  }
  // Future adapters can be added here
  // anotherPlatform?: { ... }
}
```

## Learn More

- [Apps SDK Documentation](https://developers.openai.com/apps-sdk/)
- [MCP-UI Documentation](https://mcpui.dev)

