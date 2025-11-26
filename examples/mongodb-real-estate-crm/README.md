# MongoDB Real Estate CRM - MCP App

A comprehensive Model Context Protocol (MCP) application for real estate home sales management that leverages MongoDB MCP Server for natural language querying, analytics, and interactive reporting.

## 🏡 Overview

This application provides real estate management teams with powerful tools to:
- Query sales and marketing data using natural language
- Track pipeline, inventory, contracts, and deposits
- Monitor sales team activity and performance
- Analyze advertising effectiveness
- Generate interactive reports with charts, graphs, and tables
- Export data to CSV and PDF formats

## 🏗️ Architecture

```
mongodb-real-estate-crm/
├── server/              # MCP Server with MongoDB integration
├── client/              # React frontend with UI components
├── shared/              # Shared types and utilities
└── data/                # Sample data and seed scripts
```

## 📊 Data Model

### Collections

#### 1. **properties** - Inventory Management
```typescript
{
  _id: ObjectId,
  propertyId: string,          // Unique identifier (e.g., "LOT-001")
  address: string,
  lotNumber: string,
  sqft: number,
  bedrooms: number,
  bathrooms: number,
  price: number,
  status: "available" | "reserved" | "sold" | "under_construction",
  features: string[],
  community: string,
  constructionStartDate: Date,
  estimatedCompletionDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **leads** - Customer Pipeline
```typescript
{
  _id: ObjectId,
  leadId: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  source: "website" | "referral" | "walk-in" | "advertising" | "social_media",
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost",
  assignedTo: ObjectId,        // Reference to salesAgents
  interestedProperties: ObjectId[],
  budget: { min: number, max: number },
  notes: string,
  createdAt: Date,
  updatedAt: Date,
  lastContactDate: Date
}
```

#### 3. **salesAgents** - Team Management
```typescript
{
  _id: ObjectId,
  agentId: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  hireDate: Date,
  status: "active" | "inactive",
  territory: string,
  performance: {
    totalSales: number,
    totalRevenue: number,
    averageClosingTime: number,  // in days
    conversionRate: number         // percentage
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **contracts** - Sales Tracking
```typescript
{
  _id: ObjectId,
  contractId: string,
  propertyId: ObjectId,
  leadId: ObjectId,
  agentId: ObjectId,
  contractDate: Date,
  closingDate: Date,
  salePrice: number,
  depositAmount: number,
  depositDate: Date,
  status: "pending" | "signed" | "closed" | "cancelled",
  terms: {
    financingType: "cash" | "mortgage" | "construction_loan",
    downPaymentPercent: number,
    contingencies: string[]
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. **deposits** - Financial Tracking
```typescript
{
  _id: ObjectId,
  depositId: string,
  contractId: ObjectId,
  amount: number,
  depositDate: Date,
  type: "earnest_money" | "down_payment" | "installment",
  status: "pending" | "cleared" | "refunded",
  paymentMethod: "check" | "wire" | "credit_card",
  notes: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. **marketingCampaigns** - Advertising Analytics
```typescript
{
  _id: ObjectId,
  campaignId: string,
  name: string,
  type: "digital" | "print" | "billboard" | "radio" | "tv" | "social_media",
  channel: string,              // e.g., "Facebook", "Google Ads", "Local Magazine"
  startDate: Date,
  endDate: Date,
  budget: number,
  spent: number,
  impressions: number,
  clicks: number,
  leads: number,
  conversions: number,
  status: "planned" | "active" | "paused" | "completed",
  createdAt: Date,
  updatedAt: Date
}
```

#### 7. **activities** - Sales Activity Tracking
```typescript
{
  _id: ObjectId,
  activityId: string,
  agentId: ObjectId,
  leadId: ObjectId,
  type: "call" | "email" | "meeting" | "site_visit" | "follow_up",
  subject: string,
  notes: string,
  duration: number,             // in minutes
  outcome: string,
  scheduledDate: Date,
  completedDate: Date,
  status: "scheduled" | "completed" | "cancelled",
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Key Features

### Natural Language Queries
Ask questions in plain English:
- "Show me all available properties under $500,000"
- "What's my sales team's conversion rate this quarter?"
- "Which advertising campaigns generated the most leads?"
- "Show pending contracts from last month"

### Interactive Reports

#### Sales Performance Dashboard
- Revenue trends over time
- Agent performance comparison
- Pipeline funnel visualization
- Conversion rate metrics

#### Inventory Report
- Property status breakdown
- Price distribution analysis
- Days on market statistics
- Community-wise availability

#### Marketing Analytics
- Campaign ROI analysis
- Lead source attribution
- Cost per lead metrics
- Channel performance comparison

#### Financial Summary
- Deposit tracking and status
- Revenue forecasting
- Outstanding payments
- Monthly/quarterly summaries

### Export Capabilities
- **CSV**: Raw data export for further analysis
- **PDF**: Formatted reports with charts and tables
- **Excel**: Structured workbooks with multiple sheets

## 🚀 Quick Start

### Prerequisites
- Node.js 20.19.0 or later
- MongoDB Atlas account or local MongoDB instance
- MCP-compatible client (Cursor, Claude Desktop, etc.)

### Installation

1. **Install dependencies**
   ```bash
   cd examples/mongodb-real-estate-crm/server
   npm install
   ```

2. **Configure MongoDB connection**

   Create a `.env` file in the server directory:
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/real-estate-crm
   MCP_SERVER_PORT=3001
   ```

3. **Seed sample data**
   ```bash
   npm run seed
   ```

4. **Start the MCP server**
   ```bash
   npm run dev
   ```

### MCP Client Configuration

Add to your MCP client configuration (e.g., `.cursor/mcp.json`):

```json
{
  "servers": {
    "real-estate-crm": {
      "type": "stdio",
      "command": "node",
      "args": ["path/to/server/dist/index.js"],
      "env": {
        "MONGODB_URI": "mongodb+srv://..."
      }
    }
  }
}
```

Or use the MongoDB MCP Server directly:

```json
{
  "servers": {
    "mongodb-crm": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "mongodb-mcp-server@latest",
        "--readOnly"
      ],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "mongodb+srv://..."
      }
    }
  }
}
```

## 📈 Example Prompts

### Pipeline Analysis
```
Show me the current sales pipeline by stage with conversion rates
```

### Team Performance
```
Compare agent performance for Q4 2024 - show total sales, revenue, and average closing time
```

### Inventory Status
```
Create a report showing available properties grouped by community with price ranges
```

### Marketing ROI
```
Analyze marketing campaign effectiveness - show cost per lead and conversion rate by channel
```

### Financial Overview
```
Generate a monthly revenue report with deposits received and pending contracts
```

### Activity Tracking
```
Show sales team activity summary for this week - calls, meetings, and site visits
```

## 📊 Sample Report Templates

### Executive Summary Report
Includes:
- Total revenue (MTD, QTD, YTD)
- Properties sold vs available
- Average sale price
- Top performing agents
- Lead conversion funnel
- Active marketing campaigns

### Sales Agent Performance Report
Includes:
- Individual agent metrics
- Sales target vs actual
- Activity volume and types
- Average response time
- Customer satisfaction scores
- Commission earnings

### Marketing Analytics Report
Includes:
- Campaign performance matrix
- Lead source breakdown
- Cost analysis by channel
- ROI calculations
- Trend analysis
- Recommendations

### Inventory Management Report
Includes:
- Property status overview
- Days on market analysis
- Price adjustments history
- Feature popularity
- Community comparison
- Upcoming completions

## 🛠️ Development

### Project Structure
```
server/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── mongodb-client.ts     # MongoDB connection
│   ├── tools/                # MCP tool definitions
│   │   ├── query-tools.ts    # Natural language query tools
│   │   ├── report-tools.ts   # Report generation tools
│   │   └── export-tools.ts   # CSV/PDF export tools
│   ├── ui/                   # UI resource generators
│   │   ├── charts.ts         # Chart components
│   │   ├── tables.ts         # Table components
│   │   └── dashboards.ts     # Dashboard layouts
│   └── utils/
│       ├── report-generator.ts
│       └── data-aggregator.ts

client/
├── src/
│   ├── App.tsx               # Main application
│   ├── components/           # React components
│   │   ├── Dashboard.tsx
│   │   ├── Charts/
│   │   ├── Reports/
│   │   └── Tables/
│   └── hooks/                # Custom hooks
│       └── useMCP.ts

shared/
└── types/
    └── index.ts              # Shared TypeScript types
```

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

## 📚 Resources

- [MongoDB MCP Server Documentation](https://www.mongodb.com/docs/atlas/app-services/model-context-protocol/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP-UI SDK Documentation](https://mcpui.dev/)

## 🤝 Contributing

Contributions are welcome! Please see the main repository's [contribution guidelines](../../.github/CONTRIBUTING.md).

## 📄 License

Apache License 2.0 © [The MCP-UI Authors](../../LICENSE)
