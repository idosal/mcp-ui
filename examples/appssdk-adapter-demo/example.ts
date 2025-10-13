/**
 * Platform Adapters Example
 * 
 * This example demonstrates how to create MCP-UI resources that work
 * seamlessly across multiple platforms using adapters. The Apps SDK adapter
 * enables compatibility with environments like ChatGPT.
 */

import { createUIResource } from '@mcp-ui/server';

// Example 1: Simple interactive button
export const simpleButtonExample = createUIResource({
  uri: 'ui://appssdk-demo/button',
  content: {
    type: 'rawHtml',
    htmlString: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
          }
          h2 {
            color: #333;
            margin-bottom: 20px;
          }
          button {
            background-color: #10a37f;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          button:hover {
            background-color: #0d8c6d;
          }
          button:active {
            transform: scale(0.98);
          }
          #result {
            margin-top: 20px;
            padding: 12px;
            background: #f0f0f0;
            border-radius: 6px;
            display: none;
          }
          #result.show {
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🌤️ Weather Tool</h2>
          <p>Click the button to call the weather tool</p>
          <button onclick="handleWeatherClick()">Get Weather</button>
          <div id="result"></div>
        </div>
        
        <script>
          function handleWeatherClick() {
            const resultEl = document.getElementById('result');
            resultEl.className = 'show';
            resultEl.innerText = '⏳ Calling weather tool...';
            
            // Standard MCP-UI postMessage
            // The adapter automatically translates this to window.openai.callTool() in ChatGPT
            window.parent.postMessage({
              type: 'tool',
              payload: {
                toolName: 'getWeather',
                params: { city: 'San Francisco', units: 'celsius' }
              }
            }, '*');
          }
          
          // Listen for tool response
          window.addEventListener('message', (event) => {
            if (event.data.type === 'ui-message-response') {
              const resultEl = document.getElementById('result');
              if (event.data.payload.error) {
                resultEl.innerText = '❌ Error: ' + event.data.payload.error.message;
              } else {
                resultEl.innerText = '✅ Tool called successfully!';
              }
            }
          });
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

// Example 2: Accessing Apps SDK render data
export const renderDataExample = createUIResource({
  uri: 'ui://appssdk-demo/render-data',
  content: {
    type: 'rawHtml',
    htmlString: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            margin: 0;
            background: #f9f9f9;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h2 {
            color: #333;
            margin-top: 0;
          }
          .info-card {
            background: #f0f0f0;
            padding: 16px;
            border-radius: 6px;
            margin: 12px 0;
          }
          .info-card h3 {
            margin-top: 0;
            color: #10a37f;
            font-size: 14px;
          }
          pre {
            background: #2d2d2d;
            color: #f8f8f8;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 12px;
          }
          .loading {
            text-align: center;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>📊 Apps SDK Context</h2>
          <div id="data" class="loading">Loading render data...</div>
        </div>
        
        <script>
          // Listen for render data from Apps SDK
          window.addEventListener('message', (event) => {
            if (event.data.type === 'ui-lifecycle-iframe-render-data') {
              const { renderData } = event.data.payload;
              const dataEl = document.getElementById('data');
              
              dataEl.innerHTML = \`
                <div class="info-card">
                  <h3>🎨 Theme</h3>
                  <p>\${renderData.theme || 'Not available'}</p>
                </div>
                <div class="info-card">
                  <h3>🌍 Locale</h3>
                  <p>\${renderData.locale || 'Not available'}</p>
                </div>
                <div class="info-card">
                  <h3>📱 Display Mode</h3>
                  <p>\${renderData.displayMode || 'Not available'}</p>
                </div>
                <div class="info-card">
                  <h3>📥 Tool Input</h3>
                  <pre>\${JSON.stringify(renderData.toolInput, null, 2) || 'None'}</pre>
                </div>
                <div class="info-card">
                  <h3>📤 Tool Output</h3>
                  <pre>\${JSON.stringify(renderData.toolOutput, null, 2) || 'None'}</pre>
                </div>
              \`;
            }
          });
          
          // Request render data on load
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

// Example 3: Interactive form with multiple action types
export const interactiveFormExample = createUIResource({
  uri: 'ui://appssdk-demo/interactive-form',
  content: {
    type: 'rawHtml',
    htmlString: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
          }
          h2 {
            color: #333;
          }
          input, textarea {
            width: 100%;
            padding: 10px;
            margin: 8px 0;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            box-sizing: border-box;
          }
          .button-group {
            display: flex;
            gap: 8px;
            margin-top: 12px;
          }
          button {
            flex: 1;
            padding: 12px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
          }
          .btn-primary {
            background-color: #10a37f;
            color: white;
          }
          .btn-primary:hover {
            background-color: #0d8c6d;
          }
          .btn-secondary {
            background-color: #f0f0f0;
            color: #333;
          }
          .btn-secondary:hover {
            background-color: #e0e0e0;
          }
          .status {
            margin-top: 16px;
            padding: 12px;
            border-radius: 6px;
            display: none;
          }
          .status.show {
            display: block;
          }
          .status.success {
            background: #d4edda;
            color: #155724;
          }
          .status.error {
            background: #f8d7da;
            color: #721c24;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>💬 Interactive Demo</h2>
          <input type="text" id="titleInput" placeholder="Title">
          <textarea id="messageInput" rows="4" placeholder="Enter your message..."></textarea>
          
          <div class="button-group">
            <button class="btn-primary" onclick="sendPrompt()">Send Prompt</button>
            <button class="btn-secondary" onclick="sendNotification()">Notify</button>
            <button class="btn-secondary" onclick="sendIntent()">Send Intent</button>
          </div>
          
          <div id="status" class="status"></div>
        </div>
        
        <script>
          function showStatus(message, type = 'success') {
            const statusEl = document.getElementById('status');
            statusEl.className = 'status show ' + type;
            statusEl.innerText = message;
            setTimeout(() => {
              statusEl.className = 'status';
            }, 3000);
          }
          
          function sendPrompt() {
            const message = document.getElementById('messageInput').value;
            if (!message) {
              showStatus('Please enter a message', 'error');
              return;
            }
            
            window.parent.postMessage({
              type: 'prompt',
              payload: { prompt: message }
            }, '*');
            
            showStatus('✉️ Prompt sent!');
          }
          
          function sendNotification() {
            const title = document.getElementById('titleInput').value || 'Notification';
            const message = document.getElementById('messageInput').value || 'No message';
            
            window.parent.postMessage({
              type: 'notify',
              payload: { message: title + ': ' + message }
            }, '*');
            
            showStatus('🔔 Notification sent!');
          }
          
          function sendIntent() {
            const intent = document.getElementById('titleInput').value || 'user-action';
            const message = document.getElementById('messageInput').value;
            
            window.parent.postMessage({
              type: 'intent',
              payload: {
                intent: intent,
                params: { message: message }
              }
            }, '*');
            
            showStatus('🎯 Intent sent!');
          }
          
          // Listen for responses
          window.addEventListener('message', (event) => {
            if (event.data.type === 'ui-message-response') {
              if (event.data.payload.error) {
                showStatus('❌ Error: ' + event.data.payload.error.message, 'error');
              }
            }
          });
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
        intentHandling: 'prompt',  // Intents will be converted to prompts
        timeout: 30000
      }
    }
  }
});

// Export all examples
export const appsSdkAdapterExamples = {
  simpleButton: simpleButtonExample,
  renderData: renderDataExample,
  interactiveForm: interactiveFormExample
};

