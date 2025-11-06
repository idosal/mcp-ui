type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type SafeArea = {
  insets: SafeAreaInsets;
};

type WidgetConfig = {
  widgetStateKey: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  toolResponseMetadata?: unknown;
  toolName?: string;
  theme?: string;
  locale?: string;
  userAgent?: unknown;
  model?: string;
  displayMode?: string;
  maxHeight?: number;
  safeArea?: SafeArea;
  capabilities?: Record<string, unknown>;
};

type WidgetGlobal = Window & {
  __MCP_WIDGET_CONFIG__?: WidgetConfig | null | undefined;
};

type OpenAIWidgetAPI = {
  toolInput: unknown;
  toolOutput: unknown;
  toolResponseMetadata: unknown;
  toolName: string | null;
  displayMode: string;
  maxHeight: number;
  theme: string;
  locale: string;
  safeArea: SafeArea;
  userAgent: unknown;
  capabilities: Record<string, unknown>;
  model: unknown;
  widgetState: unknown;
  setWidgetState(state: unknown): Promise<void>;
  callTool(toolName: string, params?: Record<string, unknown>): Promise<unknown>;
  sendFollowupTurn(message: unknown): Promise<void>;
  requestDisplayMode(options?: { mode?: string }): Promise<{ mode: string }>;
  sendFollowUpMessage(args: unknown): Promise<void>;
  openExternal(options: { href?: string } | string): Promise<void>;
};

const DEFAULT_SAFE_AREA: SafeArea = {
  insets: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

const DEFAULT_CAPABILITIES: Record<string, unknown> = {
  hover: true,
  touch: false,
};

const TOOL_CALL_TIMEOUT_MS = 30_000;

(function initializeOpenAIWidget() {
  const globalWindow = window as WidgetGlobal;
  const config = globalWindow.__MCP_WIDGET_CONFIG__;

  if (!config || typeof config !== 'object' || config.widgetStateKey == null) {
    console.warn('[OpenAI Widget] Missing widget configuration. Skipping initialization.');
    return;
  }

  const {
    widgetStateKey,
    toolInput = null,
    toolOutput = null,
    toolResponseMetadata = null,
    toolName = null,
    theme,
    locale,
    userAgent = null,
    model = null,
    displayMode,
    maxHeight,
    safeArea,
    capabilities,
  } = config;

  const resolvedDisplayMode = typeof displayMode === 'string' ? displayMode : 'inline';
  const resolvedMaxHeight = typeof maxHeight === 'number' ? maxHeight : 600;
  const resolvedTheme = typeof theme === 'string' ? theme : 'light';
  const resolvedLocale = typeof locale === 'string' ? locale : 'en-US';
  const resolvedSafeArea =
    safeArea && typeof safeArea === 'object'
      ? safeArea
      : DEFAULT_SAFE_AREA;
  const mergedCapabilities = {
    ...DEFAULT_CAPABILITIES,
    ...(typeof capabilities === 'object' && capabilities !== null ? capabilities : {}),
  };

  const openaiAPI: OpenAIWidgetAPI = {
    toolInput,
    toolOutput,
    toolResponseMetadata,
    toolName,
    displayMode: resolvedDisplayMode,
    maxHeight: resolvedMaxHeight,
    theme: resolvedTheme,
    locale: resolvedLocale,
    safeArea: resolvedSafeArea,
    userAgent,
    capabilities: mergedCapabilities,
    model,
    widgetState: null,

    async setWidgetState(state: unknown) {
      this.widgetState = state;
      try {
        localStorage.setItem(widgetStateKey, JSON.stringify(state));
      } catch (err) {
        console.error('[OpenAI Widget] Failed to save widget state:', err);
      }
      window.parent.postMessage(
        {
          type: 'openai:setWidgetState',
          state,
        },
        '*',
      );
    },

    async callTool(tool, params = {}) {
      return new Promise((resolve, reject) => {
        const requestId = `tool_${Date.now()}_${Math.random()}`;
        const handler = (event: MessageEvent) => {
          const data = event.data as {
            type?: string;
            requestId?: string;
            error?: string;
            result?: unknown;
          };
          if (data?.type === 'openai:callTool:response' && data?.requestId === requestId) {
            window.removeEventListener('message', handler);
            if (data.error) {
              reject(new Error(data.error));
            } else {
              resolve(data.result);
            }
          }
        };
        window.addEventListener('message', handler);
        window.parent.postMessage(
          {
            type: 'openai:callTool',
            requestId,
            toolName: tool,
            params,
          },
          '*',
        );
        setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('Tool call timeout'));
        }, TOOL_CALL_TIMEOUT_MS);
      });
    },

    async sendFollowupTurn(message) {
      const payload =
        typeof message === 'string'
          ? { prompt: message }
          : (message as { prompt?: unknown });
      const value = payload?.prompt ?? payload;
      window.parent.postMessage(
        {
          type: 'openai:sendFollowup',
          message: value,
        },
        '*',
      );
    },

    async requestDisplayMode(options = {}) {
      const mode = typeof options.mode === 'string' ? options.mode : this.displayMode || 'inline';
      this.displayMode = mode;
      window.parent.postMessage(
        {
          type: 'openai:requestDisplayMode',
          mode,
        },
        '*',
      );
      return { mode };
    },

    async sendFollowUpMessage(args) {
      const prompt =
        typeof args === 'string'
          ? args
          : (args as { prompt?: unknown })?.prompt ?? '';
      await this.sendFollowupTurn(prompt);
    },

    async openExternal(options) {
      const href =
        typeof options === 'string'
          ? options
          : options?.href;
      if (!href) {
        throw new Error('href is required for openExternal');
      }
      window.parent.postMessage(
        {
          type: 'openai:openExternal',
          href,
        },
        '*',
      );
      window.open(href, '_blank', 'noopener,noreferrer');
    },
  };

  if (openaiAPI.userAgent == null && typeof navigator !== 'undefined') {
    try {
      openaiAPI.userAgent = navigator.userAgent || '';
    } catch {
      openaiAPI.userAgent = '';
    }
  }

  Object.defineProperty(window, 'openai', {
    value: openaiAPI,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  Object.defineProperty(window, 'webplus', {
    value: openaiAPI,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  setTimeout(() => {
    try {
      const globalsEvent = new CustomEvent('webplus:set_globals', {
        detail: {
          globals: {
            displayMode: openaiAPI.displayMode,
            maxHeight: openaiAPI.maxHeight,
            theme: openaiAPI.theme,
            locale: openaiAPI.locale,
            safeArea: openaiAPI.safeArea,
            userAgent: openaiAPI.userAgent,
            capabilities: openaiAPI.capabilities,
          },
        },
      });
      window.dispatchEvent(globalsEvent);
    } catch {
      // ignore
    }
  }, 0);

  setTimeout(() => {
    try {
      const stored = localStorage.getItem(widgetStateKey);
      if (stored) {
        openaiAPI.widgetState = JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }, 0);

  try {
    delete globalWindow.__MCP_WIDGET_CONFIG__;
  } catch {
    globalWindow.__MCP_WIDGET_CONFIG__ = undefined;
  }
})();
