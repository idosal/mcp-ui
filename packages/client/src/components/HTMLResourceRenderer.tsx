import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { UIActionResult } from '../types';
import { processHTMLResource } from '../utils/processResource';

export type HTMLResourceRendererProps = {
  resource: Partial<Resource>;
  onUIAction?: (result: UIActionResult) => Promise<unknown>;
  style?: React.CSSProperties;
  iframeProps?: Omit<React.HTMLAttributes<HTMLIFrameElement>, 'src' | 'srcDoc' | 'ref' | 'style'>;
};

export const HTMLResourceRenderer = React.forwardRef<
  HTMLIFrameElement | null,
  HTMLResourceRendererProps
>(({ resource, onUIAction, style, iframeProps }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  useImperativeHandle(ref, () => iframeRef.current as HTMLIFrameElement);

  const { error, iframeSrc, iframeRenderMode, htmlString } = useMemo(
    () => processHTMLResource(resource),
    [resource],
  );

  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      // Only process the message if it came from this specific iframe
      if (iframeRef.current && event.source === iframeRef.current.contentWindow) {
        const uiActionResult = event.data as UIActionResult;
        if (!uiActionResult) {
          return;
        }
        try {
          const response = await onUIAction?.(uiActionResult);
          if (uiActionResult.type === 'requestInfo') {
            const { requestId } = uiActionResult.payload;
            event.source?.postMessage({
              type: 'requestInfoResponse',
              payload: {
                requestId,
                response,
              },
            });
          }
        } catch (err) {
          console.error('Error handling UI action result in HTMLResourceRenderer:', err);
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUIAction]);

  if (error) return <p className="text-red-500">{error}</p>;

  if (iframeRenderMode === 'srcDoc') {
    if (htmlString === null || htmlString === undefined) {
      if (!error) {
        return <p className="text-orange-500">No HTML content to display.</p>;
      }
      return null;
    }
    return (
      <iframe
        srcDoc={htmlString}
        sandbox="allow-scripts"
        style={{ width: '100%', minHeight: 200, ...style }}
        title="MCP HTML Resource (Embedded Content)"
        {...iframeProps}
        ref={iframeRef}
      />
    );
  } else if (iframeRenderMode === 'src') {
    if (iframeSrc === null || iframeSrc === undefined) {
      if (!error) {
        return <p className="text-orange-500">No URL provided for HTML resource.</p>;
      }
      return null;
    }
    return (
      <iframe
        src={iframeSrc}
        sandbox="allow-scripts allow-same-origin"
        style={{ width: '100%', minHeight: 200, ...style }}
        title="MCP HTML Resource (URL)"
        {...iframeProps}
        ref={iframeRef}
      />
    );
  }

  return <p className="text-gray-500">Initializing HTML resource display...</p>;
});

HTMLResourceRenderer.displayName = 'HTMLResourceRenderer';
