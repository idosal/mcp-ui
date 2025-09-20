import { describe, it, expect, vi } from 'vitest';
import { processHTMLResource, processRemoteDOMResource } from '../processResource';

describe('processHTMLResource', () => {
  describe('text/uri-list', () => {
    it('should process a valid https URL from text', () => {
      const resource = {
        mimeType: 'text/uri-list' as const,
        text: 'https://example.com',
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBeUndefined();
      expect(result.iframeSrc).toBe('https://example.com');
      expect(result.iframeRenderMode).toBe('src');
    });

    it('should process a valid http URL', () => {
      const resource = {
        mimeType: 'text/uri-list',
        text: 'http://example.com',
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBeUndefined();
      expect(result.iframeSrc).toBe('http://example.com');
      expect(result.iframeRenderMode).toBe('src');
    });

    it('should return an error for an invalid URL (javascript:alert)', () => {
      const resource = {
        mimeType: 'text/uri-list',
        text: 'javascript:alert("pwned")',
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBe('No valid URLs found in uri-list content.');
      expect(result.iframeSrc).toBeUndefined();
    });

    it('should return an error for a blob URL', () => {
      const resource = {
        mimeType: 'text/uri-list',
        text: 'blob:https://example.com/some-uuid',
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBe('No valid URLs found in uri-list content.');
      expect(result.iframeSrc).toBeUndefined();
    });

    it('should extract the first valid URL from a list', () => {
      const resource = {
        mimeType: 'text/uri-list',
        text: '# comment\ninvalid-url\nhttps://first-valid.com\nhttps://second-valid.com',
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBeUndefined();
      expect(result.iframeSrc).toBe('https://first-valid.com');
    });

    it('should handle empty or commented-out content', () => {
      const resource = {
        mimeType: 'text/uri-list',
        text: '# just a comment\n# another comment',
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBe('No valid URLs found in uri-list content.');
    });

    it('should return error for content with no valid URLs', () => {
      const resource = {
        mimeType: 'text/uri-list',
        text: 'just-some-string\nanother-string',
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBe('No valid URLs found in uri-list content.');
    });

    it('should process a valid https URL from blob', () => {
      const resource = {
        mimeType: 'text/uri-list' as const,
        blob: btoa('https://example.com'),
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBeUndefined();
      expect(result.iframeSrc).toBe('https://example.com');
      expect(result.iframeRenderMode).toBe('src');
    });

    it('should return an error for invalid blob content', () => {
      const resource = {
        mimeType: 'text/uri-list' as const,
        blob: 'not-base64',
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBe('Error decoding URL from blob.');
      expect(result.iframeSrc).toBeUndefined();
    });

    it('should return an error for missing text and blob', () => {
      const resource = {
        mimeType: 'text/uri-list' as const,
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBe(
        'URL resource expects a non-empty text or blob field containing the URL.',
      );
    });

    it('should return an error for empty text content', () => {
      const resource = {
        mimeType: 'text/uri-list' as const,
        text: ' ',
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBe(
        'URL resource expects a non-empty text or blob field containing the URL.',
      );
    });

    it('should extract the first valid URL from a blob', () => {
      const resource = {
        mimeType: 'text/uri-list' as const,
        blob: btoa('# comment\ninvalid-url\nhttps://first-valid.com\nhttps://second-valid.com'),
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBeUndefined();
      expect(result.iframeSrc).toBe('https://first-valid.com');
    });

    it('should warn when multiple URLs are provided and use the first one', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const resource = {
        mimeType: 'text/uri-list' as const,
        text: 'https://first-valid.com\nhttps://second-valid.com',
      };
      const result = processHTMLResource(resource);
      expect(result.iframeSrc).toBe('https://first-valid.com');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Multiple URLs found in uri-list content. Using the first URL: "https://first-valid.com". Other URLs ignored:',
        ['https://second-valid.com'],
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('text/html', () => {
    it('should process HTML from text content', () => {
      const html = '<h1>Hello World</h1>';
      const resource = {
        mimeType: 'text/html' as const,
        text: html,
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBeUndefined();
      expect(result.htmlString).toBe(html);
      expect(result.iframeRenderMode).toBe('srcDoc');
    });

    it('should process HTML from blob content', () => {
      const html = '<h1>Hello from Blob</h1>';
      const resource = {
        mimeType: 'text/html' as const,
        blob: btoa(html),
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBeUndefined();
      expect(result.htmlString).toBe(html);
      expect(result.iframeRenderMode).toBe('srcDoc');
    });

    it('should return an error for invalid blob content', () => {
      const resource = {
        mimeType: 'text/html' as const,
        blob: 'not-base64',
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBe('Error decoding HTML content from blob.');
      expect(result.htmlString).toBeUndefined();
    });

    it('should return an error for missing text and blob', () => {
      const resource = {
        mimeType: 'text/html' as const,
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBe('HTML resource requires text or blob content.');
    });

    describe('proxy', () => {
      it('should use proxy when provided for external URLs', () => {
        const resource = {
          mimeType: 'text/uri-list',
          text: 'https://example.com',
        };
        const result = processHTMLResource(resource, 'https://proxy.mcpui.dev/');
        expect(result.error).toBeUndefined();
        expect(result.iframeSrc).toBe('https://proxy.mcpui.dev/?url=https%3A%2F%2Fexample.com');
        expect(result.iframeRenderMode).toBe('src');
      });

      it('should handle proxy with existing query parameters', () => {
        const resource = {
          mimeType: 'text/uri-list',
          text: 'https://example.com',
        };
        const result = processHTMLResource(resource, 'https://proxy.mcpui.dev/?a=1&b=2');
        expect(result.error).toBeUndefined();
        expect(result.iframeSrc).toBe(
          'https://proxy.mcpui.dev/?a=1&b=2&url=https%3A%2F%2Fexample.com',
        );
        expect(result.iframeRenderMode).toBe('src');
      });

      it('should fallback to direct URL if proxy is invalid', () => {
        const resource = {
          mimeType: 'text/uri-list',
          text: 'https://example.com',
        };
        const result = processHTMLResource(resource, 'not-a-valid-url');
        expect(result.error).toBeUndefined();
        expect(result.iframeSrc).toBe('https://example.com');
        expect(result.iframeRenderMode).toBe('src');
      });

      it('should not use proxy when proxy is empty string', () => {
        const resource = {
          mimeType: 'text/uri-list',
          text: 'https://example.com',
        };
        const result = processHTMLResource(resource, '');
        expect(result.error).toBeUndefined();
        expect(result.iframeSrc).toBe('https://example.com');
        expect(result.iframeRenderMode).toBe('src');
      });

      it('should not use proxy when proxy is not provided', () => {
        const resource = {
          mimeType: 'text/uri-list',
          text: 'https://example.com',
        };
        const result = processHTMLResource(resource);
        expect(result.error).toBeUndefined();
        expect(result.iframeSrc).toBe('https://example.com');
        expect(result.iframeRenderMode).toBe('src');
      });
    });
  });

  describe('Unsupported mimeType', () => {
    it('should return an error for an unsupported mimeType', () => {
      const resource = {
        mimeType: 'application/json' as const,
        text: '{}',
      };
      const result = processHTMLResource(resource);
      expect(result.error).toBe(
        'Resource must be of type text/html (for HTML content) or text/uri-list (for URL content).',
      );
    });
  });
});

describe('processRemoteDOMResource', () => {
  it('should process code from text content', () => {
    const code = 'const el = 1;';
    const resource = {
      text: code,
    };
    const result = processRemoteDOMResource(resource);
    expect(result.error).toBeUndefined();
    expect(result.code).toBe(code);
  });

  it('should process code from blob content', () => {
    const code = 'const el = 2;';
    const resource = {
      blob: btoa(code),
    };
    const result = processRemoteDOMResource(resource);
    expect(result.error).toBeUndefined();
    expect(result.code).toBe(code);
  });

  it('should return an error for invalid blob content', () => {
    const resource = {
      blob: 'not-base64',
    };
    const result = processRemoteDOMResource(resource);
    expect(result.error).toBe('Error decoding remote DOM content from blob.');
    expect(result.code).toBeUndefined();
  });

  it('should return an error for missing text and blob', () => {
    const resource = {};
    const result = processRemoteDOMResource(resource);
    expect(result.error).toBe('Remote DOM resource requires non-empty text or blob content.');
  });

  it('should return an error for empty text content', () => {
    const resource = {
      text: '   ',
    };
    const result = processRemoteDOMResource(resource);
    expect(result.error).toBe('Remote DOM resource requires non-empty text or blob content.');
  });
});
