import { useEffect, useRef, useState } from "react";

import type {
  CallToolResult,
  LoggingMessageNotification,
  Implementation,
} from "@modelcontextprotocol/sdk/types.js";

import {
  AppBridge,
  PostMessageTransport,
  type McpUiSizeChangedNotification,
  type McpUiResourceCsp,
  type McpUiAppCapabilities,
} from "@modelcontextprotocol/ext-apps/app-bridge";

import { setupSandboxProxyIframe } from "../utils/app-host-utils";

/**
 * Information about the guest app, available after initialization.
 */
export interface AppInfo {
  /** Guest app's name and version */
  appVersion?: Implementation;
  /** Guest app's declared capabilities */
  appCapabilities?: McpUiAppCapabilities;
}

/**
 * Sandbox configuration for the iframe.
 */
export interface SandboxConfig {
  /** URL to the sandbox proxy HTML */
  url: URL;
  /** Override iframe sandbox attribute (default: "allow-scripts allow-same-origin allow-forms") */
  permissions?: string;
  /** CSP metadata to forward to the sandbox proxy */
  csp?: McpUiResourceCsp;
}

/**
 * Props for the AppFrame component.
 */
export interface AppFrameProps {
  /** Pre-fetched HTML content to render in the sandbox */
  html: string;

  /** Sandbox configuration */
  sandbox: SandboxConfig;

  /** Pre-configured AppBridge for full MCP support (optional) */
  appBridge?: AppBridge;

  /** Simple callback when guest requests to open a link (used if no appBridge) */
  onOpenLink?: (url: string) => void;

  /** Simple callback when guest sends a message (used if no appBridge) */
  onMessage?: (content: string) => void;

  /** Callback when guest reports size change */
  onSizeChange?: (params: McpUiSizeChangedNotification["params"]) => void;

  /** Callback when guest sends a logging message */
  onLoggingMessage?: (params: LoggingMessageNotification["params"]) => void;

  /** Callback when app initialization completes, with app info */
  onInitialized?: (appInfo: AppInfo) => void;

  /** Tool input arguments to send when app initializes */
  toolInput?: Record<string, unknown>;

  /** Tool result to send when app initializes */
  toolResult?: CallToolResult;

  /** Callback when an error occurs */
  onerror?: (error: Error) => void;
}

/**
 * Low-level component that renders pre-fetched HTML in a sandboxed iframe.
 *
 * Use this component when you already have the HTML content and optionally
 * a pre-configured AppBridge. For automatic resource fetching from an MCP
 * server, use the higher-level AppRenderer component instead.
 *
 * @example Basic usage with pre-fetched HTML
 * ```tsx
 * <AppFrame
 *   html={myHtmlContent}
 *   sandbox={{ url: new URL('http://localhost:8081/sandbox.html') }}
 *   toolInput={{ data: [1, 2, 3] }}
 *   onSizeChange={({ width, height }) => console.log('Size:', width, height)}
 * />
 * ```
 *
 * @example With pre-configured AppBridge for full MCP support
 * ```tsx
 * const appBridge = new AppBridge(client, hostInfo, capabilities);
 * // ... configure appBridge handlers ...
 *
 * <AppFrame
 *   html={htmlContent}
 *   sandbox={{ url: sandboxUrl }}
 *   appBridge={appBridge}
 *   toolInput={args}
 *   toolResult={result}
 * />
 * ```
 */
export const AppFrame = (props: AppFrameProps) => {
  const {
    html,
    sandbox,
    appBridge: externalAppBridge,
    onOpenLink,
    onMessage,
    onSizeChange,
    onLoggingMessage,
    onInitialized,
    toolInput,
    toolResult,
    onerror,
  } = props;

  const [appBridge, setAppBridge] = useState<AppBridge | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Refs for callbacks to avoid effect re-runs
  const onSizeChangeRef = useRef(onSizeChange);
  const onOpenLinkRef = useRef(onOpenLink);
  const onMessageRef = useRef(onMessage);
  const onLoggingMessageRef = useRef(onLoggingMessage);
  const onInitializedRef = useRef(onInitialized);
  const onerrorRef = useRef(onerror);

  useEffect(() => {
    onSizeChangeRef.current = onSizeChange;
    onOpenLinkRef.current = onOpenLink;
    onMessageRef.current = onMessage;
    onLoggingMessageRef.current = onLoggingMessage;
    onInitializedRef.current = onInitialized;
    onerrorRef.current = onerror;
  });

  // Effect 1: Set up sandbox iframe and connect AppBridge
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        const { iframe, onReady } = await setupSandboxProxyIframe(sandbox.url);

        if (!mounted) return;

        iframeRef.current = iframe;
        if (containerRef.current) {
          containerRef.current.appendChild(iframe);
        }

        await onReady;

        if (!mounted) return;

        // Use external AppBridge if provided
        const bridge = externalAppBridge;

        if (bridge) {
          // Register size change handler
          bridge.onsizechange = async (params) => {
            onSizeChangeRef.current?.(params);
            // Also update iframe size
            if (iframeRef.current) {
              if (params.width !== undefined) {
                iframeRef.current.style.width = `${params.width}px`;
              }
              if (params.height !== undefined) {
                iframeRef.current.style.height = `${params.height}px`;
              }
            }
          };

          // Hook into initialization
          bridge.oninitialized = () => {
            if (!mounted) return;
            console.log("[AppFrame] App initialized");
            setIframeReady(true);
            onInitializedRef.current?.({
              appVersion: bridge.getAppVersion(),
              appCapabilities: bridge.getAppCapabilities(),
            });
          };

          // Register logging handler
          bridge.onloggingmessage = (params) => {
            onLoggingMessageRef.current?.(params);
          };

          // Connect the bridge
          await bridge.connect(
            new PostMessageTransport(
              iframe.contentWindow!,
              iframe.contentWindow!,
            ),
          );

          if (!mounted) return;

          setAppBridge(bridge);
        } else {
          // No AppBridge - just listen for basic postMessage events
          const handleMessage = (event: MessageEvent) => {
            if (event.source !== iframe.contentWindow) return;

            const { method, params } = event.data || {};

            if (method === "ui/size-changed") {
              onSizeChangeRef.current?.(params);
              if (iframeRef.current) {
                if (params?.width !== undefined) {
                  iframeRef.current.style.width = `${params.width}px`;
                }
                if (params?.height !== undefined) {
                  iframeRef.current.style.height = `${params.height}px`;
                }
              }
            } else if (method === "ui/open-link") {
              onOpenLinkRef.current?.(params?.url);
            } else if (method === "ui/message") {
              const content = params?.content
                ?.map((c: { type: string; text?: string }) =>
                  c.type === "text" ? c.text : "",
                )
                .join("\n");
              onMessageRef.current?.(content);
            } else if (method === "notifications/message") {
              // Logging message
              onLoggingMessageRef.current?.(params);
            }
          };

          window.addEventListener("message", handleMessage);
          setIframeReady(true);

          return () => {
            window.removeEventListener("message", handleMessage);
          };
        }
      } catch (err) {
        console.error("[AppFrame] Error:", err);
        if (!mounted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onerrorRef.current?.(error);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (
        iframeRef.current &&
        containerRef.current?.contains(iframeRef.current)
      ) {
        containerRef.current.removeChild(iframeRef.current);
      }
    };
  }, [sandbox.url, externalAppBridge]);

  // Effect 2: Send HTML to sandbox when ready
  useEffect(() => {
    if (!iframeReady || !html) return;

    const sendHtml = async () => {
      try {
        console.log("[AppFrame] Sending HTML to sandbox");
        if (appBridge) {
          await appBridge.sendSandboxResourceReady({
            html,
            csp: sandbox.csp,
          });
        } else if (iframeRef.current?.contentWindow) {
          // Direct postMessage for non-AppBridge mode
          iframeRef.current.contentWindow.postMessage(
            {
              jsonrpc: "2.0",
              method: "ui/notifications/sandbox-resource-ready",
              params: { html, csp: sandbox.csp },
            },
            "*",
          );
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onerrorRef.current?.(error);
      }
    };

    sendHtml();
  }, [iframeReady, html, appBridge, sandbox.csp]);

  // Effect 3: Send tool input when ready
  useEffect(() => {
    if (appBridge && iframeReady && toolInput) {
      console.log("[AppFrame] Sending tool input:", toolInput);
      appBridge.sendToolInput({ arguments: toolInput });
    }
  }, [appBridge, iframeReady, toolInput]);

  // Effect 4: Send tool result when ready
  useEffect(() => {
    if (appBridge && iframeReady && toolResult) {
      console.log("[AppFrame] Sending tool result:", toolResult);
      appBridge.sendToolResult(toolResult);
    }
  }, [appBridge, iframeReady, toolResult]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {error && (
        <div style={{ color: "red", padding: "1rem" }}>
          Error: {error.message}
        </div>
      )}
    </div>
  );
};
