/**
 * Behavioral tests for the Apps SDK Adapter Runtime
 * 
 * These tests verify the actual message translation behavior by:
 * 1. Setting up a simulated Apps SDK environment (window.openai)
 * 2. Running the adapter code
 * 3. Sending MCP-UI messages and verifying Apps SDK API calls
 * 4. Verifying responses dispatched back to the widget
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAppsSdkAdapterScript } from '../../adapters/appssdk/adapter';
import type { AppsSdkAdapterConfig } from '../../adapters/appssdk/types';

// Types for test clarity
interface ErrorPayload {
  message: string;
  name?: string;
}

interface McpUiMessage {
  type: string;
  messageId?: string;
  payload?: {
    messageId?: string;
    response?: unknown;
    error?: ErrorPayload;
    renderData?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

interface MockOpenAI {
  callTool: ReturnType<typeof vi.fn>;
  sendFollowUpMessage: ReturnType<typeof vi.fn>;
  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
  widgetState?: unknown;
  locale?: string;
  theme?: string;
  displayMode?: string;
  maxHeight?: number;
}

/**
 * Creates a test environment that simulates the Apps SDK (ChatGPT) context
 */
function createTestEnvironment() {
  const dispatchedToIframe: McpUiMessage[] = [];
  const originalWindow = globalThis.window;

  // Create mock Apps SDK (window.openai)
  const mockOpenAI: MockOpenAI = {
    callTool: vi.fn(),
    sendFollowUpMessage: vi.fn(),
    toolInput: undefined,
    toolOutput: undefined,
    widgetState: undefined,
    locale: 'en-US',
    theme: 'light',
    displayMode: 'inline',
    maxHeight: undefined,
  };

  // Create mock parent postMessage
  const mockParentPostMessage = vi.fn();

  // Event listeners storage
  const eventListeners: Map<string, Set<(e: Event) => void>> = new Map();

  // Create mock window object
  const mockWindow = {
    openai: mockOpenAI,
    parent: {
      postMessage: mockParentPostMessage,
    },
    location: { origin: 'https://test.example.com' },
    addEventListener: vi.fn((event: string, handler: (e: Event) => void) => {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, new Set());
      }
      eventListeners.get(event)!.add(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: (e: Event) => void) => {
      eventListeners.get(event)?.delete(handler);
    }),
    dispatchEvent: vi.fn((event: Event) => {
      if (event instanceof MessageEvent && event.data && typeof event.data === 'object' && 'type' in event.data) {
        dispatchedToIframe.push(event.data as McpUiMessage);
      }
      // Also trigger registered listeners
      const listeners = eventListeners.get(event.type);
      if (listeners) {
        for (const listener of listeners) {
          listener(event);
        }
      }
      return true;
    }),
    MessageEvent: class MockMessageEvent extends Event {
      data: unknown;
      origin: string;
      source: unknown;
      constructor(type: string, init: { data: unknown; origin: string; source: unknown }) {
        super(type);
        this.data = init.data;
        this.origin = init.origin;
        this.source = init.source;
      }
    },
  };

  // Install mock window
  (globalThis as unknown as { window: typeof mockWindow }).window = mockWindow;

  return {
    dispatchedToIframe,
    mockOpenAI,
    mockParentPostMessage,

    /** Simulate sending an MCP-UI message (like widget would via postMessage) */
    sendMcpUiMessage(message: McpUiMessage) {
      // The adapter patches parent.postMessage, so we call it
      mockWindow.parent.postMessage(message, '*');
    },

    /** Trigger the openai:set_globals event to simulate Apps SDK data update */
    triggerGlobalsUpdate() {
      const event = new Event('openai:set_globals');
      mockWindow.dispatchEvent(event);
    },

    /** Update mock openai properties */
    setOpenAIData(data: Partial<MockOpenAI>) {
      Object.assign(mockOpenAI, data);
    },

    /** Clear captured messages */
    clear() {
      dispatchedToIframe.length = 0;
      mockOpenAI.callTool.mockClear();
      mockOpenAI.sendFollowUpMessage.mockClear();
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
function initializeAdapter(env: ReturnType<typeof createTestEnvironment>, config: AppsSdkAdapterConfig = {}) {
  const script = getAppsSdkAdapterScript(config);
  const jsCode = script.replace(/<\/?script>/gi, '');
  
  // Execute the adapter code
  const fn = new Function(jsCode);
  fn();
  
  return env;
}

describe('Apps SDK Adapter - Behavioral Tests', () => {
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
    it('should not activate if window.openai is not present', () => {
      // Remove openai from mock window
      (env.window as unknown as { openai: undefined }).openai = undefined;
      
      initializeAdapter(env);
      
      // Should not dispatch any render data since adapter didn't activate
      expect(env.dispatchedToIframe.length).toBe(0);
    });

    it('should send initial render data on initialization', () => {
      env.setOpenAIData({
        toolInput: { query: 'initial input' },
        theme: 'dark',
        locale: 'fr-FR',
      });

      initializeAdapter(env);

      const renderData = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-lifecycle-iframe-render-data'
      );

      expect(renderData).toBeDefined();
      expect(renderData?.payload?.renderData).toMatchObject({
        toolInput: { query: 'initial input' },
        theme: 'dark',
        locale: 'fr-FR',
      });
    });
  });

  describe('MCP-UI to Apps SDK Translation', () => {
    beforeEach(() => {
      initializeAdapter(env);
      env.clear();
    });

    describe('tool message', () => {
      it('should call window.openai.callTool with correct arguments', async () => {
        env.mockOpenAI.callTool.mockResolvedValue({ result: 'success' });

        env.sendMcpUiMessage({
          type: 'tool',
          messageId: 'tool-1',
          payload: {
            toolName: 'get_weather',
            params: { city: 'San Francisco' },
          },
        });

        // Advance timers to allow async handling
        await vi.runAllTimersAsync();

        expect(env.mockOpenAI.callTool).toHaveBeenCalledWith(
          'get_weather',
          { city: 'San Francisco' }
        );
      });

      it('should send acknowledgment for tool message', () => {
        env.mockOpenAI.callTool.mockResolvedValue({ result: 'success' });

        env.sendMcpUiMessage({
          type: 'tool',
          messageId: 'tool-ack-1',
          payload: { toolName: 'test_tool', params: {} },
        });

        const ack = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-message-received'
        );

        expect(ack).toBeDefined();
        expect(ack?.payload?.messageId).toBe('tool-ack-1');
      });

      it('should send success response when tool call succeeds', async () => {
        env.mockOpenAI.callTool.mockResolvedValue({ data: 'tool result' });

        env.sendMcpUiMessage({
          type: 'tool',
          messageId: 'tool-success-1',
          payload: { toolName: 'test_tool', params: {} },
        });

        await vi.runAllTimersAsync();

        const response = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-message-response' && msg.payload?.messageId === 'tool-success-1'
        );

        expect(response).toBeDefined();
        expect(response?.payload?.response).toEqual({ data: 'tool result' });
        expect(response?.payload?.error).toBeUndefined();
      });

      it('should send error response when tool call fails', async () => {
        env.mockOpenAI.callTool.mockRejectedValue(new Error('Tool not found'));

        env.sendMcpUiMessage({
          type: 'tool',
          messageId: 'tool-error-1',
          payload: { toolName: 'nonexistent', params: {} },
        });

        await vi.runAllTimersAsync();

        const response = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-message-response' && msg.payload?.messageId === 'tool-error-1'
        );

        expect(response).toBeDefined();
        expect(response?.payload?.error).toBeDefined();
        expect(response?.payload?.error?.message).toContain('Tool not found');
      });

      it('should send error when callTool is not available', async () => {
        env.mockOpenAI.callTool = undefined as unknown as ReturnType<typeof vi.fn>;

        env.sendMcpUiMessage({
          type: 'tool',
          messageId: 'tool-unsupported-1',
          payload: { toolName: 'test', params: {} },
        });

        await vi.runAllTimersAsync();

        const response = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-message-response' && msg.payload?.messageId === 'tool-unsupported-1'
        );

        expect(response?.payload?.error?.message).toContain('not supported');
      });
    });

    describe('prompt message', () => {
      it('should call window.openai.sendFollowUpMessage with prompt', async () => {
        env.mockOpenAI.sendFollowUpMessage.mockResolvedValue(undefined);

        env.sendMcpUiMessage({
          type: 'prompt',
          messageId: 'prompt-1',
          payload: { prompt: 'What is the weather today?' },
        });

        await vi.runAllTimersAsync();

        expect(env.mockOpenAI.sendFollowUpMessage).toHaveBeenCalledWith({
          prompt: 'What is the weather today?',
        });
      });

      it('should send success response when prompt succeeds', async () => {
        env.mockOpenAI.sendFollowUpMessage.mockResolvedValue(undefined);

        env.sendMcpUiMessage({
          type: 'prompt',
          messageId: 'prompt-success-1',
          payload: { prompt: 'Hello' },
        });

        await vi.runAllTimersAsync();

        const response = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-message-response' && msg.payload?.messageId === 'prompt-success-1'
        );

        expect(response).toBeDefined();
        expect(response?.payload?.response).toEqual({ success: true });
      });

      it('should send error when sendFollowUpMessage is not available', async () => {
        env.mockOpenAI.sendFollowUpMessage = undefined as unknown as ReturnType<typeof vi.fn>;

        env.sendMcpUiMessage({
          type: 'prompt',
          messageId: 'prompt-unsupported-1',
          payload: { prompt: 'test' },
        });

        await vi.runAllTimersAsync();

        const response = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-message-response' && msg.payload?.messageId === 'prompt-unsupported-1'
        );

        expect(response?.payload?.error?.message).toContain('not supported');
      });
    });

    describe('intent message', () => {
      it('should convert intent to sendFollowUpMessage by default', async () => {
        env.mockOpenAI.sendFollowUpMessage.mockResolvedValue(undefined);

        env.sendMcpUiMessage({
          type: 'intent',
          messageId: 'intent-1',
          payload: {
            intent: 'navigate_to',
            params: { page: 'settings' },
          },
        });

        await vi.runAllTimersAsync();

        expect(env.mockOpenAI.sendFollowUpMessage).toHaveBeenCalled();
        const call = env.mockOpenAI.sendFollowUpMessage.mock.calls[0][0];
        expect(call.prompt).toContain('navigate_to');
        expect(call.prompt).toContain('settings');
      });

      it('should ignore intent when intentHandling is "ignore"', async () => {
        // Reinitialize with ignore config
        env.restore();
        env = createTestEnvironment();
        initializeAdapter(env, { intentHandling: 'ignore' });
        env.clear();

        env.sendMcpUiMessage({
          type: 'intent',
          messageId: 'intent-ignore-1',
          payload: { intent: 'test_intent', params: {} },
        });

        await vi.runAllTimersAsync();

        expect(env.mockOpenAI.sendFollowUpMessage).not.toHaveBeenCalled();

        const response = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-message-response' && msg.payload?.messageId === 'intent-ignore-1'
        );

        expect(response?.payload?.response).toEqual({ ignored: true });
      });
    });

    describe('notify message', () => {
      it('should acknowledge notify message', async () => {
        env.sendMcpUiMessage({
          type: 'notify',
          messageId: 'notify-1',
          payload: { message: 'Operation completed' },
        });

        await vi.runAllTimersAsync();

        const ack = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-message-received' && msg.payload?.messageId === 'notify-1'
        );

        expect(ack).toBeDefined();
      });

      it('should send success response for notify', async () => {
        env.sendMcpUiMessage({
          type: 'notify',
          messageId: 'notify-success-1',
          payload: { message: 'Test notification' },
        });

        await vi.runAllTimersAsync();

        const response = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-message-response' && msg.payload?.messageId === 'notify-success-1'
        );

        expect(response?.payload?.response).toEqual({ acknowledged: true });
      });
    });

    describe('link message', () => {
      it('should return error for link message (not supported in Apps SDK)', async () => {
        env.sendMcpUiMessage({
          type: 'link',
          messageId: 'link-1',
          payload: { url: 'https://example.com' },
        });

        await vi.runAllTimersAsync();

        const response = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-message-response' && msg.payload?.messageId === 'link-1'
        );

        expect(response?.payload?.error).toBeDefined();
        expect(response?.payload?.error?.message).toContain('not supported');
      });
    });

    describe('ui-lifecycle-iframe-ready message', () => {
      it('should send render data when iframe signals ready', () => {
        env.setOpenAIData({
          toolInput: { test: 'data' },
          theme: 'dark',
        });
        env.clear();

        env.sendMcpUiMessage({
          type: 'ui-lifecycle-iframe-ready',
        });

        const renderData = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-lifecycle-iframe-render-data'
        );

        expect(renderData).toBeDefined();
        expect(renderData?.payload?.renderData?.toolInput).toEqual({ test: 'data' });
        expect(renderData?.payload?.renderData?.theme).toBe('dark');
      });
    });

    describe('ui-request-render-data message', () => {
      it('should respond with current render data including messageId', () => {
        env.setOpenAIData({
          toolOutput: { result: 'some data' },
          locale: 'de-DE',
        });
        env.clear();

        env.sendMcpUiMessage({
          type: 'ui-request-render-data',
          messageId: 'render-req-1',
        });

        const renderData = env.dispatchedToIframe.find(
          msg => msg.type === 'ui-lifecycle-iframe-render-data'
        );

        expect(renderData).toBeDefined();
        expect(renderData?.messageId).toBe('render-req-1');
        expect(renderData?.payload?.renderData?.toolOutput).toEqual({ result: 'some data' });
        expect(renderData?.payload?.renderData?.locale).toBe('de-DE');
      });
    });
  });

  describe('Apps SDK Events', () => {
    beforeEach(() => {
      initializeAdapter(env);
      env.clear();
    });

    it('should send updated render data when openai:set_globals fires', () => {
      // Update the mock data
      env.setOpenAIData({
        toolInput: { newQuery: 'updated' },
        theme: 'dark',
      });

      // Trigger the globals update event
      env.triggerGlobalsUpdate();

      const renderData = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-lifecycle-iframe-render-data'
      );

      expect(renderData).toBeDefined();
      expect(renderData?.payload?.renderData?.toolInput).toEqual({ newQuery: 'updated' });
      expect(renderData?.payload?.renderData?.theme).toBe('dark');
    });
  });

  describe('Render Data Contents', () => {
    it('should include all Apps SDK properties in render data', () => {
      env.setOpenAIData({
        toolInput: { input: 'test' },
        toolOutput: { output: 'result' },
        widgetState: { key: 'value' },
        locale: 'ja-JP',
        theme: 'dark',
        displayMode: 'fullscreen',
        maxHeight: 500,
      });

      initializeAdapter(env);

      const renderData = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-lifecycle-iframe-render-data'
      );

      expect(renderData?.payload?.renderData).toEqual({
        toolInput: { input: 'test' },
        toolOutput: { output: 'result' },
        widgetState: { key: 'value' },
        locale: 'ja-JP',
        theme: 'dark',
        displayMode: 'fullscreen',
        maxHeight: 500,
      });
    });

    it('should use defaults for missing Apps SDK properties', () => {
      // Only set minimal data
      env.setOpenAIData({
        toolInput: undefined,
        toolOutput: undefined,
        widgetState: undefined,
        locale: undefined,
        theme: undefined,
        displayMode: undefined,
        maxHeight: undefined,
      });

      initializeAdapter(env);

      const renderData = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-lifecycle-iframe-render-data'
      );

      expect(renderData?.payload?.renderData).toMatchObject({
        locale: 'en-US',
        theme: 'light',
        displayMode: 'inline',
      });
    });
  });

  describe('Timeout Handling', () => {
    beforeEach(() => {
      initializeAdapter(env, { timeout: 1000 });
      env.clear();
    });

    it('should timeout tool calls that take too long', async () => {
      // Make callTool never resolve
      env.mockOpenAI.callTool.mockImplementation(() => new Promise(() => {}));

      env.sendMcpUiMessage({
        type: 'tool',
        messageId: 'tool-timeout-1',
        payload: { toolName: 'slow_tool', params: {} },
      });

      // Advance past the timeout
      await vi.advanceTimersByTimeAsync(1500);

      const response = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-message-response' && msg.payload?.messageId === 'tool-timeout-1'
      );

      expect(response?.payload?.error?.message).toContain('timed out');
    });

    it('should timeout prompt calls that take too long', async () => {
      // Make sendFollowUpMessage never resolve
      env.mockOpenAI.sendFollowUpMessage.mockImplementation(() => new Promise(() => {}));

      env.sendMcpUiMessage({
        type: 'prompt',
        messageId: 'prompt-timeout-1',
        payload: { prompt: 'slow prompt' },
      });

      // Advance past the timeout
      await vi.advanceTimersByTimeAsync(1500);

      const response = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-message-response' && msg.payload?.messageId === 'prompt-timeout-1'
      );

      expect(response?.payload?.error?.message).toContain('timed out');
    });
  });

  describe('Configuration', () => {
    it('should use custom hostOrigin in dispatched events', () => {
      env.restore();
      env = createTestEnvironment();
      initializeAdapter(env, { hostOrigin: 'https://custom-origin.com' });

      // The render data should be dispatched - we verify initialization worked
      const renderData = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-lifecycle-iframe-render-data'
      );

      expect(renderData).toBeDefined();
    });

    it('should use custom timeout value', async () => {
      env.restore();
      env = createTestEnvironment();
      initializeAdapter(env, { timeout: 500 });
      env.clear();

      env.mockOpenAI.callTool.mockImplementation(() => new Promise(() => {}));

      env.sendMcpUiMessage({
        type: 'tool',
        messageId: 'custom-timeout-1',
        payload: { toolName: 'test', params: {} },
      });

      // Should not timeout at 400ms
      await vi.advanceTimersByTimeAsync(400);
      let response = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-message-response' && msg.payload?.error
      );
      expect(response).toBeUndefined();

      // Should timeout at 600ms (past 500ms timeout)
      await vi.advanceTimersByTimeAsync(200);
      response = env.dispatchedToIframe.find(
        msg => msg.type === 'ui-message-response' && msg.payload?.error
      );
      expect(response?.payload?.error?.message).toContain('timed out');
    });
  });
});
