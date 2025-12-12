import { render, screen, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";

import { AppFrame, type AppFrameProps } from "../AppFrame";
import * as appHostUtils from "../../utils/app-host-utils";

// Mock PostMessageTransport
vi.mock("@modelcontextprotocol/ext-apps/app-bridge", async () => {
  const actual = await vi.importActual("@modelcontextprotocol/ext-apps/app-bridge");
  return {
    ...actual,
    PostMessageTransport: vi.fn().mockImplementation(() => ({})),
  };
});

// Track registered handlers
let registeredOninitialized: (() => void) | null = null;
let registeredOnsizechange: ((params: { width?: number; height?: number }) => void) | null = null;
let registeredOnloggingmessage: ((params: object) => void) | null = null;

// Mock AppBridge factory
const createMockAppBridge = () => {
  const bridge = {
    connect: vi.fn().mockResolvedValue(undefined),
    sendSandboxResourceReady: vi.fn().mockResolvedValue(undefined),
    sendToolInput: vi.fn(),
    sendToolResult: vi.fn(),
    getAppVersion: vi.fn().mockReturnValue({ name: "TestApp", version: "1.0.0" }),
    getAppCapabilities: vi.fn().mockReturnValue({ tools: {} }),
    _oninitialized: null as (() => void) | null,
    _onsizechange: null as ((params: { width?: number; height?: number }) => void) | null,
    _onloggingmessage: null as ((params: object) => void) | null,
  };

  Object.defineProperty(bridge, "oninitialized", {
    set: (fn) => {
      bridge._oninitialized = fn;
      registeredOninitialized = fn;
    },
    get: () => bridge._oninitialized,
  });
  Object.defineProperty(bridge, "onsizechange", {
    set: (fn) => {
      bridge._onsizechange = fn;
      registeredOnsizechange = fn;
    },
    get: () => bridge._onsizechange,
  });
  Object.defineProperty(bridge, "onloggingmessage", {
    set: (fn) => {
      bridge._onloggingmessage = fn;
      registeredOnloggingmessage = fn;
    },
    get: () => bridge._onloggingmessage,
  });

  return bridge;
};

// Mock the app-host-utils module
vi.mock("../../utils/app-host-utils", () => ({
  setupSandboxProxyIframe: vi.fn(),
}));

describe("<AppFrame />", () => {
  let mockIframe: Partial<HTMLIFrameElement>;
  let mockContentWindow: { postMessage: ReturnType<typeof vi.fn> };
  let onReadyResolve: () => void;
  let mockAppBridge: ReturnType<typeof createMockAppBridge>;

  const defaultProps: AppFrameProps = {
    html: "<html><body>Test</body></html>",
    sandbox: { url: new URL("http://localhost:8081/sandbox.html") },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    registeredOninitialized = null;
    registeredOnsizechange = null;
    registeredOnloggingmessage = null;
    mockAppBridge = createMockAppBridge();

    // Create mock contentWindow
    mockContentWindow = {
      postMessage: vi.fn(),
    };

    // Create a real iframe element and mock contentWindow via defineProperty
    const realIframe = document.createElement("iframe");
    Object.defineProperty(realIframe, "contentWindow", {
      get: () => mockContentWindow as unknown as Window,
      configurable: true,
    });
    mockIframe = realIframe;

    // Setup mock for setupSandboxProxyIframe
    const onReadyPromise = new Promise<void>((resolve) => {
      onReadyResolve = resolve;
    });

    vi.mocked(appHostUtils.setupSandboxProxyIframe).mockResolvedValue({
      iframe: mockIframe as HTMLIFrameElement,
      onReady: onReadyPromise,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(<AppFrame {...defaultProps} />);
    expect(document.querySelector("div")).toBeInTheDocument();
  });

  it("should call setupSandboxProxyIframe with sandbox URL", async () => {
    render(<AppFrame {...defaultProps} />);

    await waitFor(() => {
      expect(appHostUtils.setupSandboxProxyIframe).toHaveBeenCalledWith(
        defaultProps.sandbox.url
      );
    });
  });

  it("should send HTML to sandbox via postMessage when no appBridge", async () => {
    render(<AppFrame {...defaultProps} />);

    await act(async () => {
      onReadyResolve();
    });

    await waitFor(() => {
      expect(mockContentWindow.postMessage).toHaveBeenCalledWith(
        {
          jsonrpc: "2.0",
          method: "ui/notifications/sandbox-resource-ready",
          params: { html: defaultProps.html, csp: undefined },
        },
        "*"
      );
    });
  });

  it("should use AppBridge when provided", async () => {
    const props: AppFrameProps = {
      ...defaultProps,
      appBridge: mockAppBridge as any,
    };

    render(<AppFrame {...props} />);

    await act(async () => {
      onReadyResolve();
    });

    await waitFor(() => {
      expect(mockAppBridge.connect).toHaveBeenCalled();
    });
  });

  it("should send HTML via AppBridge.sendSandboxResourceReady", async () => {
    const props: AppFrameProps = {
      ...defaultProps,
      appBridge: mockAppBridge as any,
    };

    render(<AppFrame {...props} />);

    await act(async () => {
      onReadyResolve();
    });

    // Trigger initialization
    await act(async () => {
      registeredOninitialized?.();
    });

    await waitFor(() => {
      expect(mockAppBridge.sendSandboxResourceReady).toHaveBeenCalledWith({
        html: defaultProps.html,
        csp: undefined,
      });
    });
  });

  it("should call onInitialized with app info when app initializes", async () => {
    const onInitialized = vi.fn();
    const props: AppFrameProps = {
      ...defaultProps,
      appBridge: mockAppBridge as any,
      onInitialized,
    };

    render(<AppFrame {...props} />);

    await act(async () => {
      onReadyResolve();
    });

    await act(async () => {
      registeredOninitialized?.();
    });

    await waitFor(() => {
      expect(onInitialized).toHaveBeenCalledWith({
        appVersion: { name: "TestApp", version: "1.0.0" },
        appCapabilities: { tools: {} },
      });
    });
  });

  it("should send tool input after initialization", async () => {
    const toolInput = { foo: "bar" };
    const props: AppFrameProps = {
      ...defaultProps,
      appBridge: mockAppBridge as any,
      toolInput,
    };

    render(<AppFrame {...props} />);

    await act(async () => {
      onReadyResolve();
    });

    await act(async () => {
      registeredOninitialized?.();
    });

    await waitFor(() => {
      expect(mockAppBridge.sendToolInput).toHaveBeenCalledWith({
        arguments: toolInput,
      });
    });
  });

  it("should send tool result after initialization", async () => {
    const toolResult = { content: [{ type: "text", text: "result" }] };
    const props: AppFrameProps = {
      ...defaultProps,
      appBridge: mockAppBridge as any,
      toolResult: toolResult as any,
    };

    render(<AppFrame {...props} />);

    await act(async () => {
      onReadyResolve();
    });

    await act(async () => {
      registeredOninitialized?.();
    });

    await waitFor(() => {
      expect(mockAppBridge.sendToolResult).toHaveBeenCalledWith(toolResult);
    });
  });

  it("should call onSizeChange when size changes", async () => {
    const onSizeChange = vi.fn();
    const props: AppFrameProps = {
      ...defaultProps,
      appBridge: mockAppBridge as any,
      onSizeChange,
    };

    render(<AppFrame {...props} />);

    await act(async () => {
      onReadyResolve();
    });

    await act(async () => {
      registeredOnsizechange?.({ width: 800, height: 600 });
    });

    expect(onSizeChange).toHaveBeenCalledWith({ width: 800, height: 600 });
  });

  it("should call onLoggingMessage when logging message received", async () => {
    const onLoggingMessage = vi.fn();
    const props: AppFrameProps = {
      ...defaultProps,
      appBridge: mockAppBridge as any,
      onLoggingMessage,
    };

    render(<AppFrame {...props} />);

    await act(async () => {
      onReadyResolve();
    });

    const logParams = { level: "info", data: "test message" };
    await act(async () => {
      registeredOnloggingmessage?.(logParams);
    });

    expect(onLoggingMessage).toHaveBeenCalledWith(logParams);
  });

  it("should forward CSP to sandbox", async () => {
    const csp = {
      connectDomains: ["api.example.com"],
      resourceDomains: ["cdn.example.com"],
    };
    const props: AppFrameProps = {
      ...defaultProps,
      sandbox: { ...defaultProps.sandbox, csp },
      appBridge: mockAppBridge as any,
    };

    render(<AppFrame {...props} />);

    await act(async () => {
      onReadyResolve();
    });

    await act(async () => {
      registeredOninitialized?.();
    });

    await waitFor(() => {
      expect(mockAppBridge.sendSandboxResourceReady).toHaveBeenCalledWith({
        html: defaultProps.html,
        csp,
      });
    });
  });

  it("should call onerror when setup fails", async () => {
    const onerror = vi.fn();
    const error = new Error("Setup failed");

    vi.mocked(appHostUtils.setupSandboxProxyIframe).mockRejectedValue(error);

    render(<AppFrame {...defaultProps} onerror={onerror} />);

    await waitFor(() => {
      expect(onerror).toHaveBeenCalledWith(error);
    });
  });

  it("should display error message when error occurs", async () => {
    const error = new Error("Test error");
    vi.mocked(appHostUtils.setupSandboxProxyIframe).mockRejectedValue(error);

    render(<AppFrame {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();
    });
  });
});
