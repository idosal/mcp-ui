/**
 * Apps SDK Adapter for MCP-UI
 * 
 * Enables MCP-UI widgets to work in Apps SDK environments (e.g., ChatGPT)
 */

export { getAppsSdkAdapterScript } from './adapter.js';
export type {
  AppsSdkAdapterConfig,
  AppsSdkBridge,
  RenderData,
  MCPUIMessage,
} from './types.js';

