// main.js

// This is the correct way to import and register the Web Component.
// Your build tool (like Vite) will resolve this path to the correct file
// in `node_modules/@mcp-ui/client/`.
import '@mcp-ui/client/ui-resource-renderer.wc.js';

// --- Example of how to interact with the component ---

// This object would typically come from your MCP response
const mcpResource = {
  resource: {
    uri: 'ui://user-form/1',
    mimeType: 'text/uri-list',
    text: 'https://remote-mcp-server-authless.idosalomon.workers.dev/task',
  },
};

// Wait for the component to be defined and ready
window.addEventListener('DOMContentLoaded', () => {
  const renderer = document.getElementById('resource-renderer');

  if (renderer) {
    // Set the resource property
    renderer.setAttribute('resource', JSON.stringify(mcpResource.resource));

    // Listen for events
    renderer.addEventListener('onUIAction', (event) => {
      console.log('User action:', event.detail);
    });
  }
});
