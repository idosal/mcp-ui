import { useEffect, useMemo, useRef, useState } from "react";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  type CallToolResult,
  type LoggingMessageNotification,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";

import {
  AppBridge,
  type McpUiMessageRequest,
  type McpUiMessageResult,
  type McpUiOpenLinkRequest,
  type McpUiOpenLinkResult,
  type McpUiSizeChangedNotification,
} from "@modelcontextprotocol/ext-apps/app-bridge";

import { AppFrame, type SandboxConfig } from "./AppFrame";
import {
  getToolUiResourceUri,
  readToolUiResourceHtml,
} from "../utils/app-host-utils";
import { UIActionResult } from "..";

/**
 * Extra metadata passed to request handlers (from AppBridge).
 */
type RequestHandlerExtra = Parameters<
  Parameters<AppBridge["setRequestHandler"]>[1]
>[1];

/**
 * Props for the AppRenderer component.
 */
export interface AppRendererProps {
  /** MCP client connected to the server providing the tool */
  client: Client;

  /** Name of the MCP tool to render UI for */
  toolName: string;

  /** Sandbox configuration */
  sandbox: SandboxConfig;

  /** @deprecated Use `sandbox.url` instead */
  sandboxProxyUrl?: URL;

  /** Optional pre-fetched resource URI. If not provided, will be fetched via getToolUiResourceUri() */
  toolResourceUri?: string;

  /** Optional pre-fetched HTML. If provided, skips all resource fetching */
  html?: string;

  /** Optional input arguments to pass to the tool UI once it's ready */
  toolInput?: Record<string, unknown>;

  /** Optional result from tool execution to pass to the tool UI once it's ready */
  toolResult?: CallToolResult;

  /** Handler for open-link requests from the guest UI */
  onopenlink?: (
    params: McpUiOpenLinkRequest["params"],
    extra: RequestHandlerExtra,
  ) => Promise<McpUiOpenLinkResult>;

  /** Handler for message requests from the guest UI */
  onmessage?: (
    params: McpUiMessageRequest["params"],
    extra: RequestHandlerExtra,
  ) => Promise<McpUiMessageResult>;

  /** Handler for logging messages from the guest UI */
  onloggingmessage?: (params: LoggingMessageNotification["params"]) => void;

  /** Handler for size change notifications from the guest UI */
  onsizechange?: (params: McpUiSizeChangedNotification["params"]) => void;

  /** Callback invoked when the tool UI requests an action (link, prompt, notify) */
  onUIAction?: (result: UIActionResult) => Promise<unknown>;

  /** Callback invoked when an error occurs during setup or message handling */
  onerror?: (error: Error) => void;
}

/**
 * React component that renders an MCP tool's custom UI in a sandboxed iframe.
 *
 * This component manages the complete lifecycle of an MCP-UI tool:
 * 1. Creates AppBridge for MCP communication
 * 2. Fetches the tool's UI resource (HTML) if not provided
 * 3. Delegates rendering to AppFrame
 * 4. Handles UI actions (intents, link opening, prompts, notifications)
 *
 * For lower-level control or when you already have the HTML content,
 * use the AppFrame component directly.
 *
 * @example Basic usage
 * ```tsx
 * <AppRenderer
 *   sandbox={{ url: new URL('http://localhost:8765/sandbox_proxy.html') }}
 *   client={mcpClient}
 *   toolName="create-chart"
 *   toolInput={{ data: [1, 2, 3], type: 'bar' }}
 *   onUIAction={async (action) => {
 *     if (action.type === 'intent') {
 *       console.log('Intent:', action.payload.intent);
 *     }
 *   }}
 *   onerror={(error) => console.error('UI Error:', error)}
 * />
 * ```
 *
 * @example With pre-fetched HTML (skips resource fetching)
 * ```tsx
 * <AppRenderer
 *   sandbox={{ url: sandboxUrl }}
 *   client={mcpClient}
 *   toolName="my-tool"
 *   html={preloadedHtml}
 *   toolInput={args}
 * />
 * ```
 */
export const AppRenderer = (props: AppRendererProps) => {
  const {
    client,
    toolName,
    sandbox: sandboxProp,
    sandboxProxyUrl,
    toolResourceUri,
    html: htmlProp,
    toolInput,
    toolResult,
    onmessage,
    onopenlink,
    onloggingmessage,
    onsizechange,
    onUIAction,
    onerror,
  } = props;

  // Handle deprecated sandboxProxyUrl prop
  const sandbox = useMemo<SandboxConfig>(() => {
    if (sandboxProp) return sandboxProp;
    if (sandboxProxyUrl) {
      console.warn(
        "[AppRenderer] sandboxProxyUrl is deprecated, use sandbox={{ url: ... }} instead",
      );
      return { url: sandboxProxyUrl };
    }
    throw new Error("AppRenderer requires sandbox.url or sandboxProxyUrl");
  }, [sandboxProp, sandboxProxyUrl]);

  // State
  const [appBridge, setAppBridge] = useState<AppBridge | null>(null);
  const [html, setHtml] = useState<string | null>(htmlProp ?? null);
  const [error, setError] = useState<Error | null>(null);

  // Refs for callbacks
  const onmessageRef = useRef(onmessage);
  const onopenlinkRef = useRef(onopenlink);
  const onloggingmessageRef = useRef(onloggingmessage);
  const onsizechangeRef = useRef(onsizechange);
  const onUIActionRef = useRef(onUIAction);
  const onerrorRef = useRef(onerror);

  useEffect(() => {
    onmessageRef.current = onmessage;
    onopenlinkRef.current = onopenlink;
    onloggingmessageRef.current = onloggingmessage;
    onsizechangeRef.current = onsizechange;
    onUIActionRef.current = onUIAction;
    onerrorRef.current = onerror;
  });

  // Effect 1: Create and configure AppBridge
  useEffect(() => {
    let mounted = true;

    const createBridge = () => {
      try {
        const serverCapabilities = client.getServerCapabilities();
        const bridge = new AppBridge(
          client,
          {
            name: "MCP-UI Host",
            version: "1.0.0",
          },
          {
            openLinks: {},
            serverTools: serverCapabilities?.tools,
            serverResources: serverCapabilities?.resources,
          },
        );

        // Register message handler
        bridge.onmessage = async (params, extra) => {
          if (onUIActionRef.current) {
            try {
              await onUIActionRef.current({
                type: "prompt",
                payload: {
                  prompt: params.content
                    .map((c: { type: string; text?: string }) =>
                      c.type === "text" ? c.text : "",
                    )
                    .join("\n"),
                },
              });
              return { isError: false };
            } catch (e) {
              console.error("[AppRenderer] Message handler error:", e);
              const error = e instanceof Error ? e : new Error(String(e));
              onerrorRef.current?.(error);
              return { isError: true };
            }
          } else if (onmessageRef.current) {
            return onmessageRef.current(params, extra);
          } else {
            throw new McpError(ErrorCode.MethodNotFound, "Method not found");
          }
        };

        // Register open-link handler
        bridge.onopenlink = async (params, extra) => {
          if (onUIActionRef.current) {
            try {
              await onUIActionRef.current({
                type: "link",
                payload: { url: params.url },
              });
              return { isError: false };
            } catch (e) {
              console.error("[AppRenderer] Open link handler error:", e);
              const error = e instanceof Error ? e : new Error(String(e));
              onerrorRef.current?.(error);
              return { isError: true };
            }
          } else if (onopenlinkRef.current) {
            return onopenlinkRef.current(params, extra);
          } else {
            throw new McpError(ErrorCode.MethodNotFound, "Method not found");
          }
        };

        // Register logging handler
        bridge.onloggingmessage = (params) => {
          if (onUIActionRef.current) {
            onUIActionRef.current({
              type: "notify",
              payload: {
                message: String(params.message ?? params.data),
              },
            });
          } else if (onloggingmessageRef.current) {
            onloggingmessageRef.current(params);
          }
        };

        if (!mounted) return;
        setAppBridge(bridge);
      } catch (err) {
        console.error("[AppRenderer] Error creating bridge:", err);
        if (!mounted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onerrorRef.current?.(error);
      }
    };

    createBridge();

    return () => {
      mounted = false;
    };
  }, [client]);

  // Effect 2: Fetch HTML if not provided
  useEffect(() => {
    if (htmlProp) {
      setHtml(htmlProp);
      return;
    }

    let mounted = true;

    const fetchHtml = async () => {
      try {
        // Get resource URI
        let uri: string;
        if (toolResourceUri) {
          uri = toolResourceUri;
          console.log(`[AppRenderer] Using provided resource URI: ${uri}`);
        } else {
          console.log(
            `[AppRenderer] Fetching resource URI for tool: ${toolName}`,
          );
          const info = await getToolUiResourceUri(client, toolName);
          if (!info) {
            throw new Error(
              `Tool ${toolName} has no UI resource (no ui/resourceUri in tool._meta)`,
            );
          }
          uri = info.uri;
          console.log(`[AppRenderer] Got resource URI: ${uri}`);
        }

        if (!mounted) return;

        // Read HTML content
        console.log(`[AppRenderer] Reading resource HTML from: ${uri}`);
        const htmlContent = await readToolUiResourceHtml(client, { uri });

        if (!mounted) return;

        setHtml(htmlContent);
      } catch (err) {
        if (!mounted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onerrorRef.current?.(error);
      }
    };

    fetchHtml();

    return () => {
      mounted = false;
    };
  }, [client, toolName, toolResourceUri, htmlProp]);

  // Handle size change callback
  const handleSizeChange = (params: McpUiSizeChangedNotification["params"]) => {
    onsizechangeRef.current?.(params);
  };

  // Render error state
  if (error) {
    return (
      <div style={{ color: "red", padding: "1rem" }}>
        Error: {error.message}
      </div>
    );
  }

  // Render loading state
  if (!appBridge || !html) {
    return null;
  }

  // Render AppFrame with the fetched HTML and configured bridge
  return (
    <AppFrame
      html={html}
      sandbox={sandbox}
      appBridge={appBridge}
      toolInput={toolInput}
      toolResult={toolResult}
      onSizeChange={handleSizeChange}
      onerror={onerror}
    />
  );
};
