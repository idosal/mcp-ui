import { render, screen, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";

import { AppRenderer, type AppRendererProps } from "../AppRenderer";
import * as appHostUtils from "../../utils/app-host-utils";

// Mock AppFrame
vi.mock("../AppFrame", () => ({
  AppFrame: vi.fn(({ html, sandbox, toolInput, toolResult }) => (
    <div data-testid="app-frame" data-html={html} data-sandbox-url={sandbox?.url?.href}>
      {toolInput && <span data-testid="tool-input">{JSON.stringify(toolInput)}</span>}
      {toolResult && <span data-testid="tool-result">{JSON.stringify(toolResult)}</span>}
    </div>
  )),
}));

// Mock app-host-utils
vi.mock("../../utils/app-host-utils", () => ({
  getToolUiResourceUri: vi.fn(),
  readToolUiResourceHtml: vi.fn(),
}));

// Mock AppBridge constructor
vi.mock("@modelcontextprotocol/ext-apps/app-bridge", () => ({
  AppBridge: vi.fn().mockImplementation(() => ({
    onmessage: null,
    onopenlink: null,
    onloggingmessage: null,
  })),
}));

// Mock MCP Client
const mockClient = {
  getServerCapabilities: vi.fn().mockReturnValue({
    tools: {},
    resources: {},
  }),
};

describe("<AppRenderer />", () => {
  const defaultProps: AppRendererProps = {
    client: mockClient as any,
    toolName: "test-tool",
    sandbox: { url: new URL("http://localhost:8081/sandbox.html") },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(appHostUtils.getToolUiResourceUri).mockResolvedValue({
      uri: "ui://test-tool",
    });
    vi.mocked(appHostUtils.readToolUiResourceHtml).mockResolvedValue(
      "<html><body>Test Tool UI</body></html>"
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render AppFrame after fetching HTML", async () => {
    render(<AppRenderer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("app-frame")).toBeInTheDocument();
    });
  });

  it("should fetch resource URI for the tool", async () => {
    render(<AppRenderer {...defaultProps} />);

    await waitFor(() => {
      expect(appHostUtils.getToolUiResourceUri).toHaveBeenCalledWith(
        mockClient,
        "test-tool"
      );
    });
  });

  it("should read HTML from resource URI", async () => {
    render(<AppRenderer {...defaultProps} />);

    await waitFor(() => {
      expect(appHostUtils.readToolUiResourceHtml).toHaveBeenCalledWith(
        mockClient,
        { uri: "ui://test-tool" }
      );
    });
  });

  it("should pass fetched HTML to AppFrame", async () => {
    render(<AppRenderer {...defaultProps} />);

    await waitFor(() => {
      const appFrame = screen.getByTestId("app-frame");
      expect(appFrame).toHaveAttribute(
        "data-html",
        "<html><body>Test Tool UI</body></html>"
      );
    });
  });

  it("should use provided toolResourceUri instead of fetching", async () => {
    const props: AppRendererProps = {
      ...defaultProps,
      toolResourceUri: "ui://custom-uri",
    };

    render(<AppRenderer {...props} />);

    await waitFor(() => {
      expect(appHostUtils.getToolUiResourceUri).not.toHaveBeenCalled();
      expect(appHostUtils.readToolUiResourceHtml).toHaveBeenCalledWith(
        mockClient,
        { uri: "ui://custom-uri" }
      );
    });
  });

  it("should use provided HTML directly without fetching", async () => {
    const props: AppRendererProps = {
      ...defaultProps,
      html: "<html><body>Pre-fetched HTML</body></html>",
    };

    render(<AppRenderer {...props} />);

    await waitFor(() => {
      expect(appHostUtils.getToolUiResourceUri).not.toHaveBeenCalled();
      expect(appHostUtils.readToolUiResourceHtml).not.toHaveBeenCalled();
      expect(screen.getByTestId("app-frame")).toHaveAttribute(
        "data-html",
        "<html><body>Pre-fetched HTML</body></html>"
      );
    });
  });

  it("should pass sandbox config to AppFrame", async () => {
    render(<AppRenderer {...defaultProps} />);

    await waitFor(() => {
      const appFrame = screen.getByTestId("app-frame");
      expect(appFrame).toHaveAttribute(
        "data-sandbox-url",
        "http://localhost:8081/sandbox.html"
      );
    });
  });

  it("should pass toolInput to AppFrame", async () => {
    const toolInput = { query: "test query" };
    const props: AppRendererProps = {
      ...defaultProps,
      toolInput,
    };

    render(<AppRenderer {...props} />);

    await waitFor(() => {
      const toolInputEl = screen.getByTestId("tool-input");
      expect(toolInputEl).toHaveTextContent(JSON.stringify(toolInput));
    });
  });

  it("should pass toolResult to AppFrame", async () => {
    const toolResult = { content: [{ type: "text", text: "result" }] };
    const props: AppRendererProps = {
      ...defaultProps,
      toolResult: toolResult as any,
    };

    render(<AppRenderer {...props} />);

    await waitFor(() => {
      const toolResultEl = screen.getByTestId("tool-result");
      expect(toolResultEl).toHaveTextContent(JSON.stringify(toolResult));
    });
  });

  it("should handle deprecated sandboxProxyUrl prop", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const props = {
      client: mockClient as any,
      toolName: "test-tool",
      sandboxProxyUrl: new URL("http://localhost:8081/sandbox.html"),
    } as AppRendererProps;

    render(<AppRenderer {...props} />);

    await waitFor(() => {
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("sandboxProxyUrl is deprecated")
      );
    });

    consoleWarn.mockRestore();
  });

  it("should display error when tool has no UI resource", async () => {
    vi.mocked(appHostUtils.getToolUiResourceUri).mockResolvedValue(null);

    render(<AppRenderer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(/has no UI resource/)).toBeInTheDocument();
    });
  });

  it("should call onerror when resource fetch fails", async () => {
    const onerror = vi.fn();
    const error = new Error("Fetch failed");
    vi.mocked(appHostUtils.readToolUiResourceHtml).mockRejectedValue(error);

    render(<AppRenderer {...defaultProps} onerror={onerror} />);

    await waitFor(() => {
      expect(onerror).toHaveBeenCalledWith(error);
    });
  });

  it("should return null while loading", () => {
    // Make the promise never resolve
    vi.mocked(appHostUtils.getToolUiResourceUri).mockReturnValue(
      new Promise(() => {})
    );

    const { container } = render(<AppRenderer {...defaultProps} />);

    // Should render nothing while loading
    expect(container.firstChild).toBeNull();
  });
});
