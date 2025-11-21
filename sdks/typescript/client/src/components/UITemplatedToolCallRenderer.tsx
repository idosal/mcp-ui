import { useEffect, useRef, useState } from "react";
import {
  McpUiMessageRequestSchema,
  McpUiOpenLinkRequestSchema,
  McpUiSizeChangeNotificationSchema,
  McpUiSandboxProxyReadyNotificationSchema, 
  PostMessageTransport,
} from "@modelcontextprotocol/ext-apps";
import {
  AppBridge,
} from "@modelcontextprotocol/ext-apps/app-bridge";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  CallToolResult,
  LoggingMessageNotificationSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { UIActionResult } from "..";

/**
 * Props for the UITemplatedToolCallRenderer component.
 */
export interface UITemplatedToolCallRendererProps {
  /** URL to the sandbox proxy HTML that will host the tool UI iframe */
  sandboxProxyUrl: URL;

  /** MCP client connected to the server providing the tool */
  client: Client;

  /** Name of the MCP tool to render UI for */
  toolName: string;

  /** Optional pre-fetched resource URI. If not provided, will be fetched via getToolUiResourceUri() */
  toolResourceUri?: string;

  /** Optional input arguments to pass to the tool UI once it's ready */
  toolInput?: Record<string, unknown>;

  /** Optional result from tool execution to pass to the tool UI once it's ready */
  toolResult?: CallToolResult;

  /** Callback invoked when the tool UI requests an action (intent, link, prompt, notify) */
  onUIAction?: (result: UIActionResult) => Promise<unknown>;

  /** Callback invoked when an error occurs during setup or message handling */
  onError?: (error: Error) => void;
}

/**
 * React component that renders an MCP tool's custom UI in a sandboxed iframe.
 *
 * This component manages the complete lifecycle of an MCP-UI tool:
 * 1. Creates a sandboxed iframe with the proxy HTML
 * 2. Establishes MCP communication channel between host and iframe
 * 3. Fetches and loads the tool's UI resource (HTML)
 * 4. Sends tool inputs and results to the UI when ready
 * 5. Handles UI actions (intents, link opening, prompts, notifications)
 * 6. Automatically resizes iframe based on content size changes
 *
 * @example
 * ```tsx
 * <UITemplatedToolCallRenderer
 *   sandboxProxyUrl={new URL('http://localhost:8765/sandbox_proxy.html')}
 *   client={mcpClient}
 *   toolName="create-chart"
 *   toolInput={{ data: [1, 2, 3], type: 'bar' }}
 *   onUIAction={async (action) => {
 *     if (action.type === 'intent') {
 *       // Handle intent request from UI
 *       console.log('Intent:', action.payload.intent);
 *     }
 *   }}
 *   onError={(error) => console.error('UI Error:', error)}
 * />
 * ```
 *
 * **Architecture:**
 * - Host (this component) ↔ Sandbox Proxy (iframe) ↔ Tool UI (nested iframe)
 * - Communication uses MCP protocol over postMessage
 * - Sandbox proxy provides CSP isolation for untrusted tool UIs
 * - Standard MCP initialization flow determines when UI is ready
 *
 * **Lifecycle:**
 * 1. `setupSandboxProxyIframe()` creates iframe and waits for proxy ready
 * 2. Component creates `McpUiProxyServer` instance
 * 3. Registers all handlers (BEFORE connecting to avoid race conditions)
 * 4. Connects proxy to iframe via `MessageTransport`
 * 5. MCP initialization completes → `onClientReady` callback fires
 * 6. Fetches tool UI resource and sends to sandbox proxy
 * 7. Sends tool inputs/results when iframe signals ready
 *
 * @param props - Component props
 * @returns React element containing the sandboxed tool UI iframe
 */
export const UITemplatedToolCallRenderer = (
  props: UITemplatedToolCallRendererProps,
) => {
  const {
    client,
    sandboxProxyUrl,
    toolName,
    toolResourceUri,
    // usesOpenAiAppsSdk,
    toolInput,
    toolResult,
    onUIAction,
    onError,
  } = props;

  // State
  const [appBridge, setAppBridge] = useState<AppBridge | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Use refs for callbacks to avoid effect re-runs when they change
  const onUIActionRef = useRef(onUIAction);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onUIActionRef.current = onUIAction;
    onErrorRef.current = onError;
  });

  // Effect 1: Setup sandbox proxy iframe
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        // Step 1: Create iframe and wait for sandbox proxy ready
        const { iframe, onReady } =
          await setupSandboxProxyIframe(sandboxProxyUrl);

        if (!mounted) return;

        // Append iframe to DOM
        iframeRef.current = iframe;
        if (containerRef.current) {
          containerRef.current.appendChild(iframe);
        }

        // Wait for sandbox proxy HTML to signal it's ready
        await onReady;

        if (!mounted) return;

        // Step 2: Create proxy server instance
        const serverCapabilities = client.getServerCapabilities();
        const appBridge = new AppBridge(
          client,
          {
            name: "Example MCP UI Host",
            version: "1.0.0",
          },
          {
            openLinks: {},
            serverTools: serverCapabilities?.tools,
            serverResources: serverCapabilities?.resources,
          },
        );

        // Step 3: Register ALL handlers BEFORE connecting (critical for avoiding race conditions)

        // Hook into the standard MCP initialization to know when the inner iframe is ready
        appBridge.oninitialized = () => {
          if (!mounted) return;
          console.log("[Host] Inner iframe MCP client initialized");
          setIframeReady(true);
        };

        // Register MCP-UI specific request handlers

        appBridge.setRequestHandler(McpUiOpenLinkRequestSchema, async (req) => {
          try {
            await onUIActionRef.current?.({
              type: "link",
              payload: { url: req.params.url },
            });
            return { isError: false };
          } catch (e) {
            console.error("[Host] Open link handler error:", e);
            const error = e instanceof Error ? e : new Error(String(e));
            onErrorRef.current?.(error);
            return { isError: true };
          }
        });

        appBridge.setRequestHandler(McpUiMessageRequestSchema, async (req) => {
          try {
            await onUIActionRef.current?.({
              type: "prompt",
              payload: {
                prompt: req.params.content
                  .map((c: any) => (c.type === "text" ? c.text : ""))
                  .join("\n"),
              },
            });
            return { isError: false };
          } catch (e) {
            console.error("[Host] Message handler error:", e);
            const error = e instanceof Error ? e : new Error(String(e));
            onErrorRef.current?.(error);
            return { isError: true };
          }
        });

        appBridge.setNotificationHandler(
          McpUiSizeChangeNotificationSchema,
          async (notif: any) => {
            const { width, height } = notif.params;
            if (iframeRef.current) {
              if (width !== undefined) {
                iframeRef.current.style.width = `${width}px`;
              }
              if (height !== undefined) {
                iframeRef.current.style.height = `${height}px`;
              }
            }
          },
        );

        appBridge.setNotificationHandler(
          LoggingMessageNotificationSchema,
          async (notif: any) => {
            onUIAction?.({
              type: "notify",
              payload: {
                message: notif.params.message,
              },
            });
          },
        );

        // Step 4: NOW connect (triggers MCP initialization handshake)
        // IMPORTANT: Pass iframe.contentWindow as BOTH target and source to ensure
        // this proxy only responds to messages from its specific iframe
        await appBridge.connect(
          new PostMessageTransport(
            iframe.contentWindow!,
            iframe.contentWindow!,
          ),
        );

        if (!mounted) return;

        // Step 5: Store proxy in state
        setAppBridge(appBridge);
      } catch (err) {
        console.error("[UITemplatedToolCallRenderer] Error:", err);
        if (!mounted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onErrorRef.current?.(error);
      }
    };

    setup();

    return () => {
      mounted = false;
      // Cleanup: remove iframe from DOM
      if (
        iframeRef.current &&
        containerRef.current?.contains(iframeRef.current)
      ) {
        containerRef.current.removeChild(iframeRef.current);
      }
    };
  }, [client, sandboxProxyUrl]);

  // Effect 2: Fetch and send UI resource
  useEffect(() => {
    if (!appBridge) return;

    let mounted = true;

    const fetchAndSendResource = async () => {
      try {
        // Get the resource URI (use prop if provided, otherwise fetch)
        let resourceInfo: { uri: string };

        if (toolResourceUri) {
          // When URI is provided directly, assume it's NOT OpenAI Apps SDK format
          resourceInfo = {
            uri: toolResourceUri,
            // usesOpenAiAppsSdk: usesOpenAiAppsSdk ?? false,
          };
          console.log(
            `[Host] Using provided resource URI: ${resourceInfo.uri}`,
          );
        } else {
          console.log(`[Host] Fetching resource URI for tool: ${toolName}`);
          const info = await getToolUiResourceUri(client, toolName);
          if (!info) {
            throw new Error(
              `Tool ${toolName} has no UI resource (no ui/resourceUri or openai/outputTemplate in tool._meta)`,
            );
          }
          resourceInfo = info;
          console.log(`[Host] Got resource URI: ${resourceInfo.uri}`);
        }

        if (!resourceInfo.uri) {
          throw new Error(`Tool ${toolName}: URI is undefined or empty`);
        }

        if (!mounted) return;

        // Read the HTML content
        console.log(`[Host] Reading resource HTML from: ${resourceInfo.uri}`);
        const html = await readToolUiResourceHtml(client, {
          uri: resourceInfo.uri,
        });

        if (!mounted) return;

        // Send the resource to the sandbox proxy
        console.log("[Host] Sending sandbox resource ready");
        await appBridge.sendSandboxResourceReady({ html });
      } catch (err) {
        if (!mounted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onErrorRef.current?.(error);
      }
    };

    fetchAndSendResource();

    return () => {
      mounted = false;
    };
  }, [appBridge, toolName, toolResourceUri, client]);

  // Effect 3: Send tool input when ready
  useEffect(() => {
    if (appBridge && iframeReady && toolInput) {
      console.log("[Host] Sending tool input:", toolInput);
      appBridge.sendToolInput({ arguments: toolInput });
    }
  }, [appBridge, iframeReady, toolInput]);

  // Effect 4: Send tool result when ready
  useEffect(() => {
    if (appBridge && iframeReady && toolResult) {
      console.log("[Host] Sending tool result:", toolResult);
      appBridge.sendToolResult(toolResult);
    }
  }, [appBridge, iframeReady, toolResult]);

  // Render
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


const MCP_UI_RESOURCE_META_KEY = "ui/resourceUri";

async function setupSandboxProxyIframe(sandboxProxyUrl: URL): Promise<{
  iframe: HTMLIFrameElement;
  onReady: Promise<void>;
}> {
  const iframe = document.createElement("iframe");
  iframe.style.width = "100%";
  iframe.style.height = "100px";
  iframe.style.border = "none";
  iframe.style.backgroundColor = "transparent";
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");

  const onReady = new Promise<void>((resolve, _reject) => {
    const initialListener = async (event: MessageEvent) => {
      if (event.source === iframe.contentWindow) {
        if (
          event.data &&
          event.data.method ===
            McpUiSandboxProxyReadyNotificationSchema.shape.method._def.value
        ) {
          window.removeEventListener("message", initialListener);
          resolve();
        }
      }
    };
    window.addEventListener("message", initialListener);
  });

  iframe.src = sandboxProxyUrl.href;

  return { iframe, onReady };
}

type ToolUiResourceInfo = {
  uri: string;
};

async function getToolUiResourceUri(
  client: Client,
  toolName: string,
): Promise<ToolUiResourceInfo | null> {
  let tool: Tool | undefined;
  let cursor: string | undefined = undefined;
  do {
    const toolsResult = await client.listTools({ cursor });
    tool = toolsResult.tools.find((t) => t.name === toolName);
    cursor = toolsResult.nextCursor;
  } while (!tool && cursor);
  if (!tool) {
    throw new Error(`tool ${toolName} not found`);
  }
  if (!tool._meta) {
    return null;
  }

  let uri: string;
  if (MCP_UI_RESOURCE_META_KEY in tool._meta) {
    uri = String(tool._meta[MCP_UI_RESOURCE_META_KEY]);
  } else {
    return null;
  }
  if (!uri.startsWith("ui://")) {
    throw new Error(
      `tool ${toolName} has unsupported output template URI: ${uri}`,
    );
  }
  return { uri };
}

async function readToolUiResourceHtml(
  client: Client,
  opts: {
    uri: string;
  },
): Promise<string> {
  const resource = await client.readResource({ uri: opts.uri });

  if (!resource) {
    throw new Error("UI resource not found: " + opts.uri);
  }
  if (resource.contents.length !== 1) {
    throw new Error(
      "Unsupported UI resource content length: " + resource.contents.length,
    );
  }
  const content = resource.contents[0];
  let html: string;
  const isHtml = (t?: string) =>
    t === "text/html" || t === "text/html+skybridge";

  if (
    "text" in content &&
    typeof content.text === "string" &&
    isHtml(content.mimeType)
  ) {
    html = content.text;
  } else if (
    "blob" in content &&
    typeof content.blob === "string" &&
    isHtml(content.mimeType)
  ) {
    html = atob(content.blob);
  } else {
    throw new Error(
      "Unsupported UI resource content format: " + JSON.stringify(content),
    );
  }

  return html;
}
