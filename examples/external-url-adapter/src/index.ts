import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createUIResource, RESOURCE_URI_META_KEY } from '@mcp-ui/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const app = express();
const port = 3001;

app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['*'],
}));
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // A session already exists; reuse the existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // This is a new initialization request. Create a new transport
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports[sid] = transport;
        console.log(`MCP Session initialized: ${sid}`);
      },
    });

    // Clean up the transport from our map when the session closes
    transport.onclose = () => {
      if (transport.sessionId) {
        console.log(`MCP Session closed: ${transport.sessionId}`);
        delete transports[transport.sessionId];
      }
    };
    
    // Create a new server instance for this specific session
    const server = new McpServer({
      name: "external-url-adapter-demo",
      version: "1.0.0"
    });

    // Example 1: Fetch external URL with MCP Apps adapter
    // This will fetch the HTML from the URL and inject adapter scripts
    const externalAppUI = await createUIResource({
      uri: 'ui://external-app/demo',
      encoding: 'text',
      content: {
        type: 'externalUrl',
        iframeUrl: 'https://www.w3.org/Style/Examples/007/center.en.html',
      },
      adapters: {
        mcpApps: {
          enabled: true,
        },
      },
      // Add CSP metadata to allow fetching resources from w3.org
      metadata: {
        'ui': {
          'csp': {
            'connectDomains': ['https://www.w3.org'],
            'resourceDomains': ['https://www.w3.org'],
          },
        },
      },
    });

    // Register the UI resource so the host can fetch it
    server.registerResource(
      'external_app_ui',
      externalAppUI.resource.uri,
      {},
      async () => ({
        contents: [externalAppUI.resource]
      })
    );

    // Register a tool that uses the external URL resource
    server.registerTool(
      'show_external_app',
      {
        description: 'Shows a W3C example page. The URL is fetched, converted to rawHtml with adapter scripts, and a base tag is added.',
        inputSchema: {},
        // This tells MCP Apps hosts where to find the UI
        _meta: {
          [RESOURCE_URI_META_KEY]: externalAppUI.resource.uri
        }
      },
      async () => {
        return {
          content: [
            { type: 'text', text: 'Showing W3C example page' },
          ],
        };
      }
    );

    // Example 2: Pac-Man game from Archive.org
    const pacmanUI = await createUIResource({
      uri: 'ui://external-app/pacman',
      encoding: 'text',
      content: {
        type: 'externalUrl',
        iframeUrl: 'https://archive.org/details/arcade_20pacgal',
      },
      adapters: {
        mcpApps: {
          enabled: true,
        },
      },
      // Add CSP metadata to allow fetching resources from archive.org
      metadata: {
        'ui': {
          'csp': {
            'connectDomains': ['https://archive.org'],
            'resourceDomains': ['https://archive.org'],
          },
        },
      },
    });

    server.registerResource(
      'pacman_ui',
      pacmanUI.resource.uri,
      {},
      async () => ({
        contents: [pacmanUI.resource]
      })
    );

    server.registerTool(
      'show_pacman',
      {
        description: 'Shows the Pac-Man game from Archive.org. The URL is fetched, converted to rawHtml with adapter scripts, and a base tag is added.',
        inputSchema: {},
        _meta: {
          [RESOURCE_URI_META_KEY]: pacmanUI.resource.uri
        }
      },
      async () => {
        return {
          content: [
            { type: 'text', text: 'Showing Pac-Man game from Archive.org' },
          ],
        };
      }
    );

    // Example 3: Mortal Kombat game from Archive.org
    const mortalKombatUI = await createUIResource({
      uri: 'ui://external-app/mortal-kombat',
      encoding: 'text',
      content: {
        type: 'externalUrl',
        iframeUrl: 'https://archive.org/details/arcade_mk3mdb',
      },
      adapters: {
        mcpApps: {
          enabled: true,
        },
      },
      // Add CSP metadata to allow fetching resources from archive.org
      metadata: {
        'ui': {
          'csp': {
            'connectDomains': ['https://archive.org'],
            'resourceDomains': ['https://archive.org'],
          },
        },
      },
    });

    server.registerResource(
      'mortal_kombat_ui',
      mortalKombatUI.resource.uri,
      {},
      async () => ({
        contents: [mortalKombatUI.resource]
      })
    );

    server.registerTool(
      'show_mortal_kombat',
      {
        description: 'Shows the Mortal Kombat game from Archive.org. The URL is fetched, converted to rawHtml with adapter scripts, and a base tag is added.',
        inputSchema: {},
        _meta: {
          [RESOURCE_URI_META_KEY]: mortalKombatUI.resource.uri
        }
      },
      async () => {
        return {
          content: [
            { type: 'text', text: 'Showing Mortal Kombat game from Archive.org' },
          ],
        };
      }
    );

    // Example 4: Sonic the Hedgehog 2 from Archive.org
    const sonicUI = await createUIResource({
      uri: 'ui://external-app/sonic',
      encoding: 'text',
      content: {
        type: 'externalUrl',
        iframeUrl: 'https://archive.org/details/Sonic_The_Hedgehog_2_World_Rev_A.md',
      },
      adapters: {
        mcpApps: {
          enabled: true,
        },
      },
      // Add CSP metadata to allow fetching resources from archive.org
      metadata: {
        'ui': {
          'csp': {
            'connectDomains': ['https://archive.org'],
            'resourceDomains': ['https://archive.org'],
          },
        },
      },
    });

    server.registerResource(
      'sonic_ui',
      sonicUI.resource.uri,
      {},
      async () => ({
        contents: [sonicUI.resource]
      })
    );

    server.registerTool(
      'show_sonic',
      {
        description: 'Shows the Sonic the Hedgehog 2 game from Archive.org. The URL is fetched, converted to rawHtml with adapter scripts, and a base tag is added.',
        inputSchema: {},
        _meta: {
          [RESOURCE_URI_META_KEY]: sonicUI.resource.uri
        }
      },
      async () => {
        return {
          content: [
            { type: 'text', text: 'Showing Sonic the Hedgehog 2 game from Archive.org' },
          ],
        };
      }
    );
  
    // Connect the server instance to the transport for this session
    await server.connect(transport);
  } else {
    return res.status(400).json({
      error: { message: 'Bad Request: No valid session ID provided' },
    });
  }

  // Handle the client's request using the session's transport
  await transport.handleRequest(req, res, req.body);
});

// A separate, reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    return res.status(404).send('Session not found');
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// GET handles the long-lived stream for server-to-client messages
app.get('/mcp', handleSessionRequest);

// DELETE handles explicit session termination from the client
app.delete('/mcp', handleSessionRequest);

app.listen(port, () => {
  console.log(`External URL Adapter Demo Server running at http://localhost:${port}`);
  console.log(`\nThis demo shows how externalUrl resources are automatically fetched`);
  console.log(`and converted to rawHtml when adapters are enabled.`);
  console.log(`\nAvailable tools:`);
  console.log(`  - show_external_app: Fetches W3C example page with MCP Apps adapter`);
  console.log(`  - show_pacman: Fetches Pac-Man game from Archive.org with MCP Apps adapter`);
  console.log(`  - show_mortal_kombat: Fetches Mortal Kombat game from Archive.org with MCP Apps adapter`);
  console.log(`  - show_sonic: Fetches Sonic the Hedgehog 2 from Archive.org with MCP Apps adapter`);
  console.log(`\nConnect your MCP Apps client to http://localhost:${port}/mcp`);
});

