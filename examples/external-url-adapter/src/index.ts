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
    // This will fetch the HTML from the URL, rewrite relative URLs, and inject adapter scripts
    const externalAppUI = await createUIResource({
      uri: 'ui://external-app/demo',
      encoding: 'text',
      content: {
        type: 'externalUrl',
        iframeUrl: 'https://js-dos.com/games/doom.exe.html',
      },
      adapters: {
        mcpApps: {
          enabled: true,
        },
      },
      // Add CSP metadata to allow fetching resources from js-dos.com
      metadata: {
        'ui': {
          'csp': {
            'connectDomains': ['https://js-dos.com'],
            'resourceDomains': ['https://js-dos.com'],
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
        description: 'Shows the Doom game from js-dos.com. The URL is fetched, converted to rawHtml with adapter scripts, and a base tag is added.',
        inputSchema: {},
        // This tells MCP Apps hosts where to find the UI
        _meta: {
          [RESOURCE_URI_META_KEY]: externalAppUI.resource.uri
        }
      },
      async () => {
        return {
          content: [
            { type: 'text', text: 'Showing Doom game from js-dos.com' },
          ],
        };
      }
    );

    // Example 2: Register a resource that fetches a different external URL
    const weatherAppUI = await createUIResource({
      uri: 'ui://external-app/weather',
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

    server.registerResource(
      'weather_app_ui',
      weatherAppUI.resource.uri,
      {},
      async () => ({
        contents: [weatherAppUI.resource]
      })
    );

    server.registerTool(
      'show_weather_app',
      {
        description: 'Shows a weather application from an external URL',
        inputSchema: {},
        _meta: {
          [RESOURCE_URI_META_KEY]: weatherAppUI.resource.uri
        }
      },
      async () => {
        return {
          content: [
            { type: 'text', text: 'Weather app loaded from external URL' },
          ],
        };
      }
    );

    // Example 3: Show that externalUrl without adapters still works (synchronous)
    server.registerTool(
      'show_external_url_no_adapter',
      {
        description: 'Shows an external URL without adapter (traditional iframe)',
        inputSchema: {},
      },
      async () => {
        // This is synchronous - no adapters enabled
        const resource = createUIResource({
          uri: 'ui://external-app/no-adapter',
          encoding: 'text',
          content: {
            type: 'externalUrl',
            iframeUrl: 'https://js-dos.com/games/doom.exe.html',
          },
          // No adapters - returns immediately (synchronous)
        });

        // Since no adapters are enabled, resource is synchronous (not a Promise)
        // But TypeScript sees it as UIResource | Promise<UIResource>, so we handle both
        const resolvedResource = resource instanceof Promise ? await resource : resource;

        return {
          content: [resolvedResource],
        };
      }
    );

    // Example 4: Shopify product component
    const shopifyProductUI = await createUIResource({
      uri: 'ui://external-app/shopify-product',
      encoding: 'text',
      content: {
        type: 'externalUrl',
        iframeUrl: 'https://cdn.shopify.com/storefront/product.component?store_domain=aloyoga.com&inline=true&product_handle=w54206r-washed-alosoft-high-waist-sunray-legging-cool-grey-wash&llm_description=VGhpcyBpcyBhbiBhd2Vzb21lIHByb2R1Y3QsIHdoaWNoIGZpdHMgeW91ciBuZWVkcyBleGFjdGx5LiBJdCBoYXMgZ3JlYXQgcmV2aWV3cywgbWFkZSBmcm9tIHRoZSBiZXN0IG1hdGVyaWFscywgYW5kIGlzIGd1YXJhbnRlZWQgdG8gYmUgZXhhY3RseSB3aGF0IHlvdSBuZWVkLiBBIGdyZWF0IGNob2ljZSE%3D',
      },
      adapters: {
        mcpApps: {
          enabled: true,
        },
      },
      // Add CSP metadata to allow fetching resources from Shopify CDN
      metadata: {
        'ui': {
          'csp': {
            'connectDomains': ['https://cdn.shopify.com', 'https://aloyoga.com'],
            'resourceDomains': ['https://cdn.shopify.com', 'https://aloyoga.com'],
          },
        },
      },
    });

    server.registerResource(
      'shopify_product_ui',
      shopifyProductUI.resource.uri,
      {},
      async () => ({
        contents: [shopifyProductUI.resource]
      })
    );

    server.registerTool(
      'show_shopify_product',
      {
        description: 'Shows a Shopify product component from Alo Yoga. The URL is fetched, converted to rawHtml with adapter scripts.',
        inputSchema: {},
        _meta: {
          [RESOURCE_URI_META_KEY]: shopifyProductUI.resource.uri
        }
      },
      async () => {
        return {
          content: [
            { type: 'text', text: 'Showing Shopify product component from Alo Yoga' },
          ],
        };
      }
    );

    // Example 5: Golden Axe game from RetroGames.cc
    const goldenAxeUI = await createUIResource({
      uri: 'ui://external-app/golden-axe',
      encoding: 'text',
      content: {
        type: 'externalUrl',
        iframeUrl: 'https://archive.org/details/arcade_ga2',
      },
      adapters: {
        mcpApps: {
          enabled: true,
        },
      },
      // Add CSP metadata to allow fetching resources from retrogames.cc
      metadata: {
        'ui': {
          'csp': {
            'connectDomains': ['https://www.retrogames.cc'],
            'resourceDomains': ['https://www.retrogames.cc'],
          },
        },
      },
    });

    server.registerResource(
      'golden_axe_ui',
      goldenAxeUI.resource.uri,
      {},
      async () => ({
        contents: [goldenAxeUI.resource]
      })
    );

    server.registerTool(
      'show_golden_axe',
      {
        description: 'Shows the Golden Axe game from RetroGames.cc. The URL is fetched, converted to rawHtml with adapter scripts, and a base tag is added.',
        inputSchema: {},
        _meta: {
          [RESOURCE_URI_META_KEY]: goldenAxeUI.resource.uri
        }
      },
      async () => {
        return {
          content: [
            { type: 'text', text: 'Showing Golden Axe game from RetroGames.cc' },
          ],
        };
      }
    );

    // Example 6: Prince of Persia game from ClassicReload
    const princeOfPersiaUI = await createUIResource({
      uri: 'ui://external-app/prince-of-persia',
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
      // Add CSP metadata to allow fetching resources from classicreload.com
      metadata: {
        'ui': {
          'csp': {
            'connectDomains': ['https://classicreload.com'],
            'resourceDomains': ['https://classicreload.com'],
          },
        },
      },
    });

    server.registerResource(
      'prince_of_persia_ui',
      princeOfPersiaUI.resource.uri,
      {},
      async () => ({
        contents: [princeOfPersiaUI.resource]
      })
    );

    server.registerTool(
      'show_prince_of_persia',
      {
        description: 'Shows the Prince of Persia game from ClassicReload.com. The URL is fetched, converted to rawHtml with adapter scripts, and a base tag is added.',
        inputSchema: {},
        _meta: {
          [RESOURCE_URI_META_KEY]: princeOfPersiaUI.resource.uri
        }
      },
      async () => {
        return {
          content: [
            { type: 'text', text: 'Showing Prince of Persia game from ClassicReload.com' },
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
    console.log(`  - show_external_app: Fetches Doom game from js-dos.com with MCP Apps adapter`);
    console.log(`  - show_weather_app: Fetches a W3C example page with adapter`);
    console.log(`  - show_external_url_no_adapter: Traditional iframe (no adapter)`);
    console.log(`  - show_shopify_product: Fetches Shopify product component with MCP Apps adapter`);
    console.log(`  - show_golden_axe: Fetches Golden Axe game from RetroGames.cc with MCP Apps adapter`);
    console.log(`  - show_prince_of_persia: Fetches Prince of Persia game from ClassicReload.com with MCP Apps adapter`);
    console.log(`\nConnect your MCP Apps client to http://localhost:${port}/mcp`);
});

