import { useState } from 'react';
import { UIResourceRenderer } from '@mcp-ui/client';
import './App.css';

interface MCPResource {
  type: string;
  resource?: {
    uri?: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  };
  text?: string;
}

function App() {
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:3001/mcp');

  const callMCPTool = async (toolName: string, params: any = {}) => {
    setLoading(true);
    try {
      // This is a simplified example - in production you'd use the MCP SDK client
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: params
          }
        })
      });

      const data = await response.json();
      if (data.result?.content) {
        setResources(data.result.content);
      }
    } catch (error) {
      console.error('Error calling MCP tool:', error);
      alert('Failed to call MCP tool. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    { label: 'Executive Dashboard', tool: 'dashboard', params: {} },
    { label: 'Sales Report (Chart & Table)', tool: 'salesReport', params: { format: 'both' } },
    { label: 'Pipeline Analysis', tool: 'pipelineAnalysis', params: {} },
    { label: 'Lead Sources', tool: 'leadSourceAnalysis', params: {} },
    { label: 'Inventory Report', tool: 'inventoryReport', params: {} },
    { label: 'Marketing ROI', tool: 'marketingROI', params: {} }
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏡 Real Estate CRM</h1>
        <p>MongoDB MCP-Powered Analytics Dashboard</p>
      </header>

      <div className="server-config">
        <label>
          MCP Server URL:
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://localhost:3001/mcp"
          />
        </label>
      </div>

      <div className="query-buttons">
        <h2>Quick Access Reports</h2>
        <div className="button-grid">
          {exampleQueries.map((query) => (
            <button
              key={query.tool}
              onClick={() => callMCPTool(query.tool, query.params)}
              disabled={loading}
              className="query-button"
            >
              {query.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      <div className="results">
        {resources.map((resource, index) => (
          <div key={index} className="resource-container">
            {resource.type === 'resource' && resource.resource?.uri?.startsWith('ui://') ? (
              <UIResourceRenderer
                resource={resource.resource}
                onUIAction={(action) => {
                  console.log('UI Action:', action);
                }}
              />
            ) : resource.type === 'text' && resource.text ? (
              <div className="text-content">
                <pre>{resource.text}</pre>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <footer className="app-footer">
        <p>Powered by MongoDB MCP Server & MCP-UI SDK</p>
      </footer>
    </div>
  );
}

export default App;
