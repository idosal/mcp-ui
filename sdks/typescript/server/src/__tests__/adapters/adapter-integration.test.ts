import { describe, it, expect } from 'vitest';
import { createUIResource } from '../../index';
import { wrapHtmlWithAdapters } from '../../utils';

describe('Apps SDK Adapter Integration', () => {
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

    it('should not affect external URL resources', () => {
      const resource = createUIResource({
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

      // External URLs should not be wrapped
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
      const wrapped = wrapHtmlWithAdapters(html);
      expect(wrapped).toBe(html);
    });

    it('should return original HTML when adapters config is empty', () => {
      const html = '<div>Test</div>';
      const wrapped = wrapHtmlWithAdapters(html, {});
      expect(wrapped).toBe(html);
    });

    it('should wrap HTML with Apps SDK adapter', () => {
      const html = '<div>Test</div>';
      const wrapped = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
        },
      });

      expect(wrapped).toContain('<script>');
      expect(wrapped).toContain('</script>');
      expect(wrapped).toContain(html);
    });

    it('should inject script in head tag if present', () => {
      const html = '<html><head></head><body><div>Test</div></body></html>';
      const wrapped = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
        },
      });

      const headIndex = wrapped.indexOf('<head>');
      const scriptIndex = wrapped.indexOf('<script>');
      expect(scriptIndex).toBeGreaterThan(headIndex);
      expect(scriptIndex).toBeLessThan(wrapped.indexOf('</head>'));
    });

    it('should create head tag if html tag present but no head', () => {
      const html = '<html><body><div>Test</div></body></html>';
      const wrapped = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
        },
      });

      expect(wrapped).toContain('<head>');
      expect(wrapped).toContain('<script>');
    });

    it('should prepend script if no html structure', () => {
      const html = '<div>Test</div>';
      const wrapped = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
        },
      });

      expect(wrapped.indexOf('<script>')).toBe(0);
    });

    it('should handle multiple adapter configurations', () => {
      const html = '<div>Test</div>';
      
      // Even though we only have appsSdk now, test that the structure supports multiple
      const wrapped = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
          config: {
            timeout: 5000,
          },
        },
        // Future adapters would go here
      });

      expect(wrapped).toContain('<script>');
      expect(wrapped).toContain('5000');
    });

    it('should pass config to adapter script', () => {
      const html = '<div>Test</div>';
      const wrapped = wrapHtmlWithAdapters(html, {
        appsSdk: {
          enabled: true,
          config: {
            timeout: 10000,
            intentHandling: 'ignore',
            hostOrigin: 'https://test.com',
          },
        },
      });

      expect(wrapped).toContain('10000');
      expect(wrapped).toContain('ignore');
      expect(wrapped).toContain('https://test.com');
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

