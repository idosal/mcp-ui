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
  autoResizeIframe?: boolean | { width?: boolean; height?: boolean };
  useSrcDoc?: boolean;
  sandboxPermissions?: string;
  iframeProps?: Omit<React.HTMLAttributes<HTMLIFrameElement>, 'src' | 'srcDoc' | 'style'> & {
    ref?: React.RefObject<HTMLIFrameElement>;
  };
};

const InternalMessageType = {
  UI_MESSAGE_RECEIVED: 'ui-message-received',
  UI_MESSAGE_RESPONSE: 'ui-message-response',

  UI_SIZE_CHANGE: 'ui-size-change',

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
  autoResizeIframe,
  useSrcDoc,
  sandboxPermissions,
  iframeProps,
}: HTMLResourceRendererProps) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  useImperativeHandle(iframeProps?.ref, () => iframeRef.current as HTMLIFrameElement);
  const iframeSrcBlobUrl = useRef<string | null>(null);

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
      if (iframeSrcBlobUrl.current && typeof window?.URL?.revokeObjectURL === 'function') {
        window.URL.revokeObjectURL(iframeSrcBlobUrl.current);
        iframeSrcBlobUrl.current = null;
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

        if (data?.type === InternalMessageType.UI_SIZE_CHANGE) {
          const { width, height } = data.payload as { width?: number; height?: number };
          if (autoResizeIframe && iframeRef.current) {
            const shouldAdjustHeight =
              (typeof autoResizeIframe === 'boolean' || autoResizeIframe.height) && height;
            const shouldAdjustWidth =
              (typeof autoResizeIframe === 'boolean' || autoResizeIframe.width) && width;

            if (shouldAdjustHeight) {
              iframeRef.current.style.height = `${height}px`;
            }
            if (shouldAdjustWidth) {
              iframeRef.current.style.width = `${width}px`;
            }
          }
          return;
        }

        const uiActionResult = data as UIActionResult;
        if (!uiActionResult) {
          return;
        }

        // return the "ui-message-received" message only if the onUIAction callback is provided
        // otherwise we cannot know that the message was received by the client
        if (onUIAction) {
          const messageId = uiActionResult.messageId;
          postToFrame(InternalMessageType.UI_MESSAGE_RECEIVED, source, origin, messageId);
          try {
            const response = await onUIAction(uiActionResult);
            postToFrame(InternalMessageType.UI_MESSAGE_RESPONSE, source, origin, messageId, {
              response,
            });
          } catch (err) {
            console.error('Error handling UI action result in HTMLResourceRenderer:', err);
            postToFrame(InternalMessageType.UI_MESSAGE_RESPONSE, source, origin, messageId, {
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

  const sandbox = useMemo(() => {
    if (iframeRenderMode === 'srcDoc') {
      // with raw HTML we don't set allow-same-origin for security reasons
      return mergeSandboxPermissions(sandboxPermissions ?? '', 'allow-scripts');
    }
    return mergeSandboxPermissions(sandboxPermissions ?? '', 'allow-scripts allow-same-origin');
  }, [sandboxPermissions, iframeRenderMode]);

  if (iframeRenderMode === 'srcDoc') {
    if (htmlString === null || htmlString === undefined) {
      if (!error) {
        return <p className="text-orange-500">No HTML content to display.</p>;
      }
      return null;
    }
    let iframeSrcProp: {
      srcDoc?: string;
    } | {
      src?: string;
    } = {
      srcDoc: htmlString,
    }
    if (!useSrcDoc && typeof URL.createObjectURL === 'function') {
      const blob = new Blob([htmlString], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      iframeSrcBlobUrl.current = blobUrl;
      iframeSrcProp = {
        src: blobUrl,
      };
    }
    return (
      <iframe
        {...iframeSrcProp}
        sandbox={sandbox}
        style={{ width: '100%', height: '100%', ...style }}
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
        sandbox={sandbox}
        style={{ width: '100%', height: '100%', ...style }}
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

function mergeSandboxPermissions(sandboxPermissions: string, defaultSandboxPermissions: string) {
  return [...new Set([...sandboxPermissions.split(' '), ...defaultSandboxPermissions.split(' ')])]
    .filter(Boolean)
    .map((permission) => permission.trim())
    .join(' ');
}