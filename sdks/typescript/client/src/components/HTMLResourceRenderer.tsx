import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { UIActionResult } from '../types';
import { processHTMLResource } from '../utils/processResource';

export type HTMLResourceRendererProps = {
  resource: Partial<Resource>;
  onUIAction?: (result: UIActionResult) => Promise<unknown>;
  style?: React.CSSProperties;
  proxy?: string;
  iframeRenderData?: Record<string, unknown>;
  iframeProps?: Omit<React.HTMLAttributes<HTMLIFrameElement>, 'src' | 'srcDoc' | 'style'> & {
    ref?: React.RefObject<HTMLIFrameElement>;
  };
};

const InternalMessageType = {
  UI_ACTION_RECEIVED: 'ui-action-received',
  UI_ACTION_RESPONSE: 'ui-action-response',
  UI_ACTION_ERROR: 'ui-action-error',

  UI_LIFECYCLE_IFRAME_READY: 'ui-lifecycle-iframe-ready',
  UI_LIFECYCLE_IFRAME_RENDER_DATA: 'ui-lifecycle-iframe-render-data',
} as const;

export const ReservedUrlParams = {
  WAIT_FOR_RENDER_DATA: 'waitForRenderData',
} as const;

export const HTMLResourceRenderer = ({
  resource,
  onUIAction,
  style,
  proxy,
  iframeRenderData,
  iframeProps,
}: HTMLResourceRendererProps) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  useImperativeHandle(iframeProps?.ref, () => iframeRef.current as HTMLIFrameElement);

  const { error, iframeSrc, iframeRenderMode, htmlString } = useMemo(
    () => processHTMLResource(resource, proxy),
    [resource, proxy],
  );

  const iframeSrcToRender = useMemo(() => {
    if (iframeSrc && iframeRenderData) {
      const iframeUrl = new URL(iframeSrc);
      iframeUrl.searchParams.set(ReservedUrlParams.WAIT_FOR_RENDER_DATA, 'true');
      return iframeUrl.toString();
    }
    return iframeSrc;
  }, [iframeSrc, iframeRenderData]);

  const onIframeLoad = useCallback(
    (event: React.SyntheticEvent<HTMLIFrameElement>) => {
      if (iframeRenderData) {
        const iframeWindow = event.currentTarget.contentWindow;
        const iframeOrigin = iframeSrcToRender ? new URL(iframeSrcToRender).origin : '*';
        postToFrame(
          InternalMessageType.UI_LIFECYCLE_IFRAME_RENDER_DATA,
          iframeWindow,
          iframeOrigin,
          undefined,
          {
            renderData: iframeRenderData,
          },
        );
      }
      iframeProps?.onLoad?.(event);
    },
    [iframeRenderData, iframeSrcToRender, iframeProps?.onLoad],
  );

  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      const { source, origin, data } = event;
      // Only process the message if it came from this specific iframe
      if (iframeRef.current && source === iframeRef.current.contentWindow) {
        // if the iframe is ready, send the render data to the iframe
        if (data?.type === InternalMessageType.UI_LIFECYCLE_IFRAME_READY && iframeRenderData) {
          postToFrame(
            InternalMessageType.UI_LIFECYCLE_IFRAME_RENDER_DATA,
            source,
            origin,
            undefined,
            {
              renderData: iframeRenderData,
            },
          );
          return;
        }

        const uiActionResult = data as UIActionResult;
        if (!uiActionResult) {
          return;
        }

        // return the "ui-action-received" message only if the onUIAction callback is provided
        // otherwise we cannot know that the message was received by the client
        if (onUIAction) {
          const messageId = uiActionResult.messageId;
          postToFrame(InternalMessageType.UI_ACTION_RECEIVED, source, origin, messageId);
          try {
            const response = await onUIAction(uiActionResult);
            postToFrame(InternalMessageType.UI_ACTION_RESPONSE, source, origin, messageId, {
              response,
            });
          } catch (err) {
            console.error('Error handling UI action result in HTMLResourceRenderer:', err);
            postToFrame(InternalMessageType.UI_ACTION_ERROR, source, origin, messageId, {
              error: err,
            });
          }
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
        onLoad={onIframeLoad}
      />
    );
  } else if (iframeRenderMode === 'src') {
    if (iframeSrcToRender === null || iframeSrcToRender === undefined) {
      if (!error) {
        return <p className="text-orange-500">No URL provided for HTML resource.</p>;
      }
      return null;
    }

    return (
      <iframe
        src={iframeSrcToRender}
        sandbox="allow-scripts allow-same-origin"
        style={{ width: '100%', minHeight: 200, ...style }}
        title="MCP HTML Resource (URL)"
        {...iframeProps}
        ref={iframeRef}
        onLoad={onIframeLoad}
      />
    );
  }

  return <p className="text-gray-500">Initializing HTML resource display...</p>;
};

HTMLResourceRenderer.displayName = 'HTMLResourceRenderer';

function postToFrame(
  type: (typeof InternalMessageType)[keyof typeof InternalMessageType],
  source: Window | null,
  origin: string,
  originalMessageId?: string,
  payload?: unknown,
) {
  // in case the iframe is srcdoc, the origin is null
  const targetOrigin = origin && origin !== 'null' ? origin : '*';
  source?.postMessage(
    {
      type,
      messageId: originalMessageId ?? undefined,
      payload,
    },
    targetOrigin,
  );
}
