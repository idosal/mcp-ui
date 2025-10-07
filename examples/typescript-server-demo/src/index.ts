import express from 'express';
import { z } from "zod";
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createUIResource } from '@mcp-ui/server';
import { randomUUID } from 'crypto';
import { generateFlightResultsHTML } from './utils/htmlResource.js';
import { getFlightRequestSchemaAsZod, getFlightResponseSchemaAsZod } from './utils/schema.js';
import { getAvailableFlights } from './utils/data.js';

const app = express();
const port = 3000;

app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));
app.use(express.json());

// Map to store transports by session ID, as shown in the documentation.
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication.
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // A session already exists; reuse the existing transport.
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // This is a new initialization request. Create a new transport.
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports[sid] = transport;
        console.log(`MCP Session initialized: ${sid}`);
      },
    });

    // Clean up the transport from our map when the session closes.
    transport.onclose = () => {
      if (transport.sessionId) {
        console.log(`MCP Session closed: ${transport.sessionId}`);
        delete transports[transport.sessionId];
      }
    };

    // Create a new server instance for this specific session.
    const server = new McpServer({
      name: "typescript-server-demo",
      version: "1.0.0"
    });

    // Register our tools on the new server instance.
    server.registerTool('getFlightResultsAsStructuredContent', {
      title: 'Search Flights',
      description: 'Search for available flights between two cities on a specific date. Returns flight details including prices and times.',
      inputSchema: getFlightRequestSchemaAsZod(),
      outputSchema: getFlightResponseSchemaAsZod(),
    }, async ({ originCity, destinationCity, dateOfTravel, filters }) => {
      console.log(`Flight search - Origin: ${originCity}, Destination: ${destinationCity}, Date: ${dateOfTravel}, Filters: ${JSON.stringify(filters)}`);
      const flightData = getAvailableFlights(originCity, destinationCity, filters.price, filters.discountPercentage);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(flightData),
        }],
        structuredContent: flightData,
      };
    });

    server.registerTool('getFlightResultsAsRawHtml', {
      title: 'Search Flights',
      description: 'Search for available flights between two cities on a specific date. Returns flight details including prices and times.  Returns the results as raw HTML.',
      inputSchema: getFlightRequestSchemaAsZod(),
    }, async ({ originCity, destinationCity, dateOfTravel, filters }) => {
      console.log(`Flight search - Origin: ${originCity}, Destination: ${destinationCity}, Date: ${dateOfTravel}, Filters: ${JSON.stringify(filters)}`);
      const flightData = getAvailableFlights(originCity, destinationCity, filters.price, filters.discountPercentage);
      const flightDataHtml = generateFlightResultsHTML(flightData, originCity, destinationCity, dateOfTravel);
      const uiResource = createUIResource({
        uri: 'ui://raw-html-demo',
        content: { type: 'rawHtml', htmlString: flightDataHtml },
        encoding: 'text',
      });
      return {
        content: [uiResource]
      };
    });

    server.registerTool('getFlightsAsExternalUrl', {
      title: 'Search Flights',
      description: 'Search for available flights between two cities on a specific date. Returns flight details including prices and times.  Returns the results as a Lightning Out component',
      inputSchema: getFlightRequestSchemaAsZod()
    }, async () => {
      // Create the UI resource to be returned to the client
      // This is the only MCP-UI specific code in this example
      const uiResource = createUIResource({
        uri: 'ui://external-url-demo',
        content: { type: 'externalUrl', iframeUrl: 'https://example.com' },
        encoding: 'text',
      });

      return {
        content: [uiResource],
      };
    });

    server.registerTool('getFlightResultsAsUem', {
      title: 'Search Flights',
      description: 'Search for available flights between two cities on a specific date. Returns flight details including prices and times.  Returns the results as UEM that is translated client-side.',
      inputSchema: getFlightRequestSchemaAsZod()
    }, async ({ originCity, destinationCity, dateOfTravel, filters }) => {
      console.log(`Flight search - Origin: ${originCity}, Destination: ${destinationCity}, Date: ${dateOfTravel}, Filters: ${JSON.stringify(filters)}`);
      const flightData = getAvailableFlights(originCity, destinationCity, filters.price, filters.discountPercentage);
      const flightDataHtml = generateFlightResultsHTML(flightData, originCity, destinationCity, dateOfTravel, dateOfTravel);
      // TODO: Create a new UEM UIResource type
      const uiResource = createUIResource({
        uri: 'ui://uem-demo',
        content: { type: 'rawHtml', htmlString: flightDataHtml },
        encoding: 'text',
      });
      return {
        content: [uiResource]
      };
    });

    server.registerTool('showRemoteDom', {
      title: 'Show Remote DOM',
      description: 'Shows todays weather forecast using remote DOM script.',
      inputSchema: {},
    }, async () => {
      const remoteDomScript = `
        const p = document.createElement('ui-text');
        p.textContent = 'This is a remote DOM element from the server.';
        root.appendChild(p);
      `;
      const uiResource = createUIResource({
        uri: 'ui://remote-dom-demo',
        content: {
          type: 'remoteDom',
          script: remoteDomScript,
          framework: 'react',
        },
        encoding: 'text',
      });

      return {
        content: [uiResource],
      };
    });

    // Connect the server instance to the transport for this session.
    await server.connect(transport);
  } else {
    return res.status(400).json({
      error: { message: 'Bad Request: No valid session ID provided' },
    });
  }

  // Handle the client's request using the session's transport.
  await transport.handleRequest(req, res, req.body);
});

// A separate, reusable handler for GET and DELETE requests.
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  console.log('sessionId', sessionId);
  if (!sessionId || !transports[sessionId]) {
    return res.status(404).send('Session not found');
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// GET handles the long-lived stream for server-to-client messages.
app.get('/mcp', handleSessionRequest);

// DELETE handles explicit session termination from the client.
app.delete('/mcp', handleSessionRequest);

app.listen(port, () => {
  console.log(`TypeScript MCP server listening at http://localhost:${port}`);
});