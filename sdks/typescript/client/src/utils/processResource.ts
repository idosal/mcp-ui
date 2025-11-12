import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import type { ClientContextProps, MCPContextProps } from '../types';
import { createOpenAiScript } from '../adapters/appssdk/open-ai-script';

type ProcessResourceResult = {
  error?: string;
  iframeSrc?: string;
  iframeRenderMode?: 'src' | 'srcDoc';
  htmlString?: string;
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
  mcp?: MCPContextProps;
  host?: ClientContextProps;
};

export function processHTMLResource(
  resource: Partial<Resource>,
  options: ProcessHTMLResourceOptions = {},
): ProcessResourceResult {
  const { proxy, mcp, host } = options;
  const toolName = mcp?.toolName;
  const toolInput = mcp?.toolInput;
  const toolOutput = mcp?.toolOutput;
  const toolResponseMetadata = mcp?.toolResponseMetadata;
  const theme = host?.theme;
  const locale = host?.locale;
  const userAgent = host?.userAgent;
  const model = host?.model;
  const displayMode = host?.displayMode;
  const maxHeight = host?.maxHeight;
  const safeArea = host?.safeArea;
  const capabilities = host?.capabilities;

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
        `<head$1>\n${createOpenAiScript({
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
          `<html$1><head>${createOpenAiScript({
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
