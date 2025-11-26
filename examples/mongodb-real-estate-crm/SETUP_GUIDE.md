# MongoDB Real Estate CRM - Setup Guide

Complete step-by-step guide to get your Real Estate CRM up and running.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v20.19.0 or later, or v22.12.0+, or v23+)
- **MongoDB** (Atlas account or local installation)
- **npm** or **pnpm** package manager
- An MCP-compatible client (Cursor, Claude Desktop, etc.) - optional

## Step 1: MongoDB Setup

### Option A: MongoDB Atlas (Recommended)

1. **Create a free MongoDB Atlas account**
   - Visit https://www.mongodb.com/cloud/atlas/register
   - Sign up for a free tier account

2. **Create a cluster**
   - Click "Build a Database"
   - Choose the free tier (M0)
   - Select your preferred region
   - Click "Create Cluster"

3. **Create a database user**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter username and password (save these!)
   - Set privileges to "Atlas Admin" or "Read and write to any database"
   - Click "Add User"

4. **Configure network access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get your connection string**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Save this connection string for later

### Option B: Local MongoDB

```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb

# Connection string for local:
mongodb://localhost:27017/real-estate-crm
```

## Step 2: Server Setup

1. **Navigate to server directory**
   ```bash
   cd examples/mongodb-real-estate-crm/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file**
   ```env
   # Replace with your MongoDB connection string
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/real-estate-crm?retryWrites=true&w=majority

   # Or for local MongoDB
   # MONGODB_URI=mongodb://localhost:27017/real-estate-crm

   # Server configuration
   MCP_SERVER_PORT=3001
   NODE_ENV=development
   DB_NAME=real-estate-crm
   ```

5. **Build the server**
   ```bash
   npm run build
   ```

6. **Seed the database with sample data**
   ```bash
   npm run seed
   ```

   You should see output like:
   ```
   🌱 Starting data seed...
   ✅ Connected to MongoDB database: real-estate-crm
   🗑️  Clearing existing data...
   👥 Creating sales agents...
   ✅ Created 8 sales agents
   🏠 Creating properties...
   ✅ Created 127 properties
   📋 Creating leads...
   ✅ Created 200 leads
   ...
   ✅ Database seeded successfully!
   ```

7. **Start the server**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ╔═══════════════════════════════════════════════════════════════╗
   ║                                                               ║
   ║   🏡 MongoDB Real Estate CRM - MCP Server                    ║
   ║                                                               ║
   ║   Server: http://localhost:3001                               ║
   ║   Endpoint: http://localhost:3001/mcp                         ║
   ║   Health: http://localhost:3001/health                        ║
   ║                                                               ║
   ║   MongoDB: ✅ Connected                                       ║
   ║                                                               ║
   ╚═══════════════════════════════════════════════════════════════╝
   ```

8. **Test the server**
   Open a new terminal and run:
   ```bash
   curl http://localhost:3001/health
   ```

   Should return:
   ```json
   {
     "status": "healthy",
     "mongodb": true,
     "timestamp": "2024-11-26T..."
   }
   ```

## Step 3: Client Setup (Optional)

The client provides a web interface to interact with the MCP server.

1. **Navigate to client directory**
   ```bash
   cd ../client
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start the client**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to http://localhost:5173
   - The client should automatically connect to the server at http://localhost:3001

5. **Try the example queries**
   - Click "Executive Dashboard" to see comprehensive analytics
   - Click "Sales Report" to view agent performance
   - Click "Pipeline Analysis" to see the sales funnel
   - Click "Inventory Report" to browse available properties

## Step 4: MCP Client Configuration

### For Cursor

1. **Open Cursor settings**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "MCP Settings"
   - Select "Open MCP Settings"

2. **Add server configuration**

   Edit your `.cursor/mcp.json`:

   ```json
   {
     "servers": {
       "real-estate-crm": {
         "type": "stdio",
         "command": "node",
         "args": ["/absolute/path/to/examples/mongodb-real-estate-crm/server/dist/index.js"],
         "env": {
           "MONGODB_URI": "mongodb+srv://username:password@cluster.mongodb.net/real-estate-crm"
         }
       }
     }
   }
   ```

   **Important:** Replace `/absolute/path/to/` with the actual path to your project.

3. **Restart Cursor**

4. **Test the integration**
   - Open a new chat
   - Type: "Show me the executive dashboard"
   - The MCP tools should be called and display interactive visualizations

### For Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or equivalent on Windows:

```json
{
  "mcpServers": {
    "real-estate-crm": {
      "command": "node",
      "args": ["/absolute/path/to/examples/mongodb-real-estate-crm/server/dist/index.js"],
      "env": {
        "MONGODB_URI": "mongodb+srv://..."
      }
    }
  }
}
```

### Using MongoDB MCP Server Directly

Instead of running the custom server, you can use the official MongoDB MCP Server:

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

**Note:** The custom server provides additional features like interactive UI, reports, and charts that the standard MongoDB MCP server doesn't include.

## Step 5: Using the Application

### Natural Language Queries

Once configured, you can ask questions in natural language:

**Dashboard & Overview:**
- "Show me the executive dashboard"
- "What's our overall performance this quarter?"

**Sales Analytics:**
- "Generate a sales performance report for Q4 2024"
- "Who are our top performing agents?"
- "Show me sales trends for the last 6 months"

**Pipeline Management:**
- "Show me the current sales pipeline"
- "Analyze our lead conversion rates"
- "Which lead sources are most effective?"

**Inventory:**
- "Show me all available properties"
- "What properties are available in Sunset Hills?"
- "Show me homes under $500,000"

**Marketing:**
- "Analyze marketing campaign ROI"
- "Which campaigns generated the most leads?"
- "Show me cost per lead by channel"

**Reports & Exports:**
- "Export agent performance data as CSV"
- "Generate an executive summary PDF"
- "Export all contracts to JSON"

See [PROMPTS_AND_EXAMPLES.md](./PROMPTS_AND_EXAMPLES.md) for comprehensive examples.

## Troubleshooting

### MongoDB Connection Issues

**Error:** "MongoDB connection string not found"
- **Solution:** Make sure `.env` file exists and `MONGODB_URI` is set

**Error:** "Authentication failed"
- **Solution:**
  - Verify username and password in connection string
  - Check that database user exists in Atlas
  - Ensure password special characters are URL-encoded

**Error:** "Connection timeout"
- **Solution:**
  - Check Network Access settings in Atlas
  - Verify your IP is whitelisted
  - Try "Allow Access from Anywhere" for testing

### Server Issues

**Error:** Port 3001 already in use
- **Solution:**
  - Change port in `.env`: `MCP_SERVER_PORT=3002`
  - Or kill existing process: `lsof -ti:3001 | xargs kill`

**Error:** "Cannot find module"
- **Solution:**
  - Run `npm run build` to compile TypeScript
  - Delete `node_modules` and `package-lock.json`, then `npm install`

### Client Issues

**Error:** "Failed to call MCP tool"
- **Solution:**
  - Verify server is running on http://localhost:3001
  - Check browser console for CORS errors
  - Ensure server URL is correct in client

### Data Issues

**No data showing in reports**
- **Solution:** Run `npm run seed` to populate sample data

**Stale data**
- **Solution:** Re-run seed script to reset data

## Advanced Configuration

### Custom Port

```env
MCP_SERVER_PORT=8080
```

### Different Database Name

```env
DB_NAME=my-real-estate-db
```

### Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use production MongoDB connection string
3. Enable authentication
4. Configure CORS appropriately
5. Use process manager (PM2, systemd)

```bash
# Using PM2
npm install -g pm2
pm2 start dist/index.js --name real-estate-crm
pm2 save
pm2 startup
```

## Next Steps

1. **Explore the data** - Browse through the seeded sample data
2. **Try queries** - Test different natural language prompts
3. **Customize** - Modify schemas and add new fields
4. **Extend** - Add new MCP tools for specific use cases
5. **Deploy** - Set up for production use

## Support

- **Documentation:** See [README.md](./README.md)
- **Examples:** See [PROMPTS_AND_EXAMPLES.md](./PROMPTS_AND_EXAMPLES.md)
- **Issues:** Report at https://github.com/idosal/mcp-ui/issues

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use environment variables** - For production deployments
3. **Restrict database access** - Configure proper network rules
4. **Use read-only credentials** - When possible for MCP connections
5. **Enable authentication** - For production servers
6. **Regularly rotate credentials** - Update passwords periodically

---

**Congratulations!** 🎉 You now have a fully functional Real Estate CRM powered by MongoDB and MCP!
