import React, { useEffect, useRef, useState } from 'react';
import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import DOMPurify from 'dompurify';


export interface RenderHtmlResourceProps {
  resource: Partial<Resource>;
  onUiAction?: (result: UiActionResult) => Promise<unknown>;
  style?: React.CSSProperties;
  /**
   * Choose how the HTML should be rendered. Defaults to `iframe`.
   * `secure` renders sanitized HTML directly without an iframe.
   */
  renderMode?: 'iframe' | 'secure';
}

export const HtmlResource: React.FC<RenderHtmlResourceProps> = ({
  resource,
  onUiAction,
  style,
  renderMode = 'iframe',
}) => {
  const [htmlString, setHtmlString] = useState<string | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [iframeRenderMode, setIframeRenderMode] = useState<'srcDoc' | 'src'>(
    'srcDoc',
  );
  const [secureHtml, setSecureHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const secureContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const processResource = async () => {
      setIsLoading(true);
      setError(null);
      setHtmlString(null);
      setIframeSrc(null);
      setSecureHtml(null);
      setIframeRenderMode('srcDoc'); // Default to srcDoc

      // Backwards compatibility: if URI starts with ui-app://, treat as URL content
      const isLegacyExternalApp = typeof resource.uri === 'string' && resource.uri.startsWith('ui-app://');
      const effectiveMimeType = isLegacyExternalApp ? 'text/uri-list' : resource.mimeType;

      if (effectiveMimeType !== 'text/html' && effectiveMimeType !== 'text/uri-list') {
        setError('Resource must be of type text/html (for HTML content) or text/uri-list (for URL content).');
        setIsLoading(false);
        return;
      }


      if (renderMode === 'secure') {
        if (
          resource.uri &&
          !resource.uri.startsWith('ui://') &&
          !resource.uri.startsWith('data:')
        ) {
          setError('Secure renderer only supports inline ui:// HTML content.');
          setIsLoading(false);
          return;
        }

        let html = '';
        if (typeof resource.text === 'string') {
          html = resource.text;
        } else if (typeof resource.blob === 'string') {
          try {
            html = new TextDecoder().decode(
              Uint8Array.from(atob(resource.blob), (c) => c.charCodeAt(0)),
            );
          } catch (e) {
            console.error('Error decoding base64 blob for HTML content:', e);
            setError('Error decoding HTML content from blob.');
            setIsLoading(false);
            return;
          }
        } else {
          setError('Secure renderer requires text or blob HTML content.');
          setIsLoading(false);
          return;
        }

        setSecureHtml(DOMPurify.sanitize(html));
        setIsLoading(false);
        return;
      }

      if (resource.uri?.startsWith('ui-app://')) {
        setIframeRenderMode('src');
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
            setError('Error decoding URL from blob.');
            setIsLoading(false);
            return;
          }
        } else {
          setError(
            'URL resource expects a non-empty text or blob field containing the URL.',
          );
          setIsLoading(false);
          return;
        }

        if (urlContent.trim() === '') {
          setError('URL content is empty.');
          setIsLoading(false);
          return;
        }

        // Parse uri-list format: URIs separated by newlines, comments start with #
        // MCP-UI requires a single URL - if multiple are found, use first and warn about others
        const lines = urlContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
        
        if (lines.length === 0) {
          setError('No valid URLs found in uri-list content.');
          setIsLoading(false);
          return;
        }

        if (lines.length > 1) {
          console.warn(`Multiple URLs found in uri-list content. Using the first URL: "${lines[0]}". Other URLs ignored:`, lines.slice(1));
        }

        setIframeSrc(lines[0]);

        // Log backwards compatibility usage
        if (isLegacyExternalApp) {
          console.warn(`Detected legacy ui-app:// URI: "${resource.uri}". Update server to use ui:// with mimeType: 'text/uri-list' for future compatibility.`);
        }
      } else if (effectiveMimeType === 'text/html') {
        // Handle HTML content
        setIframeRenderMode('srcDoc');
        if (typeof resource.text === 'string') {
          setHtmlString(resource.text);
        } else if (typeof resource.blob === 'string') {
          try {
            const decodedHtml = new TextDecoder().decode(
              Uint8Array.from(atob(resource.blob), (c) => c.charCodeAt(0)),
            );
            setHtmlString(decodedHtml);
          } catch (e) {
            console.error('Error decoding base64 blob for HTML content:', e);
            setError('Error decoding HTML content from blob.');
          }
        } else {
          setError('HTML resource requires text or blob content.');
        }
      } else {
        setError(
          'Unsupported mimeType. Expected text/html or text/uri-list.',
        );
      }
      setIsLoading(false);
    };

    processResource();
  }, [resource, renderMode]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Only process the message if it came from this specific iframe
      if (
        iframeRef.current &&
        event.source === iframeRef.current.contentWindow
      ) {
        const uiActionResult = event.data as UiActionResult;
        if (!uiActionResult) {
          return;
        }
        onUiAction?.(uiActionResult)?.catch((err) => {
          console.error(
            'Error handling UI action result in RenderHtmlResource:',
            err,
          );
        });
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUiAction]);

  useEffect(() => {
    if (renderMode !== 'secure' || !onUiAction) return;

    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tool = target.getAttribute('data-tool');
      if (tool) {
        const paramsAttr = target.getAttribute('data-params');
        let params: Record<string, unknown> = {};
        if (paramsAttr) {
          try {
            params = JSON.parse(paramsAttr);
          } catch {
            params = {};
          }
        }
        onUiAction(tool, params).catch((err) => {
          console.error('Error from onUiAction in RenderHtmlResource:', err);
        });
      }
    };

    const container = secureContainerRef.current;
    container?.addEventListener('click', handler);
    return () => container?.removeEventListener('click', handler);
  }, [onUiAction, renderMode, secureHtml]);

  if (isLoading) return <p>Loading HTML content...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  if (renderMode === 'secure') {
    if (secureHtml === null || secureHtml === undefined) {
      if (!isLoading && !error) {
        return <p className="text-orange-500">No HTML content to display.</p>;
      }
      return null;
    }
    return (
      <div
        ref={secureContainerRef}
        data-testid="html-resource-secure"
        dangerouslySetInnerHTML={{ __html: secureHtml }}
        style={{ width: '100%', minHeight: 200, ...style }}
      />
    );
  } else if (iframeRenderMode === 'srcDoc') {
    if (htmlString === null || htmlString === undefined) {
      if (!isLoading && !error) {
        return <p className="text-orange-500">No HTML content to display.</p>;
      }
      return null;
    }
    return (
      <iframe
        ref={iframeRef}
        srcDoc={htmlString}
        sandbox="allow-scripts"
        style={{ width: '100%', minHeight: 200, ...style }}
        title="MCP HTML Resource (Embedded Content)"
      />
    );
  } else if (iframeRenderMode === 'src') {
    if (iframeSrc === null || iframeSrc === undefined) {
      if (!isLoading && !error) {
        return (
          <p className="text-orange-500">No URL provided for HTML resource.</p>
        );
      }
      return null;
    }
    return (
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        sandbox="allow-scripts allow-same-origin" // unsafe
        style={{ width: '100%', minHeight: 200, ...style }}
        title="MCP HTML Resource (URL)"
      />
    );
  }

  return <p className="text-gray-500">Initializing HTML resource display...</p>;
};
