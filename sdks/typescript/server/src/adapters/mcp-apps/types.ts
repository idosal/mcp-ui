import type { UIActionResult } from '../../types.js';

/**
 * MCP-UI Protocol Messages
 * 
 * These types define the message format used by MCP-UI widgets.
 * The adapter translates between these and MCP Apps SEP protocol
 * (types defined in @modelcontextprotocol/ext-apps).
 */

export interface MCPUILifecycleReadyMessage {
  type: 'ui-lifecycle-iframe-ready';
  messageId?: string;
  payload?: Record<string, never>;
}

export interface MCPUISizeChangeMessage {
  type: 'ui-size-change';
  messageId?: string;
  payload: {
    width?: number;
    height?: number;
  };
}

export interface MCPUIRequestDataMessage {
  type: 'ui-request-data';
  messageId: string;
  payload: {
    requestType: string;
    params?: Record<string, unknown>;
  };
}

export interface MCPUIRequestRenderDataMessage {
  type: 'ui-request-render-data';
  messageId?: string;
  payload?: Record<string, unknown>;
}

export interface MCPUIRenderDataMessage {
  type: 'ui-lifecycle-iframe-render-data';
  messageId?: string;
  payload: {
    renderData: RenderData;
  };
}

export interface MCPUIMessageReceivedMessage {
  type: 'ui-message-received';
  messageId?: string;
  payload: {
    messageId: string;
  };
}

export interface MCPUIMessageResponseMessage {
  type: 'ui-message-response';
  messageId?: string;
  payload: {
    messageId: string;
    response?: unknown;
    error?: unknown;
  };
}

export interface RenderData {
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  widgetState?: unknown;
  locale?: string;
  theme?: string;
  displayMode?: 'inline' | 'pip' | 'fullscreen';
  maxHeight?: number;
  [key: string]: unknown;
}

export type MCPUIMessage =
  | UIActionResult
  | MCPUILifecycleReadyMessage
  | MCPUISizeChangeMessage
  | MCPUIRequestDataMessage
  | MCPUIRequestRenderDataMessage
  | MCPUIRenderDataMessage
  | MCPUIMessageReceivedMessage
  | MCPUIMessageResponseMessage;

/**
 * MCP Apps Adapter Configuration
 */
export interface McpAppsAdapterConfig {
  /**
   * Custom logger (defaults to console)
   */
  logger?: Pick<Console, 'log' | 'warn' | 'error' | 'debug'>;

  /**
   * Timeout in milliseconds for async operations (defaults to 30000)
   */
  timeout?: number;
}

export interface PendingRequest<T = unknown> {
  messageId: string;
  type: string;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (error: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}
