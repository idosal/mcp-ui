/**
 * MCP-UI to Apps SDK Adapter Runtime
 *
 * This module enables MCP-UI embeddable widgets to run in Apps SDK environments (e.g., ChatGPT)
 * by intercepting MCP-UI protocol messages and translating them to the Apps SDK API (e.g., window.openai).
 */

import type {
  AppsSdkAdapterConfig,
  MCPUIMessage,
  PendingRequest,
  RenderData,
} from './types.js';
import type { UIActionResult } from '../../types.js';

type ParentPostMessage = Window['postMessage'];
type AdapterWindow = Window & {
  MCP_APPSSDK_ADAPTER_NO_AUTO_INSTALL?: boolean;
};

/**
 * Main adapter class that handles protocol translations
 */
class MCPUIAppsSdkAdapter {
  private config: Required<AppsSdkAdapterConfig>;
  private pendingRequests: Map<string, PendingRequest<unknown>> = new Map();
  private messageIdCounter = 0;
  private originalPostMessage: ParentPostMessage | null = null;

  constructor(config: AppsSdkAdapterConfig = {}) {
    this.config = {
      logger: config.logger || console,
      hostOrigin: config.hostOrigin || window.location.origin,
      timeout: config.timeout || 30000,
      intentHandling: config.intentHandling || 'prompt',
    };
  }

  /**
   * Initialize the adapter and monkey-patch postMessage if Apps SDK is present
   */
  install(): boolean {
    if (!window.openai) {
      this.config.logger.warn('[MCPUI-Apps SDK Adapter] window.openai not detected. Adapter will not activate.');
      return false;
    }

    this.config.logger.log('[MCPUI-Apps SDK Adapter] Initializing adapter...');

    // Monkey-patch parent.postMessage
    this.patchPostMessage();

    // Listen for Apps SDK events
    this.setupAppsSdkEventListeners();

    // Send initial render data
    this.sendRenderData();

    this.config.logger.log('[MCPUI-Apps SDK Adapter] Adapter initialized successfully');
    return true;
  }

  /**
   * Clean up pending requests and restore original postMessage
   */
  uninstall(): void {
    // Clear pending requests
    for (const request of this.pendingRequests.values()) {
      clearTimeout(request.timeoutId);
      request.reject(new Error('Adapter uninstalled'));
    }
    this.pendingRequests.clear();

    // Restore original postMessage if we saved it
    if (this.originalPostMessage) {
      try {
        const parentWindow = window.parent ?? null;
        if (parentWindow) {
          parentWindow.postMessage = this.originalPostMessage;
        }
        this.config.logger.log('[MCPUI-Apps SDK Adapter] Restored original parent.postMessage');
      } catch (error) {
        this.config.logger.error('[MCPUI-Apps SDK Adapter] Failed to restore original postMessage:', error);
      }
    }

    this.config.logger.log('[MCPUI-Apps SDK Adapter] Adapter uninstalled');
  }

  /**
   * Monkey-patch parent.postMessage to intercept MCP-UI messages
   * and forward non-MCP-UI messages to the original postMessage
   */
  private patchPostMessage(): void {
    const parentWindow = window.parent ?? null;

    // Save the original postMessage function
    this.originalPostMessage = parentWindow?.postMessage?.bind(parentWindow) ?? null;

    if (!this.originalPostMessage) {
      this.config.logger.debug('[MCPUI-Apps SDK Adapter] parent.postMessage does not exist, installing shim only');
    } else {
      this.config.logger.debug('[MCPUI-Apps SDK Adapter] Monkey-patching parent.postMessage to intercept MCP-UI messages');
    }

    // Create the interceptor function
    const postMessageInterceptor: ParentPostMessage = (
      message: unknown,
      targetOriginOrOptions?: string | WindowPostMessageOptions,
      transfer?: Transferable[]
    ): void => {
      // Check if this is an MCP-UI message
      if (this.isMCPUIMessage(message)) {
        const mcpMessage = message as MCPUIMessage;
        this.config.logger.debug('[MCPUI-Apps SDK Adapter] Intercepted MCP-UI message:', mcpMessage.type);
        this.handleMCPUIMessage(mcpMessage);
      } else {
        // Forward non-MCP-UI messages to the original postMessage if it exists
        if (this.originalPostMessage) {
          this.config.logger.debug('[MCPUI-Apps SDK Adapter] Forwarding non-MCP-UI message to original postMessage');
          if (typeof targetOriginOrOptions === 'string' || targetOriginOrOptions === undefined) {
            const targetOrigin = targetOriginOrOptions ?? '*';
            this.originalPostMessage(message, targetOrigin, transfer);
          } else {
            this.originalPostMessage(message, targetOriginOrOptions);
          }
        } else {
          this.config.logger.warn('[MCPUI-Apps SDK Adapter] No original postMessage to forward to, ignoring message:', message);
        }
      }
    };

    try {
      // Replace parent.postMessage with our interceptor
      if (parentWindow) {
        parentWindow.postMessage = postMessageInterceptor;
      }
    } catch (error) {
      this.config.logger.error('[MCPUI-Apps SDK Adapter] Failed to monkey-patch parent.postMessage:', error);
    }
  }

  /**
   * Check if a message is an MCP-UI protocol message
   */
  private isMCPUIMessage(message: unknown): boolean {
    if (!message || typeof message !== 'object') {
      return false;
    }

    const msg = message as Record<string, unknown>;
    return typeof msg.type === 'string' &&
           (msg.type.startsWith('ui-') ||
            ['tool', 'prompt', 'intent', 'notify', 'link'].includes(msg.type));
  }

  /**
   * Handle incoming MCP-UI messages and translate to Apps SDK actions
   */
  private async handleMCPUIMessage(message: MCPUIMessage): Promise<void> {
    this.config.logger.debug('[MCPUI-Apps SDK Adapter] Received MCPUI message:', message.type);

    try {
      switch (message.type) {
        case 'tool':
          await this.handleToolMessage(message);
          break;
        case 'prompt':
          await this.handlePromptMessage(message);
          break;
        case 'intent':
          await this.handleIntentMessage(message);
          break;
        case 'notify':
          await this.handleNotifyMessage(message);
          break;
        case 'link':
          await this.handleLinkMessage(message);
          break;
        case 'ui-lifecycle-iframe-ready':
          this.sendRenderData();
          break;
        case 'ui-request-render-data':
          this.sendRenderData(message.messageId);
          break;
        case 'ui-size-change':
          this.handleSizeChange(message);
          break;
        case 'ui-request-data':
          this.handleRequestData(message);
          break;
        default:
          this.config.logger.warn('[MCPUI-Apps SDK Adapter] Unknown message type:', message.type);
      }
    } catch (error) {
      this.config.logger.error('[MCPUI-Apps SDK Adapter] Error handling message:', error);
      if (message.messageId) {
        this.sendErrorResponse(message.messageId, error);
      }
    }
  }

  /**
   * Handle 'tool' message - call Apps SDK tool
   */
  private async handleToolMessage(message: UIActionResult): Promise<void> {
    if (message.type !== 'tool') return;
    const { toolName, params } = message.payload;
    const messageId = message.messageId || this.generateMessageId();

    this.sendAcknowledgment(messageId);

    try {
      if (!window.openai?.callTool) {
        throw new Error('Tool calling is not supported in this environment');
      }

      const result = await this.withTimeout(
        window.openai.callTool(toolName, params),
        messageId
      );

      this.sendSuccessResponse(messageId, result);
    } catch (error) {
      this.sendErrorResponse(messageId, error);
    }
  }

  /**
   * Handle 'prompt' message - send followup turn
   */
  private async handlePromptMessage(message: UIActionResult): Promise<void> {
    if (message.type !== 'prompt') return;
    const prompt = message.payload.prompt;
    const messageId = message.messageId || this.generateMessageId();

    this.sendAcknowledgment(messageId);

    try {
      if (!window.openai?.sendFollowUpMessage) {
        throw new Error('Followup turns are not supported in this environment');
      }

      await this.withTimeout(
        window.openai.sendFollowUpMessage({ prompt }),
        messageId
      );

      this.sendSuccessResponse(messageId, { success: true });
    } catch (error) {
      this.sendErrorResponse(messageId, error);
    }
  }

  /**
   * Handle 'intent' message - convert to prompt or ignore based on config
   */
  private async handleIntentMessage(message: UIActionResult): Promise<void> {
    if (message.type !== 'intent') return;
    const messageId = message.messageId || this.generateMessageId();
    this.sendAcknowledgment(messageId);

    if (this.config.intentHandling === 'ignore') {
      this.config.logger.log('[MCPUI-Apps SDK Adapter] Intent ignored:', message.payload.intent);
      this.sendSuccessResponse(messageId, { ignored: true });
      return;
    }

    // Convert to prompt
    const { intent, params } = message.payload;
    const prompt = `${intent}${params ? `: ${JSON.stringify(params)}` : ''}`;

    try {
      if (!window.openai?.sendFollowUpMessage) {
        throw new Error('Followup turns are not supported in this environment');
      }

      await this.withTimeout(
        window.openai.sendFollowUpMessage({ prompt }),
        messageId
      );

      this.sendSuccessResponse(messageId, { success: true });
    } catch (error) {
      this.sendErrorResponse(messageId, error);
    }
  }

  /**
   * Handle 'notify' message - log only
   */
  private async handleNotifyMessage(message: UIActionResult): Promise<void> {
    if (message.type !== 'notify') return;
    const messageId = message.messageId || this.generateMessageId();
    this.config.logger.log('[MCPUI-Apps SDK Adapter] Notification:', message.payload.message);
    this.sendAcknowledgment(messageId);
    this.sendSuccessResponse(messageId, { acknowledged: true });
  }

  /**
   * Handle 'link' message - not supported in Apps SDK environments
   */
  private async handleLinkMessage(message: UIActionResult): Promise<void> {
    if (message.type !== 'link') return;
    const messageId = message.messageId || this.generateMessageId();
    this.sendAcknowledgment(messageId);
    this.sendErrorResponse(messageId, new Error('Navigation is not supported in Apps SDK environment'));
  }

  /**
   * Handle size change - no-op in Apps SDK environment
   */
  private handleSizeChange(message: MCPUIMessage): void {
    this.config.logger.debug('[MCPUI-Apps SDK Adapter] Size change requested (no-op in Apps SDK):', message.payload);
  }

  /**
   * Handle generic data request
   */
  private handleRequestData(message: MCPUIMessage): void {
    const messageId = message.messageId || this.generateMessageId();
    this.sendAcknowledgment(messageId);
    this.sendErrorResponse(messageId, new Error('Generic data requests not yet implemented'));
  }

  /**
   * Setup listeners for Apps SDK events
   */
  private setupAppsSdkEventListeners(): void {
    window.addEventListener('openai:set_globals', (() => {
      this.config.logger.debug('[MCPUI-Apps SDK Adapter] Globals updated');
      this.sendRenderData();
    }));
  }

  /**
   * Gather render data from Apps SDK and send to widget
   */
  private sendRenderData(requestMessageId?: string): void {
    if (!window.openai) return;

    const renderData: RenderData = {
      toolInput: window.openai.toolInput,
      toolOutput: window.openai.toolOutput,
      widgetState: window.openai.widgetState,
      locale: window.openai.locale || 'en-US',
      theme: window.openai.theme || 'light',
      displayMode: window.openai.displayMode || 'inline',
      maxHeight: window.openai.maxHeight,
    };

    this.dispatchMessageToIframe({
      type: 'ui-lifecycle-iframe-render-data',
      messageId: requestMessageId,
      payload: { renderData },
    });
  }

  /**
   * Send acknowledgment for a message
   */
  private sendAcknowledgment(messageId: string): void {
    this.dispatchMessageToIframe({
      type: 'ui-message-received',
      payload: { messageId },
    });
  }

  /**
   * Send success response
   */
  private sendSuccessResponse(messageId: string, response: unknown): void {
    this.dispatchMessageToIframe({
      type: 'ui-message-response',
      payload: { messageId, response },
    });
  }

  /**
   * Send error response
   */
  private sendErrorResponse(messageId: string, error: unknown): void {
    const errorObj = error instanceof Error
      ? { message: error.message, name: error.name }
      : { message: String(error) };

    this.dispatchMessageToIframe({
      type: 'ui-message-response',
      payload: { messageId, error: errorObj },
    });
  }

  /**
   * Dispatch a MessageEvent to the iframe (widget)
   * Simulates messages that would normally come from the parent/host
   */
  private dispatchMessageToIframe(data: MCPUIMessage): void {
    const event = new MessageEvent('message', {
      data,
      origin: this.config.hostOrigin,
      source: null,
    });

    window.dispatchEvent(event);
  }

  /**
   * Wrap a promise with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, requestId: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);

      this.pendingRequests.set(requestId, {
        messageId: requestId,
        type: 'generic',
        resolve: resolve as (value: unknown) => void,
        reject,
        timeoutId,
      });

      promise
        .then((result) => {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);
          reject(error);
        });
    });
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `adapter-${Date.now()}-${++this.messageIdCounter}`;
  }
}

// Global adapter instance
let adapterInstance: MCPUIAppsSdkAdapter | null = null;

/**
 * Initialize the MCP-UI to Apps SDK adapter
 *
 * Call this function once when your widget loads to enable automatic
 * translation between MCP-UI protocol and Apps SDK API.
 *
 * @param config - Optional configuration
 * @returns true if adapter was initialized, false if Apps SDK not detected
 */
export function initAdapter(config?: AppsSdkAdapterConfig): boolean {
  if (adapterInstance) {
    console.warn('[MCPUI-Apps SDK Adapter] Adapter already initialized');
    return true;
  }

  adapterInstance = new MCPUIAppsSdkAdapter(config);
  return adapterInstance.install();
}

/**
 * Uninstall the adapter and restore original behavior
 */
export function uninstallAdapter(): void {
  if (adapterInstance) {
    adapterInstance.uninstall();
    adapterInstance = null;
  }
}

/**
 * Auto-install the adapter when this module is loaded
 * Can be disabled by setting window.MCP_APPSSDK_ADAPTER_NO_AUTO_INSTALL = true before loading
 */
if (typeof window !== 'undefined') {
  const adapterWindow = window as AdapterWindow;
  if (!adapterWindow.MCP_APPSSDK_ADAPTER_NO_AUTO_INSTALL) {
    initAdapter();
  }
}

