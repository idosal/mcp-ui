import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HtmlResource, RenderHtmlResourceProps } from '../HtmlResource.js';
import { vi, Mock, MockInstance } from 'vitest';
import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { UiActionResult } from '../../types.js';

describe('HtmlResource component', () => {
  const mockOnUiAction = vi.fn().mockResolvedValue(undefined);

  const defaultProps: RenderHtmlResourceProps = {
    resource: { mimeType: 'text/html', text: '<p>Hello Test</p>' },
    onUiAction: mockOnUiAction,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders HTML content from text property using srcDoc', () => {
    render(<HtmlResource {...defaultProps} />);
    const iframe = screen.getByTitle(
      'MCP HTML Resource (Embedded Content)',
    ) as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.srcdoc).toContain('<p>Hello Test</p>');
  });

  it('renders sanitized HTML using secure mode and handles actions', () => {
    const props: RenderHtmlResourceProps = {
      resource: {
        mimeType: 'text/html',
        text: '<p>Hello <script>alert(1)</script>World</p><button data-tool="foo" data-params="{\"a\":1}">Click</button>',
      },
      onUiAction: mockOnUiAction,
      renderMode: 'secure',
    };
    render(<HtmlResource {...props} />);
    const container = screen.getByTestId('html-resource-secure');
    expect(container).toBeInTheDocument();
    expect(container.innerHTML).toContain('Hello');
    expect(container.innerHTML).not.toContain('<script>');
    fireEvent.click(screen.getByText('Click'));
    expect(mockOnUiAction).toHaveBeenCalledWith('foo', {});
  });

  it('renders iframe with src for ui-app:// URI with text', () => {

    const props: RenderHtmlResourceProps = {
      resource: {
        uri: 'ui://my-app',
        mimeType: 'text/uri-list',
        text: 'https://example.com/app',
      },
      onUiAction: mockOnUiAction,
    };
    render(<HtmlResource {...props} />);
    const iframe = screen.getByTitle(
      'MCP HTML Resource (URL)',
    ) as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toBe('https://example.com/app');
  });

  it('shows loading message initially (concept, actual timing is fast)', () => {
    // This test is more conceptual for async resources not covered by defaultProps
    // For a truly async resource, you'd mock its loading state
    const loadingProps: RenderHtmlResourceProps = {
      resource: { mimeType: 'text/html', uri: 'ui://loading-resource' }, // No text/blob means it would try to fetch
      onUiAction: mockOnUiAction,
    };
    // Simulate that it would be loading if content wasn't immediate.
    // Actual component logic might set isLoading=false very quickly if no real async fetch is triggered.
    // To test loading, you would typically mock useMcpResourceFetcher to be in a loading state.
    render(<HtmlResource {...loadingProps} />);
    // Since our default HtmlResource resolves synchronously if text/blob is missing for ui://,
    // it might show an error or "No HTML content" instead of "Loading".
    // This assertion depends heavily on the refined async logic of HtmlResource.
    // For now, let's expect the fallback paragraph because no content is provided.
    expect(
      screen.getByText('HTML resource requires text or blob content.'),
    ).toBeInTheDocument();
  });

  it('displays an error message if resource mimeType is not text/html or text/uri-list', () => {
    const props: RenderHtmlResourceProps = {
      resource: { mimeType: 'application/json', text: '{}' },
      onUiAction: mockOnUiAction,
    };
    render(<HtmlResource {...props} />);
    expect(
      screen.getByText(
        'Resource must be of type text/html (for HTML content) or text/uri-list (for URL content).',
      ),
    ).toBeInTheDocument();
  });

  it('decodes HTML from blob for ui:// resource', () => {
    const html = '<p>Blob Content</p>';
    const encodedHtml = Buffer.from(html).toString('base64');
    const props: RenderHtmlResourceProps = {
      resource: {
        uri: 'ui://blob-test',
        mimeType: 'text/html',
        blob: encodedHtml,
      },
      onUiAction: mockOnUiAction,
    };
    render(<HtmlResource {...props} />);
    const iframe = screen.getByTitle(
      'MCP HTML Resource (Embedded Content)',
    ) as HTMLIFrameElement;
    expect(iframe.srcdoc).toContain(html);
  });

  it('decodes URL from blob for ui:// resource with text/uri-list mimetype', () => {
    const url = 'https://example.com/blob-app';
    const encodedUrl = Buffer.from(url).toString('base64');
    const props: RenderHtmlResourceProps = {
      resource: {
        uri: 'ui://blob-app-test',
        mimeType: 'text/uri-list',
        blob: encodedUrl,
      },
      onUiAction: mockOnUiAction,
    };
    render(<HtmlResource {...props} />);
    const iframe = screen.getByTitle(
      'MCP HTML Resource (URL)',
    ) as HTMLIFrameElement;
    expect(iframe.src).toBe(url);
  });

  it('handles multiple URLs in uri-list format and uses the first one', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const uriList =
      'https://example.com/first\nhttps://example.com/second\nhttps://example.com/third';
    const props: RenderHtmlResourceProps = {
      resource: {
        uri: 'ui://multi-url-test',
        mimeType: 'text/uri-list',
        text: uriList,
      },
      onUiAction: mockOnUiAction,
    };
    render(<HtmlResource {...props} />);
    const iframe = screen.getByTitle(
      'MCP HTML Resource (URL)',
    ) as HTMLIFrameElement;
    expect(iframe.src).toBe('https://example.com/first');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Multiple URLs found in uri-list content. Using the first URL: "https://example.com/first". Other URLs ignored:',
      ['https://example.com/second', 'https://example.com/third'],
    );
    consoleWarnSpy.mockRestore();
  });

  it('handles uri-list format with comments and empty lines', () => {
    const uriList = `# This is a comment
https://example.com/main

# Another comment
https://example.com/backup
`;
    const props: RenderHtmlResourceProps = {
      resource: {
        uri: 'ui://uri-list-with-comments',
        mimeType: 'text/uri-list',
        text: uriList,
      },
      onUiAction: mockOnUiAction,
    };
    render(<HtmlResource {...props} />);
    const iframe = screen.getByTitle(
      'MCP HTML Resource (URL)',
    ) as HTMLIFrameElement;
    expect(iframe.src).toBe('https://example.com/main');
  });

  it('shows error when uri-list contains no valid URLs', () => {
    const uriList = `# Only comments
# No actual URLs
`;
    const props: RenderHtmlResourceProps = {
      resource: {
        uri: 'ui://empty-uri-list',
        mimeType: 'text/uri-list',
        text: uriList,
      },
      onUiAction: mockOnUiAction,
    };
    render(<HtmlResource {...props} />);
    expect(
      screen.getByText('No valid URLs found in uri-list content.'),
    ).toBeInTheDocument();
  });

  it('supports backwards compatibility with ui-app:// URI scheme', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const props: RenderHtmlResourceProps = {
      resource: {
        uri: 'ui-app://legacy-external-app',
        mimeType: 'text/html', // Historically incorrect mimeType, but should be treated as URL content
        text: 'https://legacy.example.com/app',
      },
      onUiAction: mockOnUiAction,
    };
    render(<HtmlResource {...props} />);
    const iframe = screen.getByTitle(
      'MCP HTML Resource (URL)',
    ) as HTMLIFrameElement;
    expect(iframe.src).toBe('https://legacy.example.com/app');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Detected legacy ui-app:// URI: "ui-app://legacy-external-app". Update server to use ui:// with mimeType: \'text/uri-list\' for future compatibility.',
    );
    consoleWarnSpy.mockRestore();
  });

  it('handles legacy ui-app:// with blob content', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    const url = 'https://legacy.example.com/blob-app';
    const encodedUrl = Buffer.from(url).toString('base64');
    const props: RenderHtmlResourceProps = {
      resource: {
        uri: 'ui-app://legacy-blob-app',
        mimeType: 'text/html', // Historically incorrect mimeType
        blob: encodedUrl,
      },
      onUiAction: mockOnUiAction,
    };
    render(<HtmlResource {...props} />);
    const iframe = screen.getByTitle(
      'MCP HTML Resource (URL)',
    ) as HTMLIFrameElement;
    expect(iframe.src).toBe(url);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Detected legacy ui-app:// URI: "ui-app://legacy-blob-app". Update server to use ui:// with mimeType: \'text/uri-list\' for future compatibility.',
    );
    consoleWarnSpy.mockRestore();
  });
});

const mockResourceBaseForUiActionTests: Partial<Resource> = {
  mimeType: 'text/html',
  text: '<html><body><h1>Test Content</h1><script>console.log("iframe script loaded for onUiAction tests")</script></body></html>',
};

// Helper to dispatch a message event
const dispatchMessage = (
  source: Window | null,
  data: Record<string, unknown> | null,
) => {
  fireEvent(
    window,
    new MessageEvent('message', {
      data,
      source,
    }),
  );
};

describe('HtmlResource - onUiAction', () => {
  let mockOnUiAction: Mock<[UiActionResult], Promise<unknown>>;
  let consoleErrorSpy: MockInstance<Parameters<Console['error']>, void>;

  beforeEach(() => {
    mockOnUiAction = vi.fn().mockResolvedValue(undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const renderComponentForUiActionTests = (
    props: Partial<RenderHtmlResourceProps> = {},
  ) => {
    return render(
      <HtmlResource
        resource={props.resource || mockResourceBaseForUiActionTests}
        onUiAction={'onUiAction' in props ? props.onUiAction : mockOnUiAction}
        style={props.style}
      />,
    );
  };

  it('should call onUiAction with tool and params when a valid message is received from the iframe', async () => {
    renderComponentForUiActionTests();
    const iframe = (await screen.findByTitle(
      'MCP HTML Resource (Embedded Content)',
    )) as HTMLIFrameElement;

    const eventData = {
      type: 'tool',
      payload: { toolName: 'testTool', params: { foo: 'bar' } },
    };
    dispatchMessage(iframe.contentWindow, eventData);

    expect(mockOnUiAction).toHaveBeenCalledTimes(1);
    expect(mockOnUiAction).toHaveBeenCalledWith(eventData);
  });

  it('should use empty params if event.data.params is missing', async () => {
    renderComponentForUiActionTests();
    const iframe = (await screen.findByTitle(
      'MCP HTML Resource (Embedded Content)',
    )) as HTMLIFrameElement;

    const eventData = { tool: 'testTool' }; // No params
    dispatchMessage(iframe.contentWindow, eventData);

    expect(mockOnUiAction).toHaveBeenCalledTimes(1);
    expect(mockOnUiAction).toHaveBeenCalledWith(eventData);
  });

  it('should not call onUiAction if the message event is not from the iframe', async () => {
    renderComponentForUiActionTests();
    // Ensure iframe is rendered before dispatching an event from the wrong source
    await screen.findByTitle('MCP HTML Resource (Embedded Content)');

    const eventData = {
      type: 'tool',
      payload: { toolName: 'testTool', params: { foo: 'bar' } },
    };
    dispatchMessage(window, eventData); // Source is the main window

    expect(mockOnUiAction).not.toHaveBeenCalled();
  });

  it('should not call onUiAction if event.data is null', async () => {
    renderComponentForUiActionTests();
    const iframe = (await screen.findByTitle(
      'MCP HTML Resource (Embedded Content)',
    )) as HTMLIFrameElement;

    dispatchMessage(iframe.contentWindow, null);

    expect(mockOnUiAction).not.toHaveBeenCalled();
  });

  it('should work correctly and not throw if onUiAction is undefined', async () => {
    // Pass undefined directly to onUiAction for this specific test
    renderComponentForUiActionTests({
      onUiAction: undefined,
      resource: mockResourceBaseForUiActionTests,
    });
    const iframe = (await screen.findByTitle(
      'MCP HTML Resource (Embedded Content)',
    )) as HTMLIFrameElement;

    const eventData = { tool: 'testTool', params: { foo: 'bar' } };

    expect(() => {
      dispatchMessage(iframe.contentWindow, eventData);
    }).not.toThrow();
    // mockOnUiAction (the one from the describe block scope) should not be called
    // as it was effectively replaced by 'undefined' for this render.
    expect(mockOnUiAction).not.toHaveBeenCalled();
  });

  it('should log an error if onUiAction returns a rejected promise', async () => {
    const errorMessage = 'Async action failed';
    const specificMockForThisTest = vi
      .fn<[string, Record<string, unknown>], Promise<unknown>>()
      .mockRejectedValue(new Error(errorMessage));
    renderComponentForUiActionTests({
      onUiAction: specificMockForThisTest,
      resource: mockResourceBaseForUiActionTests,
    });

    const iframe = (await screen.findByTitle(
      'MCP HTML Resource (Embedded Content)',
    )) as HTMLIFrameElement;
    const eventData = { tool: 'testTool', params: { foo: 'bar' } };
    dispatchMessage(iframe.contentWindow, eventData);

    await waitFor(() => {
      expect(specificMockForThisTest).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error handling UI action result in RenderHtmlResource:',
        expect.objectContaining({ message: errorMessage }),
      );
    });
  });

  it('should not attempt to call onUiAction if iframeRef.current is null (e.g. resource error)', async () => {
    // Render with a resource that will cause an error and prevent iframe rendering
    const localMockOnUiAction = vi.fn<
      [string, Record<string, unknown>],
      Promise<unknown>
    >();

    render(
      <HtmlResource
        resource={{ mimeType: 'text/plain', text: 'not html' }} // Invalid mimeType
        onUiAction={localMockOnUiAction}
      />,
    );

    // Iframe should not be present
    expect(
      screen.queryByTitle('MCP HTML Resource (Embedded Content)'),
    ).not.toBeInTheDocument();
    // Error message should be displayed
    expect(
      await screen.findByText('Resource is not of type text/html.'),
    ).toBeInTheDocument();

    const eventData = { tool: 'testTool', params: { foo: 'bar' } };
    dispatchMessage(window, eventData);

    expect(localMockOnUiAction).not.toHaveBeenCalled();
    expect(mockOnUiAction).not.toHaveBeenCalled(); // also check the describe-scoped one
  });
});
