/**
 * MCP-UI Adapters
 * 
 * Adapters enable MCP-UI widgets to work in host-specific environments by translating
 * the open MCP-UI protocol to platform-specific APIs.
 * 
 * Available adapters:
 * - appsSdk: For Apps SDK environments (e.g., ChatGPT)
 * 
 * Future adapters could include other platforms as needed.
 */

export * from './appssdk/index.js';

