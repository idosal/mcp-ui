import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createUIResource } from '@mcp-ui/server';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

import MongoDBClient from './mongodb-client.js';
import { DataAggregator } from './utils/data-aggregator.js';
import { ReportGenerator } from './utils/report-generator.js';
import { ChartUIGenerator } from './ui/charts.js';
import { TableUIGenerator } from './ui/tables.js';

dotenv.config();

const app = express();
const port = process.env.MCP_SERVER_PORT || 3001;

app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));
app.use(express.json());

// Initialize MongoDB connection
const mongoClient = MongoDBClient.getInstance();
await mongoClient.connect();

const db = mongoClient.getDb();
const dataAggregator = new DataAggregator(db);

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid) => {
        transports[sid] = transport;
        console.log(`✅ MCP Session initialized: ${sid}`);
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        console.log(`✅ MCP Session closed: ${transport.sessionId}`);
        delete transports[transport.sessionId];
      }
    };

    const server = new McpServer({
      name: "mongodb-real-estate-crm",
      version: "1.0.0"
    });

    // ============================================
    // DASHBOARD & OVERVIEW TOOLS
    // ============================================

    server.registerTool('dashboard', {
      title: 'Executive Dashboard',
      description: 'Display comprehensive executive dashboard with key metrics, charts, and recent activity',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Start date for metrics (ISO format, optional)',
          },
          endDate: {
            type: 'string',
            description: 'End date for metrics (ISO format, optional)',
          }
        }
      },
    }, async (params) => {
      const filters: any = {};
      if (params.startDate) filters.startDate = new Date(params.startDate as string);
      if (params.endDate) filters.endDate = new Date(params.endDate as string);

      const [salesMetrics, pipelineMetrics, inventoryMetrics, marketingMetrics, salesTrend, leadSources] =
        await Promise.all([
          dataAggregator.getSalesMetrics(filters),
          dataAggregator.getPipelineMetrics(filters),
          dataAggregator.getInventoryMetrics(filters),
          dataAggregator.getMarketingMetrics(filters),
          dataAggregator.getSalesTrend(filters),
          dataAggregator.getLeadSourceDistribution(filters)
        ]);

      const charts = [
        {
          type: 'line' as const,
          title: 'Sales Revenue Trend',
          data: salesTrend,
          options: { showGrid: true }
        },
        {
          type: 'bar' as const,
          title: 'Sales Pipeline',
          data: [
            { label: 'New', value: pipelineMetrics.new },
            { label: 'Contacted', value: pipelineMetrics.contacted },
            { label: 'Qualified', value: pipelineMetrics.qualified },
            { label: 'Proposal', value: pipelineMetrics.proposal },
            { label: 'Negotiation', value: pipelineMetrics.negotiation },
            { label: 'Won', value: pipelineMetrics.won }
          ]
        },
        {
          type: 'doughnut' as const,
          title: 'Inventory Status',
          data: [
            { label: 'Available', value: inventoryMetrics.available, color: '#10b981' },
            { label: 'Reserved', value: inventoryMetrics.reserved, color: '#f59e0b' },
            { label: 'Sold', value: inventoryMetrics.sold, color: '#667eea' },
            { label: 'Under Construction', value: inventoryMetrics.underConstruction, color: '#8b5cf6' }
          ]
        },
        {
          type: 'pie' as const,
          title: 'Lead Sources',
          data: leadSources.map(ls => ({ label: ls.source, value: ls.count }))
        }
      ];

      const htmlContent = ChartUIGenerator.generateDashboardHTML(
        charts,
        'Real Estate CRM Dashboard'
      );

      const uiResource = createUIResource({
        uri: 'ui://dashboard',
        content: { type: 'rawHtml', htmlString: htmlContent },
        encoding: 'text',
      });

      return {
        content: [
          uiResource,
          {
            type: 'text',
            text: `## Executive Summary\n\n` +
              `**Sales Performance**\n` +
              `- Total Revenue: $${salesMetrics.totalRevenue.toLocaleString()}\n` +
              `- Total Sales: ${salesMetrics.totalSales}\n` +
              `- Average Sale Price: $${Math.round(salesMetrics.averageSalePrice).toLocaleString()}\n` +
              `- Conversion Rate: ${salesMetrics.conversionRate.toFixed(2)}%\n\n` +
              `**Pipeline Status**\n` +
              `- Total Leads: ${pipelineMetrics.totalLeads}\n` +
              `- Pipeline Conversion: ${pipelineMetrics.conversionRate.toFixed(2)}%\n\n` +
              `**Inventory**\n` +
              `- Total Properties: ${inventoryMetrics.totalProperties}\n` +
              `- Available: ${inventoryMetrics.available}\n` +
              `- Average Price: $${Math.round(inventoryMetrics.averagePrice).toLocaleString()}\n\n` +
              `**Marketing**\n` +
              `- Active Campaigns: ${marketingMetrics.totalCampaigns}\n` +
              `- Total Leads: ${marketingMetrics.totalLeads}\n` +
              `- Avg Cost per Lead: $${marketingMetrics.averageCostPerLead.toFixed(2)}`
          }
        ],
      };
    });

    // ============================================
    // SALES ANALYTICS TOOLS
    // ============================================

    server.registerTool('salesReport', {
      title: 'Sales Performance Report',
      description: 'Generate detailed sales performance report with charts and metrics',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          agentId: { type: 'string', description: 'Filter by specific agent ID (optional)' },
          format: {
            type: 'string',
            enum: ['chart', 'table', 'both'],
            description: 'Report format'
          }
        },
        required: ['format']
      },
    }, async (params) => {
      const filters: any = {};
      if (params.startDate) filters.startDate = new Date(params.startDate as string);
      if (params.endDate) filters.endDate = new Date(params.endDate as string);
      if (params.agentId) filters.agentId = params.agentId as string;

      const [salesMetrics, salesTrend, agentPerformance] = await Promise.all([
        dataAggregator.getSalesMetrics(filters),
        dataAggregator.getSalesTrend(filters),
        dataAggregator.getAgentPerformance(filters)
      ]);

      const format = params.format as string;
      const contents: any[] = [];

      if (format === 'chart' || format === 'both') {
        const chartHtml = ChartUIGenerator.generateChartHTML({
          type: 'line',
          title: 'Sales Revenue Trend',
          data: salesTrend,
          options: { showGrid: true, showLegend: true }
        });

        contents.push(createUIResource({
          uri: 'ui://sales-trend-chart',
          content: { type: 'rawHtml', htmlString: chartHtml },
          encoding: 'text',
        }));
      }

      if (format === 'table' || format === 'both') {
        const tableHtml = TableUIGenerator.generateTableHTML(
          agentPerformance,
          [
            { key: 'agentName', label: 'Agent' },
            { key: 'totalSales', label: 'Sales' },
            { key: 'totalRevenue', label: 'Revenue', format: (v: number) => `$${v.toLocaleString()}` },
            { key: 'activeLeads', label: 'Active Leads' },
            { key: 'conversionRate', label: 'Conversion %', format: (v: number) => `${v.toFixed(2)}%` },
            { key: 'averageClosingTime', label: 'Avg Close (days)' }
          ],
          'Sales Agent Performance',
          { sortable: true, filterable: true, exportable: true }
        );

        contents.push(createUIResource({
          uri: 'ui://agent-performance-table',
          content: { type: 'rawHtml', htmlString: tableHtml },
          encoding: 'text',
        }));
      }

      contents.push({
        type: 'text',
        text: `## Sales Performance Report\n\n` +
          `**Period:** ${filters.startDate?.toLocaleDateString() || 'All Time'} - ${filters.endDate?.toLocaleDateString() || 'Present'}\n\n` +
          `**Key Metrics:**\n` +
          `- Total Revenue: $${salesMetrics.totalRevenue.toLocaleString()}\n` +
          `- Total Sales: ${salesMetrics.totalSales}\n` +
          `- Average Sale Price: $${Math.round(salesMetrics.averageSalePrice).toLocaleString()}\n` +
          `- Conversion Rate: ${salesMetrics.conversionRate.toFixed(2)}%\n` +
          `- Average Closing Time: ${salesMetrics.averageClosingTime} days\n\n` +
          `**Top Performers:**\n` +
          agentPerformance.slice(0, 5).map((agent, i) =>
            `${i + 1}. ${agent.agentName} - $${agent.totalRevenue.toLocaleString()} (${agent.totalSales} sales)`
          ).join('\n')
      });

      return { content: contents };
    });

    // ============================================
    // PIPELINE & LEAD ANALYTICS
    // ============================================

    server.registerTool('pipelineAnalysis', {
      title: 'Sales Pipeline Analysis',
      description: 'Analyze sales pipeline with funnel visualization and conversion metrics',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          agentId: { type: 'string' }
        }
      },
    }, async (params) => {
      const filters: any = {};
      if (params.startDate) filters.startDate = new Date(params.startDate as string);
      if (params.endDate) filters.endDate = new Date(params.endDate as string);
      if (params.agentId) filters.agentId = params.agentId as string;

      const pipelineMetrics = await dataAggregator.getPipelineMetrics(filters);

      const chartHtml = ChartUIGenerator.generateChartHTML({
        type: 'bar',
        title: 'Sales Pipeline Funnel',
        data: [
          { label: 'New', value: pipelineMetrics.new },
          { label: 'Contacted', value: pipelineMetrics.contacted },
          { label: 'Qualified', value: pipelineMetrics.qualified },
          { label: 'Proposal', value: pipelineMetrics.proposal },
          { label: 'Negotiation', value: pipelineMetrics.negotiation },
          { label: 'Won', value: pipelineMetrics.won }
        ],
        options: { showGrid: true }
      });

      const uiResource = createUIResource({
        uri: 'ui://pipeline-funnel',
        content: { type: 'rawHtml', htmlString: chartHtml },
        encoding: 'text',
      });

      return {
        content: [
          uiResource,
          {
            type: 'text',
            text: `## Pipeline Analysis\n\n` +
              `**Total Leads:** ${pipelineMetrics.totalLeads}\n\n` +
              `**Stage Breakdown:**\n` +
              `- New: ${pipelineMetrics.new} (${((pipelineMetrics.new / pipelineMetrics.totalLeads) * 100).toFixed(1)}%)\n` +
              `- Contacted: ${pipelineMetrics.contacted} (${((pipelineMetrics.contacted / pipelineMetrics.totalLeads) * 100).toFixed(1)}%)\n` +
              `- Qualified: ${pipelineMetrics.qualified} (${((pipelineMetrics.qualified / pipelineMetrics.totalLeads) * 100).toFixed(1)}%)\n` +
              `- Proposal: ${pipelineMetrics.proposal} (${((pipelineMetrics.proposal / pipelineMetrics.totalLeads) * 100).toFixed(1)}%)\n` +
              `- Negotiation: ${pipelineMetrics.negotiation} (${((pipelineMetrics.negotiation / pipelineMetrics.totalLeads) * 100).toFixed(1)}%)\n` +
              `- Won: ${pipelineMetrics.won} (${((pipelineMetrics.won / pipelineMetrics.totalLeads) * 100).toFixed(1)}%)\n` +
              `- Lost: ${pipelineMetrics.lost}\n\n` +
              `**Overall Conversion Rate:** ${pipelineMetrics.conversionRate.toFixed(2)}%`
          }
        ],
      };
    });

    server.registerTool('leadSourceAnalysis', {
      title: 'Lead Source Analysis',
      description: 'Analyze lead generation by source with conversion metrics',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string' },
          endDate: { type: 'string' }
        }
      },
    }, async (params) => {
      const filters: any = {};
      if (params.startDate) filters.startDate = new Date(params.startDate as string);
      if (params.endDate) filters.endDate = new Date(params.endDate as string);

      const leadSources = await dataAggregator.getLeadSourceDistribution(filters);

      const chartHtml = ChartUIGenerator.generateChartHTML({
        type: 'pie',
        title: 'Lead Sources Distribution',
        data: leadSources.map(ls => ({
          label: ls.source.replace('_', ' ').toUpperCase(),
          value: ls.count
        })),
        options: { showLegend: true }
      });

      const uiResource = createUIResource({
        uri: 'ui://lead-sources',
        content: { type: 'rawHtml', htmlString: chartHtml },
        encoding: 'text',
      });

      return {
        content: [
          uiResource,
          {
            type: 'text',
            text: `## Lead Source Analysis\n\n` +
              leadSources.map((ls, i) => {
                const percent = (ls.count / leadSources.reduce((sum, l) => sum + l.count, 0)) * 100;
                return `${i + 1}. **${ls.source.replace('_', ' ').toUpperCase()}**: ${ls.count} leads (${percent.toFixed(1)}%)`;
              }).join('\n')
          }
        ],
      };
    });

    // ============================================
    // INVENTORY MANAGEMENT TOOLS
    // ============================================

    server.registerTool('inventoryReport', {
      title: 'Inventory Status Report',
      description: 'Display current inventory status with property listings and analytics',
      inputSchema: {
        type: 'object',
        properties: {
          community: { type: 'string', description: 'Filter by community (optional)' },
          status: {
            type: 'string',
            enum: ['available', 'reserved', 'sold', 'under_construction'],
            description: 'Filter by status (optional)'
          }
        }
      },
    }, async (params) => {
      const filters: any = {};
      if (params.community) filters.community = params.community as string;

      const inventoryMetrics = await dataAggregator.getInventoryMetrics(filters);

      // Get properties list
      const matchStage: any = {};
      if (params.community) matchStage.community = params.community;
      if (params.status) matchStage.status = params.status;

      const properties = await db.collection('properties')
        .find(matchStage)
        .limit(100)
        .toArray();

      const tableData = properties.map(p => ({
        propertyId: p.propertyId,
        address: p.address,
        community: p.community,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        sqft: p.sqft,
        price: p.price,
        status: p.status
      }));

      const tableHtml = TableUIGenerator.generateTableHTML(
        tableData,
        [
          { key: 'propertyId', label: 'ID' },
          { key: 'address', label: 'Address' },
          { key: 'community', label: 'Community' },
          { key: 'bedrooms', label: 'Beds' },
          { key: 'bathrooms', label: 'Baths' },
          { key: 'sqft', label: 'Sq Ft' },
          { key: 'price', label: 'Price', format: (v: number) => `$${v.toLocaleString()}` },
          { key: 'status', label: 'Status' }
        ],
        'Property Inventory',
        { sortable: true, filterable: true, exportable: true, rowsPerPage: 25 }
      );

      const chartHtml = ChartUIGenerator.generateChartHTML({
        type: 'doughnut',
        title: 'Inventory by Status',
        data: [
          { label: 'Available', value: inventoryMetrics.available, color: '#10b981' },
          { label: 'Reserved', value: inventoryMetrics.reserved, color: '#f59e0b' },
          { label: 'Sold', value: inventoryMetrics.sold, color: '#667eea' },
          { label: 'Under Construction', value: inventoryMetrics.underConstruction, color: '#8b5cf6' }
        ]
      });

      return {
        content: [
          createUIResource({
            uri: 'ui://inventory-chart',
            content: { type: 'rawHtml', htmlString: chartHtml },
            encoding: 'text',
          }),
          createUIResource({
            uri: 'ui://inventory-table',
            content: { type: 'rawHtml', htmlString: tableHtml },
            encoding: 'text',
          }),
          {
            type: 'text',
            text: `## Inventory Report\n\n` +
              `**Total Properties:** ${inventoryMetrics.totalProperties}\n` +
              `- Available: ${inventoryMetrics.available}\n` +
              `- Reserved: ${inventoryMetrics.reserved}\n` +
              `- Sold: ${inventoryMetrics.sold}\n` +
              `- Under Construction: ${inventoryMetrics.underConstruction}\n\n` +
              `**Pricing:**\n` +
              `- Average Price: $${Math.round(inventoryMetrics.averagePrice).toLocaleString()}\n` +
              `- Average Days on Market: ${inventoryMetrics.averageDaysOnMarket} days`
          }
        ],
      };
    });

    // ============================================
    // MARKETING ANALYTICS TOOLS
    // ============================================

    server.registerTool('marketingROI', {
      title: 'Marketing ROI Analysis',
      description: 'Analyze marketing campaign performance and ROI',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          type: {
            type: 'string',
            enum: ['digital', 'print', 'billboard', 'radio', 'tv', 'social_media']
          }
        }
      },
    }, async (params) => {
      const matchStage: any = {};
      if (params.startDate) matchStage.startDate = { $gte: new Date(params.startDate as string) };
      if (params.endDate) matchStage.endDate = { $lte: new Date(params.endDate as string) };
      if (params.type) matchStage.type = params.type;

      const campaigns = await db.collection('marketingCampaigns')
        .find(matchStage)
        .toArray();

      const tableData = campaigns.map(c => ({
        name: c.name,
        type: c.type,
        channel: c.channel,
        budget: c.budget,
        spent: c.spent,
        leads: c.leads,
        conversions: c.conversions,
        costPerLead: c.leads > 0 ? c.spent / c.leads : 0,
        roi: c.spent > 0 ? ((c.conversions - c.spent) / c.spent) * 100 : 0,
        status: c.status
      }));

      const tableHtml = TableUIGenerator.generateTableHTML(
        tableData,
        [
          { key: 'name', label: 'Campaign' },
          { key: 'type', label: 'Type' },
          { key: 'channel', label: 'Channel' },
          { key: 'budget', label: 'Budget', format: (v: number) => `$${v.toLocaleString()}` },
          { key: 'spent', label: 'Spent', format: (v: number) => `$${v.toLocaleString()}` },
          { key: 'leads', label: 'Leads' },
          { key: 'conversions', label: 'Conversions' },
          { key: 'costPerLead', label: 'Cost/Lead', format: (v: number) => `$${v.toFixed(2)}` },
          { key: 'roi', label: 'ROI %', format: (v: number) => `${v.toFixed(2)}%` },
          { key: 'status', label: 'Status' }
        ],
        'Marketing Campaigns',
        { sortable: true, filterable: true, exportable: true }
      );

      const chartData = tableData
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 10)
        .map(c => ({ label: c.name, value: c.roi }));

      const chartHtml = ChartUIGenerator.generateChartHTML({
        type: 'bar',
        title: 'Campaign ROI Comparison (Top 10)',
        data: chartData,
        options: { showGrid: true }
      });

      return {
        content: [
          createUIResource({
            uri: 'ui://marketing-roi-chart',
            content: { type: 'rawHtml', htmlString: chartHtml },
            encoding: 'text',
          }),
          createUIResource({
            uri: 'ui://marketing-campaigns-table',
            content: { type: 'rawHtml', htmlString: tableHtml },
            encoding: 'text',
          }),
          {
            type: 'text',
            text: `## Marketing Campaign Analysis\n\n` +
              `**Total Campaigns:** ${campaigns.length}\n` +
              `**Total Budget:** $${campaigns.reduce((sum, c) => sum + c.budget, 0).toLocaleString()}\n` +
              `**Total Spent:** $${campaigns.reduce((sum, c) => sum + c.spent, 0).toLocaleString()}\n` +
              `**Total Leads:** ${campaigns.reduce((sum, c) => sum + c.leads, 0)}\n` +
              `**Total Conversions:** ${campaigns.reduce((sum, c) => sum + c.conversions, 0)}`
          }
        ],
      };
    });

    // ============================================
    // EXPORT TOOLS
    // ============================================

    server.registerTool('exportReport', {
      title: 'Export Report',
      description: 'Export data or reports to CSV, PDF, or JSON format',
      inputSchema: {
        type: 'object',
        properties: {
          reportType: {
            type: 'string',
            enum: ['executive-summary', 'agent-performance', 'properties', 'leads', 'contracts'],
            description: 'Type of report to export'
          },
          format: {
            type: 'string',
            enum: ['csv', 'pdf', 'json'],
            description: 'Export format'
          },
          startDate: { type: 'string' },
          endDate: { type: 'string' }
        },
        required: ['reportType', 'format']
      },
    }, async (params) => {
      const reportType = params.reportType as string;
      const format = params.format as 'csv' | 'pdf' | 'json';

      const filters: any = {};
      if (params.startDate) filters.startDate = new Date(params.startDate as string);
      if (params.endDate) filters.endDate = new Date(params.endDate as string);

      let exportData: any;
      let fileName: string;

      switch (reportType) {
        case 'executive-summary':
          const [salesMetrics, pipelineMetrics, inventoryMetrics, marketingMetrics, agentPerformance] =
            await Promise.all([
              dataAggregator.getSalesMetrics(filters),
              dataAggregator.getPipelineMetrics(filters),
              dataAggregator.getInventoryMetrics(filters),
              dataAggregator.getMarketingMetrics(filters),
              dataAggregator.getAgentPerformance(filters)
            ]);

          exportData = {
            salesMetrics,
            pipelineMetrics,
            inventoryMetrics,
            marketingMetrics,
            agentPerformance,
            reportDate: new Date()
          };
          fileName = 'executive-summary';
          break;

        case 'agent-performance':
          const performance = await dataAggregator.getAgentPerformance(filters);
          exportData = { agentPerformance: performance, reportDate: new Date() };
          fileName = 'agent-performance';
          break;

        case 'properties':
          const properties = await db.collection('properties').find({}).toArray();
          exportData = properties;
          fileName = 'properties';
          break;

        case 'leads':
          const leads = await db.collection('leads').find({}).toArray();
          exportData = leads;
          fileName = 'leads';
          break;

        case 'contracts':
          const contracts = await db.collection('contracts').find({}).toArray();
          exportData = contracts;
          fileName = 'contracts';
          break;

        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      const result = await ReportGenerator.formatForExport(exportData, format, reportType);

      // For PDF, convert to base64
      if (format === 'pdf') {
        const base64 = Buffer.from(result as Uint8Array).toString('base64');
        return {
          content: [
            {
              type: 'text',
              text: `Report exported successfully as PDF.\n\n` +
                `**File:** ${fileName}.pdf\n` +
                `**Format:** PDF\n` +
                `**Size:** ${(base64.length / 1024).toFixed(2)} KB\n\n` +
                `Base64 data available in response.`
            },
            {
              type: 'resource',
              resource: {
                uri: `export://${fileName}.pdf`,
                mimeType: 'application/pdf',
                blob: base64
              }
            }
          ]
        };
      }

      // For CSV and JSON, return as text
      return {
        content: [
          {
            type: 'text',
            text: `Report exported successfully.\n\n` +
              `**File:** ${fileName}.${format}\n` +
              `**Format:** ${format.toUpperCase()}\n` +
              `**Size:** ${(result.length / 1024).toFixed(2)} KB\n\n` +
              `\`\`\`${format}\n${result}\n\`\`\``
          }
        ]
      };
    });

    await server.connect(transport);
  } else {
    return res.status(400).json({
      error: { message: 'Bad Request: No valid session ID provided' },
    });
  }

  await transport.handleRequest(req, res, req.body);
});

// Handle GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    return res.status(404).send('Session not found');
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);
app.delete('/mcp', handleSessionRequest);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mongodb: mongoClient.isConnected(),
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoClient.disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏡 MongoDB Real Estate CRM - MCP Server                    ║
║                                                               ║
║   Server: http://localhost:${port}                             ║
║   Endpoint: http://localhost:${port}/mcp                       ║
║   Health: http://localhost:${port}/health                      ║
║                                                               ║
║   MongoDB: ${mongoClient.isConnected() ? '✅ Connected' : '❌ Disconnected'}                                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
