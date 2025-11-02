import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import type { ClientContextProps, MCPContextProps } from '../types';

const DEFAULT_SAFE_AREA = {
  insets: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

const DEFAULT_CAPABILITIES = {
  hover: true,
  touch: false,
};

type ProcessResourceResult = {
  error?: string;
  iframeSrc?: string;
  iframeRenderMode?: 'src' | 'srcDoc';
  htmlString?: string;
};

type ApiScriptOptions = {
  widgetStateKey: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  toolResponseMetadata?: Record<string, unknown>;
  toolName?: string;
  theme?: string;
  locale?: string;
  userAgent?: unknown;
  model?: string;
  displayMode?: string;
  maxHeight?: number;
  safeArea?: ClientContextProps['safeArea'];
  capabilities?: ClientContextProps['capabilities'];
};

const apiScript = ({
  widgetStateKey,
  toolInput,
  toolOutput,
  toolResponseMetadata,
  toolName,
  theme,
  locale,
  userAgent,
  model,
  displayMode,
  maxHeight,
  safeArea,
  capabilities,
}: ApiScriptOptions) => {
  const resolvedDisplayMode = displayMode ?? 'inline';
  const resolvedMaxHeight = typeof maxHeight === 'number' ? maxHeight : 600;
  const resolvedTheme = theme ?? 'light';
  const resolvedLocale = locale ?? 'en-US';
  const resolvedSafeArea = safeArea ?? DEFAULT_SAFE_AREA;
  const mergedCapabilities = {
    ...DEFAULT_CAPABILITIES,
    ...(capabilities ?? {}),
  };

  const serializedToolInput = JSON.stringify(toolInput ?? null);
  const serializedToolOutput = JSON.stringify(toolOutput ?? null);
  const serializedToolResponseMetadata = JSON.stringify(toolResponseMetadata ?? null);
  const serializedToolName = JSON.stringify(toolName ?? null);
  const serializedTheme = JSON.stringify(resolvedTheme);
  const serializedLocale = JSON.stringify(resolvedLocale);
  const serializedSafeArea = JSON.stringify(resolvedSafeArea);
  const serializedUserAgent = JSON.stringify(userAgent ?? null);
  const serializedModel = JSON.stringify(model ?? null);
  const serializedCapabilities = JSON.stringify(mergedCapabilities);
  const serializedDisplayMode = JSON.stringify(resolvedDisplayMode);

  return `
<script>
  (function() {
    'use strict';

    const openaiAPI = {
      toolInput: ${serializedToolInput},
      toolOutput: ${serializedToolOutput},
      toolResponseMetadata: ${serializedToolResponseMetadata},
      toolName: ${serializedToolName},
      displayMode: ${serializedDisplayMode},
      maxHeight: ${resolvedMaxHeight},
      theme: ${serializedTheme},
      locale: ${serializedLocale},
      safeArea: ${serializedSafeArea},
      userAgent: ${serializedUserAgent},
      capabilities: ${serializedCapabilities},
      model: ${serializedModel},
      widgetState: null,

      async setWidgetState(state) {
        this.widgetState = state;
        try {
          localStorage.setItem(${JSON.stringify(
            widgetStateKey
          )}, JSON.stringify(state));
        } catch (err) {
          console.error('[OpenAI Widget] Failed to save widget state:', err);
        }
        window.parent.postMessage({
          type: 'openai:setWidgetState',
          state
        }, '*');
      },

      async callTool(toolName, params = {}) {
        return new Promise((resolve, reject) => {
          const requestId = \`tool_\${Date.now()}_\${Math.random()}\`;
          const handler = (event) => {
            if (event.data.type === 'openai:callTool:response' &&
                event.data.requestId === requestId) {
              window.removeEventListener('message', handler);
              if (event.data.error) {
                reject(new Error(event.data.error));
              } else {
                resolve(event.data.result);
              }
            }
          };
          window.addEventListener('message', handler);
          window.parent.postMessage({
            type: 'openai:callTool',
            requestId,
            toolName,
            params
          }, '*');
          setTimeout(() => {
            window.removeEventListener('message', handler);
            reject(new Error('Tool call timeout'));
          }, 30000);
        });
      },

      async sendFollowupTurn(message) {
        const payload = typeof message === 'string'
          ? { prompt: message }
          : message;
        window.parent.postMessage({
          type: 'openai:sendFollowup',
          message: payload.prompt || payload
        }, '*');
      },

      async requestDisplayMode(options = {}) {
        const mode = options.mode || this.displayMode || 'inline';
        this.displayMode = mode;
        window.parent.postMessage({
          type: 'openai:requestDisplayMode',
          mode
        }, '*');
        return { mode };
      },

      async sendFollowUpMessage(args) {
        const prompt = typeof args === 'string' ? args : (args?.prompt || '');
        return this.sendFollowupTurn(prompt);
      },

      async openExternal(options) {
        const href = typeof options === 'string' ? options : options?.href;
        if (!href) {
          throw new Error('href is required for openExternal');
        }
        window.parent.postMessage({
          type: 'openai:openExternal',
          href
        }, '*');
        // Also open in new tab as fallback
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    };

    if (openaiAPI.userAgent == null && typeof navigator !== 'undefined') {
      try {
        openaiAPI.userAgent = navigator.userAgent || '';
      } catch (err) {
        openaiAPI.userAgent = '';
      }
    }

    Object.defineProperty(window, 'openai', {
      value: openaiAPI,
      writable: false,
      configurable: false,
      enumerable: true
    });

    Object.defineProperty(window, 'webplus', {
      value: openaiAPI,
      writable: false,
      configurable: false,
      enumerable: true
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
              capabilities: openaiAPI.capabilities
            }
          }
        });
        window.dispatchEvent(globalsEvent);
      } catch (err) {}
    }, 0);

    setTimeout(() => {
      try {
        const stored = localStorage.getItem(${JSON.stringify(widgetStateKey)});
        if (stored && window.openai) {
          window.openai.widgetState = JSON.parse(stored);
        }
      } catch (err) {}
    }, 0);
  })();
</script>
`;
};

function isValidHttpUrl(string: string): boolean {
  let url;
  try {
    url = new URL(string);
  } catch (e) {
    console.error('Error parsing URL:', e);
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

export type ProcessHTMLResourceOptions = {
  proxy?: string;
  initialRenderData?: Record<string, unknown>;
  mcpContextProps?: MCPContextProps;
  clientContextProps?: ClientContextProps;
};

export function processHTMLResource(
  resource: Partial<Resource>,
  options: ProcessHTMLResourceOptions = {},
): ProcessResourceResult {
  const { proxy, initialRenderData, mcpContextProps, clientContextProps } = options;
  const toolName = mcpContextProps?.toolName;
  const toolInput = mcpContextProps?.toolInput;
  const toolOutput = mcpContextProps?.toolOutput ?? initialRenderData;
  const toolResponseMetadata = mcpContextProps?.toolResponseMetadata;
  const theme = clientContextProps?.theme;
  const locale = clientContextProps?.locale;
  const userAgent = clientContextProps?.userAgent;
  const model = clientContextProps?.model;
  const displayMode = clientContextProps?.displayMode;
  const maxHeight = clientContextProps?.maxHeight;
  const safeArea = clientContextProps?.safeArea;
  const capabilities = clientContextProps?.capabilities;

  if (
    resource.mimeType !== 'text/html' &&
    resource.mimeType !== 'text/html+skybridge' &&
    resource.mimeType !== 'text/uri-list'
  ) {
    return {
      error:
        'Resource must be of type text/html (for HTML content), text/html+skybridge, or text/uri-list (for URL content).',
    };
  }

  if (resource.mimeType === 'text/uri-list') {
    // Handle URL content (external apps)
    // Note: While text/uri-list format supports multiple URLs, MCP-UI requires a single URL.
    // If multiple URLs are provided, only the first will be used and others will be logged as warnings.
    let urlContent = '';

    if (typeof resource.text === 'string' && resource.text.trim() !== '') {
      urlContent = resource.text;
    } else if (typeof resource.blob === 'string') {
      try {
        urlContent = new TextDecoder().decode(
          Uint8Array.from(atob(resource.blob), (c) => c.charCodeAt(0)),
        );
      } catch (e) {
        console.error('Error decoding base64 blob for URL content:', e);
        return {
          error: 'Error decoding URL from blob.',
        };
      }
    } else {
      return {
        error: 'URL resource expects a non-empty text or blob field containing the URL.',
      };
    }

    if (urlContent.trim() === '') {
      return {
        error: 'URL content is empty.',
      };
    }

    // Parse uri-list format: URIs separated by newlines, comments start with #
    // MCP-UI requires a single URL - if multiple are found, use first and warn about others
    const lines = urlContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && isValidHttpUrl(line));

    if (lines.length === 0) {
      return {
        error: 'No valid URLs found in uri-list content.',
      };
    }

    if (lines.length > 1) {
      console.warn(
        `Multiple URLs found in uri-list content. Using the first URL: "${lines[0]}". Other URLs ignored:`,
        lines.slice(1)
      );
    }

    const originalUrl = lines[0];

    if (proxy && proxy.trim() !== '') {
      try {
        const proxyUrl = new URL(proxy);
        // The proxy host MUST NOT be the host URL, or the proxy can escape the sandbox
        if (
          typeof window !== 'undefined' &&
          proxyUrl.host === window.location.host
        ) {
          console.error(
            'For security, the proxy origin must not be the same as the host origin. Using original URL instead.'
          );
        } else {
          proxyUrl.searchParams.set('url', originalUrl);
          return {
            iframeSrc: proxyUrl.toString(),
            iframeRenderMode: 'src',
          };
        }
      } catch (e: unknown) {
        console.error(
          `Invalid proxy URL provided: "${proxy}". Falling back to direct URL.`,
          e instanceof Error ? e.message : String(e)
        );
      }
    }

    return {
      iframeSrc: originalUrl,
      iframeRenderMode: 'src',
    };
  } else if (
    resource.mimeType === 'text/html' ||
    resource.mimeType === 'text/html+skybridge'
  ) {
    // Handle HTML content
    let htmlContent = '';

    if (typeof resource.text === 'string') {
      htmlContent = resource.text;
    } else if (typeof resource.blob === 'string') {
      try {
        htmlContent = new TextDecoder().decode(
          Uint8Array.from(atob(resource.blob), (c) => c.charCodeAt(0))
        );
      } catch (e) {
        console.error('Error decoding base64 blob for HTML content:', e);
        return {
          error: 'Error decoding HTML content from blob.',
        };
      }
    } else {
      return {
        error: 'HTML resource requires text or blob content.',
      };
    }

    if (resource.mimeType === 'text/html+skybridge') {
      const widgetStateKey = `openai-widget-state:${toolName ?? ''}:`;
      htmlContent = htmlContent.replace(
        /<head([^>]*)>/i,
        `<head$1>\n${apiScript({
          widgetStateKey,
          toolInput,
          toolOutput,
          toolResponseMetadata,
          toolName,
          theme,
          locale,
          userAgent,
          model,
          displayMode,
          maxHeight,
          safeArea,
          capabilities,
        })}\n`,
      );
      if (!/<head[^>]*>/i.test(htmlContent)) {
        htmlContent = htmlContent.replace(
          /<html([^>]*)>/i,
          `<html$1><head>${apiScript({
            widgetStateKey,
            toolInput,
            toolOutput,
            toolResponseMetadata,
            toolName,
            theme,
            locale,
            userAgent,
            model,
            displayMode,
            maxHeight,
            safeArea,
            capabilities,
          })}</head>`,
        );
      }
    }

    if (proxy && proxy.trim() !== '') {
      try {
        const proxyUrl = new URL(proxy);
        // The proxy host MUST NOT be the host URL, or the proxy can escape the sandbox
        if (
          typeof window !== 'undefined' &&
          proxyUrl.host === window.location.host
        ) {
          console.error(
            'For security, the proxy origin must not be the same as the host origin. Using srcDoc rendering instead.'
          );
        } else {
          proxyUrl.searchParams.set('contentType', 'rawhtml');
          return {
            iframeSrc: proxyUrl.toString(),
            iframeRenderMode: 'src',
            htmlString: htmlContent, // Pass HTML so it can be sent to the proxy via postMessage
          };
        }
      } catch (e: unknown) {
        console.error(
          `Invalid proxy URL provided: "${proxy}". Falling back to srcDoc rendering.`,
          e instanceof Error ? e.message : String(e)
        );
      }
    }

    return {
      htmlString: htmlContent,
      iframeRenderMode: 'srcDoc',
    };
  } else {
    return {
      error:
        'Unsupported mimeType. Expected text/html, text/html+skybridge, or text/uri-list.',
    };
  }
}

type ProcessRemoteDOMResourceResult = {
  error?: string;
  code?: string;
};

export function processRemoteDOMResource(
  resource: Partial<Resource>
): ProcessRemoteDOMResourceResult {
  if (typeof resource.text === 'string' && resource.text.trim() !== '') {
    return {
      code: resource.text,
    };
  }

  if (typeof resource.blob === 'string') {
    try {
      const decodedCode = new TextDecoder().decode(
        Uint8Array.from(atob(resource.blob), (c) => c.charCodeAt(0))
      );
      return {
        code: decodedCode,
      };
    } catch (e) {
      console.error('Error decoding base64 blob for remote DOM content:', e);
      return {
        error: 'Error decoding remote DOM content from blob.',
      };
    }
  }

  return {
    error: 'Remote DOM resource requires non-empty text or blob content.',
  };
}
