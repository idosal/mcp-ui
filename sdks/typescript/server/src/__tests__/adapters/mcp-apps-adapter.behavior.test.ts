/**
 * Behavioral tests for the MCP Apps Adapter Runtime
 * 
 * These tests verify the actual message translation behavior by:
 * 1. Setting up a simulated browser environment
 * 2. Running the adapter code
 * 3. Sending MCP-UI messages and verifying JSON-RPC output
 * 4. Sending JSON-RPC messages and verifying MCP-UI events
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getMcpAppsAdapterScript } from '../../adapters/mcp-apps/adapter';

// Types for test clarity
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

interface RenderData {
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  widgetState?: unknown;
  locale?: string;
  theme?: string;
  displayMode?: string;
  maxHeight?: number;
}

interface McpUiMessage {
  type: string;
  messageId?: string;
  payload?: {
    messageId?: string;
    response?: unknown;
    error?: { message: string; name?: string };
    renderData?: RenderData;
    reason?: string;
    [key: string]: unknown;
  };
}

/**
 * Creates a test environment that simulates a browser iframe context
 * with a parent window that can receive postMessage calls
 */
function createTestEnvironment() {
  const sentToHost: (JsonRpcRequest | JsonRpcNotification)[] = [];
  const dispatchedToIframe: McpUiMessage[] = [];
  const originalWindow = globalThis.window;

  // Create mock parent window
  const mockParentPostMessage = vi.fn((message: unknown, _targetOrigin?: string, _transfer?: Transferable[]) => {
    if (message && typeof message === 'object' && 'jsonrpc' in message) {
      sentToHost.push(message as JsonRpcRequest | JsonRpcNotification);
    }
  });

  // Create mock window object
  const mockWindow = {
    parent: {
      postMessage: mockParentPostMessage,
    },
    location: { origin: 'https://test.example.com' },
    addEventListener: vi.fn((event: string, handler: (e: MessageEvent) => void) => {
      if (event === 'message') {
        (mockWindow as unknown as { _messageHandler: (e: MessageEvent) => void })._messageHandler = handler;
      }
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn((event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && 'type' in event.data) {
        dispatchedToIframe.push(event.data as McpUiMessage);
      }
      return true;
    }),
    MessageEvent: class MockMessageEvent {
      data: unknown;
      origin: string;
      source: unknown;
      constructor(_type: string, init: { data: unknown; origin: string; source: unknown }) {
        this.data = init.data;
        this.origin = init.origin;
        this.source = init.source;
      }
    },
    _messageHandler: null as ((e: MessageEvent) => void) | null,
  };

  // Install mock window
  (globalThis as unknown as { window: typeof mockWindow }).window = mockWindow;

  return {
    sentToHost,
    dispatchedToIframe,
    mockParentPostMessage,
    
    /** Simulate sending an MCP-UI message (like widget would) */
    sendMcpUiMessage(message: McpUiMessage) {
      // The adapter patches parent.postMessage, so we need to call it
      mockWindow.parent.postMessage(message, '*');
    },

    /** Simulate receiving a JSON-RPC message from host */
    receiveFromHost(message: JsonRpcResponse | JsonRpcNotification | JsonRpcRequest) {
      const handler = mockWindow._messageHandler;
      if (handler) {
        handler({ data: message } as MessageEvent);
      }
    },

    /** Clear captured messages */
    clear() {
      sentToHost.length = 0;
      dispatchedToIframe.length = 0;
    },

    /** Restore original window */
    restore() {
      (globalThis as unknown as { window: typeof originalWindow }).window = originalWindow;
    },

    /** Get the mock window for direct access */
    get window() {
      return mockWindow;
    },
  };
}

/**
 * Executes the adapter script and initializes it
 */
function initializeAdapter(env: ReturnType<typeof createTestEnvironment>, config = {}) {
  const script = getMcpAppsAdapterScript(config);
  const jsCode = script.replace(/<\/?script>/gi, '');
  
  // Execute the adapter code
  const fn = new Function(jsCode);
  fn();
  
  // The adapter should have sent ui/initialize request
  return env;
}

describe('MCP Apps Adapter - Behavioral Tests', () => {
  let env: ReturnType<typeof createTestEnvironment>;

  beforeEach(() => {
    vi.useFakeTimers();
    env = createTestEnvironment();
  });

  afterEach(() => {
    env.restore();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should send ui/initialize request on startup', () => {
      initializeAdapter(env);
      
      const initRequest = env.sentToHost.find(
        (msg): msg is JsonRpcRequest => 'id' in msg && msg.method === 'ui/initialize'
      );
      
      expect(initRequest).toBeDefined();
      expect(initRequest?.jsonrpc).toBe('2.0');
      expect(initRequest?.params).toMatchObject({
        appInfo: { name: 'mcp-ui-adapter', version: '1.0.0' },
        appCapabilities: {},
        protocolVersion: '2025-11-21',
      });
    });

    it('should send ui/notifications/initialized after receiving init response', () => {
      initializeAdapter(env);
      
      // Find the init request to get its ID
      const initRequest = env.sentToHost.find(
        (msg): msg is JsonRpcRequest => 'id' in msg && msg.method === 'ui/initialize'
      );
      
      // Simulate host responding to initialization
      env.receiveFromHost({
        jsonrpc: '2.0',
        id: initRequest!.id,
        result: {
          protocolVersion: '2025-11-21',
          hostInfo: { name: 'test-host', version: '1.0.0' },
          hostCapabilities: {},
          hostContext: { theme: 'dark' },
        },
      });

      const initializedNotification = env.sentToHost.find(
        (msg): msg is JsonRpcNotification => !('id' in msg) && msg.method === 'ui/notifications/initialized'
      );
      
      expect(initializedNotification).toBeDefined();
    });
  });

  describe('MCP-UI to JSON-RPC Translation', () => {
    beforeEach(() => {
      initializeAdapter(env);
      env.clear(); // Clear initialization messages
    });

    describe('prompt message', () => {
      it('should translate prompt to ui/message with content as array', () => {
        env.sendMcpUiMessage({
          type: 'prompt',
          messageId: 'test-1',
          payload: { prompt: 'Hello, how are you?' },
        });

        const messageRequest = env.sentToHost.find(
          (msg): msg is JsonRpcRequest => 'id' in msg && msg.method === 'ui/message'
        );

        expect(messageRequest).toBeDefined();
        expect(messageRequest?.params).toEqual({
          role: 'user',
          content: [{ type: 'text', text: 'Hello, how are you?' }],
        });
      });

      it('should send acknowledgment for prompt message', () => {
        env.sendMcpUiMessage({
          type: 'prompt',
          messageId: 'test-prompt-1',
          payload: { prompt: 'Test prompt' },
        });

        const ack = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-message-received'
        );

        expect(ack).toBeDefined();
        expect(ack?.payload?.messageId).toBe('test-prompt-1');
      });
    });

    describe('tool message', () => {
      it('should translate tool to tools/call', () => {
        env.sendMcpUiMessage({
          type: 'tool',
          messageId: 'test-2',
          payload: { 
            toolName: 'get_weather',
            params: { city: 'San Francisco' },
          },
        });

        const toolRequest = env.sentToHost.find(
          (msg): msg is JsonRpcRequest => 'id' in msg && msg.method === 'tools/call'
        );

        expect(toolRequest).toBeDefined();
        expect(toolRequest?.params).toEqual({
          name: 'get_weather',
          arguments: { city: 'San Francisco' },
        });
      });
    });

    describe('intent message', () => {
      it('should translate intent to ui/message with content as array', () => {
        env.sendMcpUiMessage({
          type: 'intent',
          messageId: 'test-3',
          payload: { 
            intent: 'navigate',
            params: { destination: 'home' },
          },
        });

        const messageRequest = env.sentToHost.find(
          (msg): msg is JsonRpcRequest => 'id' in msg && msg.method === 'ui/message'
        );

        expect(messageRequest).toBeDefined();
        expect(messageRequest?.params?.role).toBe('user');
        expect(messageRequest?.params?.content).toBeInstanceOf(Array);
        expect((messageRequest?.params?.content as Array<{type: string; text: string}>)[0]).toMatchObject({
          type: 'text',
        });
        // Content should include intent info
        expect((messageRequest?.params?.content as Array<{type: string; text: string}>)[0].text).toContain('navigate');
      });
    });

    describe('link message', () => {
      it('should translate link to ui/open-link', () => {
        env.sendMcpUiMessage({
          type: 'link',
          messageId: 'test-4',
          payload: { url: 'https://example.com' },
        });

        const linkRequest = env.sentToHost.find(
          (msg): msg is JsonRpcRequest => 'id' in msg && msg.method === 'ui/open-link'
        );

        expect(linkRequest).toBeDefined();
        expect(linkRequest?.params).toEqual({ url: 'https://example.com' });
      });
    });

    describe('notify message', () => {
      it('should translate notify to notifications/message', () => {
        env.sendMcpUiMessage({
          type: 'notify',
          messageId: 'test-5',
          payload: { message: 'Operation completed' },
        });

        const notifyRequest = env.sentToHost.find(
          (msg): msg is JsonRpcNotification => msg.method === 'notifications/message'
        );

        expect(notifyRequest).toBeDefined();
        expect(notifyRequest?.params).toEqual({
          level: 'info',
          data: 'Operation completed',
        });
      });
    });

    describe('ui-size-change message', () => {
      it('should translate size change to ui/notifications/size-changed', () => {
        env.sendMcpUiMessage({
          type: 'ui-size-change',
          payload: { width: 800, height: 600 },
        });

        const sizeNotification = env.sentToHost.find(
          (msg): msg is JsonRpcNotification => msg.method === 'ui/notifications/size-changed'
        );

        expect(sizeNotification).toBeDefined();
        expect(sizeNotification?.params).toEqual({ width: 800, height: 600 });
      });
    });
  });

  describe('JSON-RPC to MCP-UI Translation (Host -> App)', () => {
    beforeEach(() => {
      initializeAdapter(env);
      // Complete initialization
      const initRequest = env.sentToHost.find(
        (msg): msg is JsonRpcRequest => 'id' in msg && msg.method === 'ui/initialize'
      );
      env.receiveFromHost({
        jsonrpc: '2.0',
        id: initRequest!.id,
        result: {
          protocolVersion: '2025-11-21',
          hostInfo: { name: 'test-host', version: '1.0.0' },
          hostCapabilities: {},
          hostContext: {},
        },
      });
      env.clear();
    });

    describe('tool-input notification', () => {
      it('should dispatch render data when receiving tool-input', () => {
        env.receiveFromHost({
          jsonrpc: '2.0',
          method: 'ui/notifications/tool-input',
          params: { arguments: { query: 'test search' } },
        });

        const renderData = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-lifecycle-iframe-render-data'
        );

        expect(renderData).toBeDefined();
        expect(renderData?.payload?.renderData).toMatchObject({
          toolInput: { query: 'test search' },
        });
      });
    });

    describe('tool-result notification', () => {
      it('should dispatch render data when receiving tool-result', () => {
        env.receiveFromHost({
          jsonrpc: '2.0',
          method: 'ui/notifications/tool-result',
          params: { content: [{ type: 'text', text: 'Result data' }] },
        });

        const renderData = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-lifecycle-iframe-render-data'
        );

        expect(renderData).toBeDefined();
        expect(renderData?.payload?.renderData?.toolOutput).toBeDefined();
      });
    });

    describe('host-context-changed notification', () => {
      it('should update render data when theme changes', () => {
        env.receiveFromHost({
          jsonrpc: '2.0',
          method: 'ui/notifications/host-context-changed',
          params: { theme: 'dark', locale: 'en-US' },
        });

        const renderData = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-lifecycle-iframe-render-data'
        );

        expect(renderData).toBeDefined();
        expect(renderData?.payload?.renderData).toMatchObject({
          theme: 'dark',
          locale: 'en-US',
        });
      });
    });

    describe('resource-teardown request', () => {
      it('should dispatch teardown event and respond', () => {
        env.receiveFromHost({
          jsonrpc: '2.0',
          id: 999,
          method: 'ui/resource-teardown',
          params: {},
        });

        // Should dispatch teardown to iframe
        const teardown = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-lifecycle-teardown'
        );
        expect(teardown).toBeDefined();

        // Should send response back to host
        const response = env.sentToHost.find(
          (msg): msg is JsonRpcRequest => 'id' in msg && msg.id === 999
        );
        expect(response).toBeDefined();
      });
    });

    describe('tool-cancelled notification', () => {
      it('should dispatch cancellation event', () => {
        env.receiveFromHost({
          jsonrpc: '2.0',
          method: 'ui/notifications/tool-cancelled',
          params: { reason: 'user_cancelled' },
        });

        const cancelled = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-lifecycle-tool-cancelled'
        );

        expect(cancelled).toBeDefined();
        expect(cancelled?.payload?.reason).toBe('user_cancelled');
      });
    });
  });

  describe('Response Handling', () => {
    beforeEach(() => {
      initializeAdapter(env);
      // Complete initialization
      const initRequest = env.sentToHost.find(
        (msg): msg is JsonRpcRequest => 'id' in msg && msg.method === 'ui/initialize'
      );
      env.receiveFromHost({
        jsonrpc: '2.0',
        id: initRequest!.id,
        result: {
          protocolVersion: '2025-11-21',
          hostInfo: { name: 'test-host', version: '1.0.0' },
          hostCapabilities: {},
          hostContext: {},
        },
      });
      env.clear();
    });

    it('should forward successful response back to app', () => {
      // Send a tool call
      env.sendMcpUiMessage({
        type: 'tool',
        messageId: 'tool-req-1',
        payload: { toolName: 'test_tool', params: {} },
      });

      const toolRequest = env.sentToHost.find(
        (msg): msg is JsonRpcRequest => 'id' in msg && msg.method === 'tools/call'
      );
      
      env.dispatchedToIframe.length = 0;

      // Host sends success response
      env.receiveFromHost({
        jsonrpc: '2.0',
        id: toolRequest!.id,
        result: { data: 'success' },
      });

      const response = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-message-response'
      );

      expect(response).toBeDefined();
      expect(response?.payload?.messageId).toBe('tool-req-1');
      expect(response?.payload?.response).toEqual({ data: 'success' });
    });

    it('should forward error response back to app', () => {
      env.sendMcpUiMessage({
        type: 'link',
        messageId: 'link-req-1',
        payload: { url: 'https://blocked.com' },
      });

      const linkRequest = env.sentToHost.find(
        (msg): msg is JsonRpcRequest => 'id' in msg && msg.method === 'ui/open-link'
      );
      
      env.dispatchedToIframe.length = 0;

      // Host sends error response
      env.receiveFromHost({
        jsonrpc: '2.0',
        id: linkRequest!.id,
        error: { code: -32000, message: 'URL blocked by policy' },
      });

      const response = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-message-response'
      );

      expect(response).toBeDefined();
      expect(response?.payload?.messageId).toBe('link-req-1');
      expect(response?.payload?.error).toBeDefined();
    });
  });

  describe('Render Data Requests', () => {
    beforeEach(() => {
      initializeAdapter(env);
      // Complete initialization with context
      const initRequest = env.sentToHost.find(
        (msg): msg is JsonRpcRequest => 'id' in msg && msg.method === 'ui/initialize'
      );
      env.receiveFromHost({
        jsonrpc: '2.0',
        id: initRequest!.id,
        result: {
          protocolVersion: '2025-11-21',
          hostInfo: { name: 'test-host', version: '1.0.0' },
          hostCapabilities: {},
          hostContext: { theme: 'light', locale: 'en-US' },
        },
      });
      env.clear();
    });

    it('should respond to ui-request-render-data with current state', () => {
      // First set some tool input
      env.receiveFromHost({
        jsonrpc: '2.0',
        method: 'ui/notifications/tool-input',
        params: { arguments: { query: 'search term' } },
      });
      
      env.dispatchedToIframe.length = 0;

      // Now request render data
      env.sendMcpUiMessage({
        type: 'ui-request-render-data',
        messageId: 'render-req-1',
      });

      const renderData = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-lifecycle-iframe-render-data'
      );

      expect(renderData).toBeDefined();
      expect(renderData?.messageId).toBe('render-req-1');
      expect(renderData?.payload?.renderData).toMatchObject({
        toolInput: { query: 'search term' },
        theme: 'light',
        locale: 'en-US',
      });
    });
  });
});
