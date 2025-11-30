import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createUIResource } from '../../index';
import { wrapHtmlWithAdapters, getAdapterMimeType } from '../../utils';

describe('Adapter Integration', () => {
  describe('Apps SDK Adapter', () => {
  describe('createUIResource with adapters', () => {
    it('should create UI resource without adapter by default', () => {
      const resource = createUIResource({
        uri: 'ui://test',
        content: {
          type: 'rawHtml',
          htmlString: '<div>Test</div>',
        },
        encoding: 'text',
      });

      expect(resource.resource.text).toBe('<div>Test</div>');
      expect(resource.resource.text).not.toContain('MCPUIAppsSdkAdapter');
    });

    it('should wrap HTML with Apps SDK adapter when enabled', () => {
      const resource = createUIResource({
        uri: 'ui://test',
        content: {
          type: 'rawHtml',
          htmlString: '<div>Test</div>',
        },
        encoding: 'text',
        adapters: {
          appsSdk: {
            enabled: true,
          },
        },
      });

      expect(resource.resource.text).toContain('<script>');
      expect(resource.resource.text).toContain('</script>');
      expect(resource.resource.text).toContain('<div>Test</div>');
    });

    it('should pass adapter config to the wrapper', () => {
      const resource = createUIResource({
        uri: 'ui://test',
        content: {
          type: 'rawHtml',
          htmlString: '<div>Test</div>',
        },
        encoding: 'text',
        adapters: {
          appsSdk: {
            enabled: true,
            config: {
              timeout: 5000,
              intentHandling: 'ignore',
              hostOrigin: 'https://custom.com',
            },
          },
        },
      });

      const html = resource.resource.text as string;
      expect(html).toContain('5000');
      expect(html).toContain('ignore');
      expect(html).toContain('https://custom.com');
    });

    it('should not wrap when adapter is disabled', () => {
      const resource = createUIResource({
        uri: 'ui://test',
        content: {
          type: 'rawHtml',
          htmlString: '<div>Test</div>',
        },
        encoding: 'text',
        adapters: {
          appsSdk: {
            enabled: false,
          },
        },
      });

      expect(resource.resource.text).toBe('<div>Test</div>');
    });

    it('should work with HTML containing head tag', () => {
      const resource = createUIResource({
        uri: 'ui://test',
        content: {
          type: 'rawHtml',
          htmlString: '<html><head><title>Test</title></head><body>Content</body></html>',
        },
        encoding: 'text',
        adapters: {
          appsSdk: {
            enabled: true,
          },
        },
      });

      const html = resource.resource.text as string;
      expect(html).toContain('<head>');
      expect(html).toContain('<script>');
      // Script should be injected after <head> tag
      const headIndex = html.indexOf('<head>');
      const scriptIndex = html.indexOf('<script>');
      expect(scriptIndex).toBeGreaterThan(headIndex);
    });

    it('should work with HTML without head tag', () => {
      const resource = createUIResource({
        uri: 'ui://test',
        content: {
          type: 'rawHtml',
          htmlString: '<div>Simple content</div>',
        },
        encoding: 'text',
        adapters: {
          appsSdk: {
            enabled: true,
          },
        },
      });

      const html = resource.resource.text as string;
      expect(html).toContain('<script>');
      expect(html).toContain('<div>Simple content</div>');
    });

    it('should fetch and convert external URL resources when adapter is enabled', async () => {
      // Mock fetch to return HTML content
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => '<html><head><title>Test</title></head><body>Content</body></html>',
      });
      vi.stubGlobal('fetch', mockFetch);

      const resourcePromise = createUIResource({
        uri: 'ui://test',
        content: {
          type: 'externalUrl',
          iframeUrl: 'https://example.com',
        },
        encoding: 'text',
        adapters: {
          appsSdk: {
            enabled: true,
          },
        },
      });

      // Should return a Promise when adapters are enabled
      expect(resourcePromise).toBeInstanceOf(Promise);

      const resource = await resourcePromise;

      // Should have fetched the URL
      expect(mockFetch).toHaveBeenCalledWith('https://example.com', expect.any(Object));

      // Should be converted to rawHtml (not externalUrl)
      expect(resource.resource.mimeType).toBe('text/html+skybridge');
        expect(resource.resource.text).toContain('<script>');
        expect(resource.resource.text).toContain('MCPUIAppsSdkAdapter');
        // Base tag should be added for relative URL resolution
        expect(resource.resource.text).toContain('<base href="https://example.com/">');
        expect(resource.resource.text).toContain('Content');
    });

    it('should not affect external URL resources when adapter is disabled', () => {
      const resource = createUIResource({
        uri: 'ui://test',
        content: {
          type: 'externalUrl',
          iframeUrl: 'https://example.com',
        },
        encoding: 'text',
        // No adapters
      });

      // External URLs without adapters should remain as-is (synchronous)
      expect(resource.resource.mimeType).toBe('text/uri-list');
      expect(resource.resource.text).toBe('https://example.com');
      expect(resource.resource.text).not.toContain('<script>');
    });

    it('should not affect remote DOM resources', () => {
      const resource = createUIResource({
        uri: 'ui://test',
        content: {
          type: 'remoteDom',
          script: 'console.log("test")',
          framework: 'react',
        },
        encoding: 'text',
        adapters: {
          appsSdk: {
            enabled: true,
          },
        },
      });

      // Remote DOM scripts should not be wrapped
      expect(resource.resource.text).toBe('console.log("test")');
      expect(resource.resource.text).not.toContain('MCPUIAppsSdkAdapter');
    });
  });

  describe('wrapHtmlWithAdapters', () => {
    it('should return original HTML when no adapters provided', () => {
      const html = '<div>Test</div>';
      const result = wrapHtmlWithAdapters(html);
      expect(result).toBe(html);
    });

    it('should return original HTML when adapters config is empty', () => {
      const html = '<div>Test</div>';
      const result = wrapHtmlWithAdapters(html, {});
      expect(result).toBe(html);
    });

    it('should wrap HTML with Apps SDK adapter', () => {
      const html = '<div>Test</div>';
      const result = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
        },
      });

      expect(result).toContain('<script>');
      expect(result).toContain('</script>');
      expect(result).toContain(html);
    });

    it('should inject script in head tag if present', () => {
      const html = '<html><head></head><body><div>Test</div></body></html>';
      const result = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
        },
      });

      const headIndex = result.indexOf('<head>');
      const scriptIndex = result.indexOf('<script>');
      expect(scriptIndex).toBeGreaterThan(headIndex);
      expect(scriptIndex).toBeLessThan(result.indexOf('</head>'));
    });

    it('should create head tag if html tag present but no head', () => {
      const html = '<html><body><div>Test</div></body></html>';
      const result = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
        },
      });

      expect(result).toContain('<head>');
      expect(result).toContain('<script>');
    });

    it('should prepend script if no html structure', () => {
      const html = '<div>Test</div>';
      const result = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
        },
      });

      expect(result.indexOf('<script>')).toBe(0);
    });

    it('should handle multiple adapter configurations', () => {
      const html = '<div>Test</div>';

      // Even though we only have appsSdk now, test that the structure supports multiple
      const result = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
          config: {
            timeout: 5000,
          },
        },
        // Future adapters would go here
      });

      expect(result).toContain('<script>');
      expect(result).toContain('5000');
    });

    it('should pass config to adapter script', () => {
      const html = '<div>Test</div>';
      const result = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
          config: {
            timeout: 10000,
            intentHandling: 'ignore',
            hostOrigin: 'https://test.com',
          },
        },
      });

      expect(result).toContain('10000');
      expect(result).toContain('ignore');
      expect(result).toContain('https://test.com');
    });
  });

  describe('getAdapterMimeType', () => {
    it('should return undefined when no adapters provided', () => {
      const result = getAdapterMimeType();
      expect(result).toBeUndefined();
    });

    it('should return undefined when adapters config is empty', () => {
      const result = getAdapterMimeType({});
      expect(result).toBeUndefined();
    });

    it('should return default mime type for Apps SDK adapter', () => {
      const result = getAdapterMimeType({
        appsSdk: {
          enabled: true,
        },
      });

      expect(result).toBe('text/html+skybridge');
    });

    it('should return custom mime type when provided', () => {
      const result = getAdapterMimeType({
        appsSdk: {
          enabled: true,
          mimeType: 'text/html+custom',
        },
      });

      expect(result).toBe('text/html+custom');
    });
  });

  describe('Type Safety', () => {
    it('should enforce valid adapter configuration', () => {
      // This test verifies TypeScript compilation
      const validConfig = createUIResource({
        uri: 'ui://test',
        content: {
          type: 'rawHtml',
          htmlString: '<div>Test</div>',
        },
        encoding: 'text',
        adapters: {
          appsSdk: {
            enabled: true,
            config: {
              timeout: 5000,
              intentHandling: 'prompt',
              hostOrigin: 'https://example.com',
            },
          },
        },
      });

      expect(validConfig).toBeDefined();
    });

    it('should handle optional adapter config', () => {
      const minimalConfig = createUIResource({
        uri: 'ui://test',
        content: {
          type: 'rawHtml',
          htmlString: '<div>Test</div>',
        },
        encoding: 'text',
        adapters: {
          appsSdk: {
            enabled: true,
            // config is optional
          },
        },
      });

      expect(minimalConfig).toBeDefined();
    });
  });
  });

  describe('MCP Apps Adapter', () => {
    describe('createUIResource with MCP Apps adapter', () => {
      it('should wrap HTML with MCP Apps adapter when enabled', () => {
        const resource = createUIResource({
          uri: 'ui://test',
          content: {
            type: 'rawHtml',
            htmlString: '<div>Test</div>',
          },
          encoding: 'text',
          adapters: {
            mcpApps: {
              enabled: true,
            },
          },
        });

        expect(resource.resource.text).toContain('<script>');
        expect(resource.resource.text).toContain('</script>');
        expect(resource.resource.text).toContain('<div>Test</div>');
        expect(resource.resource.text).toContain('McpAppsAdapter');
      });

      it('should pass adapter config to the wrapper', () => {
        const resource = createUIResource({
          uri: 'ui://test',
          content: {
            type: 'rawHtml',
            htmlString: '<div>Test</div>',
          },
          encoding: 'text',
          adapters: {
            mcpApps: {
              enabled: true,
              config: {
                timeout: 5000,
              },
            },
          },
        });

        const html = resource.resource.text as string;
        expect(html).toContain('5000');
      });

      it('should not wrap when adapter is disabled', () => {
        const resource = createUIResource({
          uri: 'ui://test',
          content: {
            type: 'rawHtml',
            htmlString: '<div>Test</div>',
          },
          encoding: 'text',
          adapters: {
            mcpApps: {
              enabled: false,
            },
          },
        });

        expect(resource.resource.text).toBe('<div>Test</div>');
      });

      it('should fetch and convert external URL resources when adapter is enabled', async () => {
        // Mock fetch to return HTML content
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => '<html><head><title>Test</title></head><body>Content</body></html>',
        });
        vi.stubGlobal('fetch', mockFetch);

        const resourcePromise = createUIResource({
          uri: 'ui://test',
          content: {
            type: 'externalUrl',
            iframeUrl: 'https://example.com',
          },
          encoding: 'text',
          adapters: {
            mcpApps: {
              enabled: true,
            },
          },
        });

        // Should return a Promise when adapters are enabled
        expect(resourcePromise).toBeInstanceOf(Promise);

        const resource = await resourcePromise;

        // Should have fetched the URL
        expect(mockFetch).toHaveBeenCalledWith('https://example.com', expect.any(Object));

        // Should be converted to rawHtml (not externalUrl)
        expect(resource.resource.mimeType).toBe('text/html+mcp');
        expect(resource.resource.text).toContain('<script>');
        expect(resource.resource.text).toContain('McpAppsAdapter');
        // Base tag should be added for relative URL resolution
        expect(resource.resource.text).toContain('<base href="https://example.com/">');
        expect(resource.resource.text).toContain('Content');
      });
    });

    describe('wrapHtmlWithAdapters with MCP Apps', () => {
      it('should wrap HTML with MCP Apps adapter', () => {
        const html = '<div>Test</div>';
        const result = wrapHtmlWithAdapters(html, {
          mcpApps: {
            enabled: true,
          },
        });

        expect(result).toContain('<script>');
        expect(result).toContain('</script>');
        expect(result).toContain(html);
        expect(result).toContain('McpAppsAdapter');
      });

      it('should pass config to MCP Apps adapter script', () => {
        const html = '<div>Test</div>';
        const result = wrapHtmlWithAdapters(html, {
          mcpApps: {
            enabled: true,
            config: {
              timeout: 10000,
            },
          },
        });

        expect(result).toContain('10000');
      });
    });

    describe('getAdapterMimeType with MCP Apps', () => {
      it('should return text/html+mcp for MCP Apps adapter', () => {
        const result = getAdapterMimeType({
          mcpApps: {
            enabled: true,
          },
        });

        expect(result).toBe('text/html+mcp');
      });
    });

    describe('Type Safety', () => {
      it('should enforce valid MCP Apps adapter configuration', () => {
        const validConfig = createUIResource({
          uri: 'ui://test',
          content: {
            type: 'rawHtml',
            htmlString: '<div>Test</div>',
          },
          encoding: 'text',
          adapters: {
            mcpApps: {
              enabled: true,
              config: {
                timeout: 5000,
              },
            },
          },
        });

        expect(validConfig).toBeDefined();
      });
    });
  });

  describe('Adapter Mutual Exclusivity', () => {
    it('should not allow both adapters to be enabled (TypeScript enforced)', () => {
      // This test documents the expected behavior - TypeScript should prevent this
      // The AdaptersConfig type is a discriminated union that prevents both adapters

      // Valid: only appsSdk
      const appsSdkOnly = createUIResource({
        uri: 'ui://test',
        content: { type: 'rawHtml', htmlString: '<div>Test</div>' },
        encoding: 'text',
        adapters: { appsSdk: { enabled: true } },
      });
      expect(appsSdkOnly).toBeDefined();

      // Valid: only mcpApps
      const mcpAppsOnly = createUIResource({
        uri: 'ui://test',
        content: { type: 'rawHtml', htmlString: '<div>Test</div>' },
        encoding: 'text',
        adapters: { mcpApps: { enabled: true } },
      });
      expect(mcpAppsOnly).toBeDefined();

      // Valid: neither
      const neitherAdapter = createUIResource({
        uri: 'ui://test',
        content: { type: 'rawHtml', htmlString: '<div>Test</div>' },
        encoding: 'text',
        adapters: {},
      });
      expect(neitherAdapter).toBeDefined();
    });

    it('should return correct MIME type based on which adapter is enabled', () => {
      // Apps SDK adapter
      expect(getAdapterMimeType({ appsSdk: { enabled: true } })).toBe('text/html+skybridge');

      // MCP Apps adapter
      expect(getAdapterMimeType({ mcpApps: { enabled: true } })).toBe('text/html+mcp');

      // No adapter
      expect(getAdapterMimeType({})).toBeUndefined();
    });
  });

  describe('External URL Fetching', () => {
    beforeEach(() => {
      // Reset fetch mock before each test
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('Base tag injection', () => {
      it('should add base tag for relative URL resolution', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => '<html><head><script src="main.js"></script></head><body>Content</body></html>',
        });
        vi.stubGlobal('fetch', mockFetch);

        const resource = await createUIResource({
          uri: 'ui://test',
          content: {
            type: 'externalUrl',
            iframeUrl: 'https://example.com/page',
          },
          encoding: 'text',
          adapters: {
            appsSdk: {
              enabled: true,
            },
          },
        });

        const html = resource.resource.text as string;
        // Base tag should be added to resolve relative URLs at runtime
        expect(html).toContain('<base href="https://example.com/">');
        // Original relative URLs should remain unchanged (base tag handles resolution)
        expect(html).toContain('src="main.js"');
      });

      it('should preserve absolute URLs unchanged', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => '<html><head><script src="https://cdn.example.com/lib.js"></script></head><body>Content</body></html>',
        });
        vi.stubGlobal('fetch', mockFetch);

        const resource = await createUIResource({
          uri: 'ui://test',
          content: {
            type: 'externalUrl',
            iframeUrl: 'https://example.com',
          },
          encoding: 'text',
          adapters: {
            appsSdk: {
              enabled: true,
            },
          },
        });

        const html = resource.resource.text as string;
        expect(html).toContain('src="https://cdn.example.com/lib.js"');
        expect(html).toContain('<base href="https://example.com/">');
      });

      it('should preserve special protocol URLs unchanged', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => '<html><body><a href="mailto:test@example.com">Email</a><a href="#section">Anchor</a></body></html>',
        });
        vi.stubGlobal('fetch', mockFetch);

        const resource = await createUIResource({
          uri: 'ui://test',
          content: {
            type: 'externalUrl',
            iframeUrl: 'https://example.com',
          },
          encoding: 'text',
          adapters: {
            appsSdk: {
              enabled: true,
            },
          },
        });

        const html = resource.resource.text as string;
        expect(html).toContain('href="mailto:test@example.com"');
        expect(html).toContain('href="#section"');
      });

      it('should add base tag for runtime URL resolution', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => `<html><head><script>
            EJS_biosUrl = '/bios/arcade.7z';
            var apiEndpoint = '/api/data';
          </script></head><body>Content</body></html>`,
        });
        vi.stubGlobal('fetch', mockFetch);

        const resource = await createUIResource({
          uri: 'ui://test',
          content: {
            type: 'externalUrl',
            iframeUrl: 'https://www.retrogames.cc/embed/game.html',
          },
          encoding: 'text',
          adapters: {
            appsSdk: {
              enabled: true,
            },
          },
        });

        const html = resource.resource.text as string;
        // Base tag should be added to handle runtime URL resolution (includes full path)
        expect(html).toContain('<base href="https://www.retrogames.cc/embed/">');
        // JavaScript content should remain unchanged (base tag handles resolution at runtime)
        expect(html).toContain("EJS_biosUrl = '/bios/arcade.7z'");
        expect(html).toContain("apiEndpoint = '/api/data'");
      });

      it('should remove existing base tags and CSP meta tags', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => `<html><head>
            <base href="https://original-site.com/">
            <meta http-equiv="Content-Security-Policy" content="base-uri 'self'">
          </head><body>Content</body></html>`,
        });
        vi.stubGlobal('fetch', mockFetch);

        const resource = await createUIResource({
          uri: 'ui://test',
          content: {
            type: 'externalUrl',
            iframeUrl: 'https://www.example.com/page.html',
          },
          encoding: 'text',
          adapters: {
            appsSdk: {
              enabled: true,
            },
          },
        });

        const html = resource.resource.text as string;
        // Original base tag should be removed
        expect(html).not.toContain('href="https://original-site.com/"');
        // Our base tag should be added (with full path to the page's directory)
        expect(html).toContain('<base href="https://www.example.com/">');
        // CSP meta tag should be removed (replaced with comment)
        expect(html).toContain('<!-- CSP meta tag removed by MCP-UI -->');
        expect(html).not.toContain("base-uri 'self'");
      });
    });

    describe('Error handling', () => {
      it('should throw error for invalid URL', async () => {
        await expect(
          createUIResource({
            uri: 'ui://test',
            content: {
              type: 'externalUrl',
              iframeUrl: 'not-a-valid-url',
            },
            encoding: 'text',
            adapters: {
              appsSdk: {
                enabled: true,
              },
            },
          }),
        ).rejects.toThrow('Invalid URL');
      });

      it('should throw error for non-HTTP(S) URL', async () => {
        await expect(
          createUIResource({
            uri: 'ui://test',
            content: {
              type: 'externalUrl',
              iframeUrl: 'file:///path/to/file.html',
            },
            encoding: 'text',
            adapters: {
              appsSdk: {
                enabled: true,
              },
            },
          }),
        ).rejects.toThrow('http or https protocol');
      });

      it('should throw error when fetch fails', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
        vi.stubGlobal('fetch', mockFetch);

        await expect(
          createUIResource({
            uri: 'ui://test',
            content: {
              type: 'externalUrl',
              iframeUrl: 'https://example.com',
            },
            encoding: 'text',
            adapters: {
              appsSdk: {
                enabled: true,
              },
            },
          }),
        ).rejects.toThrow('Failed to fetch external URL');
      });

      it('should handle non-OK response gracefully instead of throwing', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => 'Not Found',
        });
        vi.stubGlobal('fetch', mockFetch);

        const resource = await createUIResource({
          uri: 'ui://test',
          content: {
            type: 'externalUrl',
            iframeUrl: 'https://example.com',
          },
          encoding: 'text',
          adapters: {
            appsSdk: {
              enabled: true,
            },
          },
        });

        // Should return a resource with the error response body instead of throwing
        expect(resource.type).toBe('resource');
        expect(resource.resource.text).toContain('Not Found');
      });

      it('should create fallback HTML when response is not OK and body is empty', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => '',
        });
        vi.stubGlobal('fetch', mockFetch);

        const resource = await createUIResource({
          uri: 'ui://test',
          content: {
            type: 'externalUrl',
            iframeUrl: 'https://example.com',
          },
          encoding: 'text',
          adapters: {
            appsSdk: {
              enabled: true,
            },
          },
        });

        // Should return a resource with fallback error HTML instead of throwing
        expect(resource.type).toBe('resource');
        expect(resource.resource.text).toContain('Error 500');
        expect(resource.resource.text).toContain('Internal Server Error');
        expect(resource.resource.text).toContain('https://example.com');
      });

      it('should throw error when response body is empty', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => '',
        });
        vi.stubGlobal('fetch', mockFetch);

        await expect(
          createUIResource({
            uri: 'ui://test',
            content: {
              type: 'externalUrl',
              iframeUrl: 'https://example.com',
            },
            encoding: 'text',
            adapters: {
              appsSdk: {
                enabled: true,
              },
            },
          }),
        ).rejects.toThrow('empty content');
      });

      it('should warn but continue when content-type is not HTML', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: async () => '<html><body>Content</body></html>',
        });
        vi.stubGlobal('fetch', mockFetch);

        const resource = await createUIResource({
          uri: 'ui://test',
          content: {
            type: 'externalUrl',
            iframeUrl: 'https://example.com',
          },
          encoding: 'text',
          adapters: {
            appsSdk: {
              enabled: true,
            },
          },
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('content-type is not HTML'),
        );
        expect(resource).toBeDefined();
        consoleSpy.mockRestore();
      });
    });

    describe('Blob encoding', () => {
      it('should work with blob encoding when fetching external URL', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'text/html' }),
          text: async () => '<html><body>Content</body></html>',
        });
        vi.stubGlobal('fetch', mockFetch);

        const resource = await createUIResource({
          uri: 'ui://test',
          content: {
            type: 'externalUrl',
            iframeUrl: 'https://example.com',
          },
          encoding: 'blob',
          adapters: {
            appsSdk: {
              enabled: true,
            },
          },
        });

        expect(resource.resource.blob).toBeDefined();
        expect(resource.resource.text).toBeUndefined();
        expect(resource.resource.mimeType).toBe('text/html+skybridge');
      });
    });
  });
});

