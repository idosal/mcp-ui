/**
 * Type definitions for the Apps SDK adapter
 */

import type { UIActionResult } from '../../types.js';

/**
 * Additional MCP-UI Protocol Messages (Lifecycle & Control)
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
 * Apps SDK Protocol Types (e.g., ChatGPT window.openai interface)
 */

export interface AppsSdkBridge {
  toolInput: Record<string, unknown>;
  toolOutput: unknown;
  widgetState: unknown;
  setWidgetState(state: unknown): Promise<void>;
  callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
  sendFollowUpMessage(params: { prompt: string }): Promise<void>;
  requestDisplayMode(params: { mode: 'inline' | 'pip' | 'fullscreen' }): Promise<void>;
  maxHeight?: number;
  displayMode?: 'inline' | 'pip' | 'fullscreen';
  locale?: string;
  theme?: string;
}

export interface AppsSdkSetGlobalsEventDetail {
  displayMode?: 'inline' | 'pip' | 'fullscreen';
  maxHeight?: number;
  toolOutput?: unknown;
  widgetState?: unknown;
  locale?: string;
  theme?: string;
}

export interface AppsSdkToolResponseEventDetail {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

/**
 * Apps SDK Adapter Configuration
 */

export interface AppsSdkAdapterConfig {
  /**
   * Custom logger (defaults to console)
   */
  logger?: Pick<Console, 'log' | 'warn' | 'error' | 'debug'>;

  /**
   * Origin to use when dispatching MessageEvents to the iframe (defaults to window.location.origin)
   * This simulates the origin of the host/parent window
   */
  hostOrigin?: string;

  /**
   * Timeout in milliseconds for async operations (defaults to 30000)
   */
  timeout?: number;

  /**
   * How to handle 'intent' messages (defaults to 'prompt')
   * - 'prompt': Convert to sendFollowupTurn with intent description
   * - 'ignore': Log and acknowledge but take no action
   */
  intentHandling?: 'prompt' | 'ignore';
}

/**
 * Internal adapter state
 */

export interface PendingRequest<T = unknown> {
  messageId: string;
  type: string;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (error: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Window extension for Apps SDK environment (e.g., window.openai in ChatGPT)
 */

declare global {
  interface Window {
    openai?: AppsSdkBridge;
  }
}

