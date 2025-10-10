import { describe, it, expect } from 'vitest';
import { getAppsSdkAdapterScript } from '../../adapters/appssdk/adapter';
import type { AppsSdkAdapterConfig } from '../../adapters/appssdk/types';

describe('Apps SDK Adapter', () => {
  describe('getAppsSdkAdapterScript', () => {
    it('should generate a valid script tag', () => {
      const script = getAppsSdkAdapterScript();
      
      expect(script).toContain('<script>');
      expect(script).toContain('</script>');
      expect(script.trim().startsWith('<script>')).toBe(true);
      expect(script.trim().endsWith('</script>')).toBe(true);
    });

    it('should include the bundled adapter code', () => {
      const script = getAppsSdkAdapterScript();
      
      // Check for key adapter components
      expect(script).toContain('MCPUIAppsSdkAdapter');
      expect(script).toContain('initAdapter');
      expect(script).toContain('uninstallAdapter');
    });

    it('should inject default config when no config provided', () => {
      const script = getAppsSdkAdapterScript();
      
      // Should call initAdapter with empty config
      expect(script).toContain('initAdapter({})');
    });

    it('should inject custom timeout config', () => {
      const config: AppsSdkAdapterConfig = {
        timeout: 5000,
      };
      
      const script = getAppsSdkAdapterScript(config);
      
      expect(script).toContain('5000');
      expect(script).toContain('"timeout":5000');
    });

    it('should inject custom intentHandling config', () => {
      const config: AppsSdkAdapterConfig = {
        intentHandling: 'ignore',
      };
      
      const script = getAppsSdkAdapterScript(config);
      
      expect(script).toContain('ignore');
      expect(script).toContain('"intentHandling":"ignore"');
    });

    it('should inject custom hostOrigin config', () => {
      const config: AppsSdkAdapterConfig = {
        hostOrigin: 'https://custom.com',
      };
      
      const script = getAppsSdkAdapterScript(config);
      
      expect(script).toContain('https://custom.com');
      expect(script).toContain('"hostOrigin":"https://custom.com"');
    });

    it('should inject multiple config options', () => {
      const config: AppsSdkAdapterConfig = {
        timeout: 10000,
        intentHandling: 'prompt',
        hostOrigin: 'https://test.example.com',
      };
      
      const script = getAppsSdkAdapterScript(config);
      
      expect(script).toContain('10000');
      expect(script).toContain('prompt');
      expect(script).toContain('https://test.example.com');
    });

    it('should set MCP_APPSSDK_ADAPTER_NO_AUTO_INSTALL flag', () => {
      const script = getAppsSdkAdapterScript();
      
      // Should prevent the bundled code from auto-initializing
      expect(script).toContain('MCP_APPSSDK_ADAPTER_NO_AUTO_INSTALL');
      expect(script).toContain('window.MCP_APPSSDK_ADAPTER_NO_AUTO_INSTALL = true');
    });

    it('should expose global MCPUIAppsSdkAdapter API', () => {
      const script = getAppsSdkAdapterScript();
      
      expect(script).toContain('window.MCPUIAppsSdkAdapter');
      expect(script).toContain('init: initAdapter');
      expect(script).toContain('uninstall: uninstallAdapter');
    });

    it('should check for window before initialization', () => {
      const script = getAppsSdkAdapterScript();
      
      // Should have window checks
      expect(script).toContain("typeof window !== 'undefined'");
    });

    it('should be wrapped in IIFE', () => {
      const script = getAppsSdkAdapterScript();
      
      // Should be wrapped in a function to avoid global pollution
      expect(script).toContain('(function()');
      expect(script).toContain('})()');
    });

    it('should include use strict directive', () => {
      const script = getAppsSdkAdapterScript();
      
      expect(script).toContain("'use strict'");
    });

    it('should contain core adapter functionality keywords', () => {
      const script = getAppsSdkAdapterScript();
      
      // Check for essential adapter components
      expect(script).toContain('postMessage');
      expect(script).toContain('window.openai');
      expect(script).toContain('handleMCPUIMessage');
    });

    it('should support tool calling', () => {
      const script = getAppsSdkAdapterScript();
      
      expect(script).toContain('callTool');
      expect(script).toContain('tool');
    });

    it('should support prompt sending', () => {
      const script = getAppsSdkAdapterScript();
      
      expect(script).toContain('sendFollowUpMessage');
      expect(script).toContain('prompt');
    });

    it('should handle widget state', () => {
      const script = getAppsSdkAdapterScript();
      
      expect(script).toContain('widgetState');
      // widgetState is read from Apps SDK
    });

    it('should handle render data', () => {
      const script = getAppsSdkAdapterScript();
      
      expect(script).toContain('renderData');
      expect(script).toContain('toolInput');
      expect(script).toContain('toolOutput');
    });

    it('should handle lifecycle messages', () => {
      const script = getAppsSdkAdapterScript();
      
      expect(script).toContain('ui-lifecycle');
      expect(script).toContain('ui-request');
    });

    it('should properly escape JSON in config', () => {
      const config: AppsSdkAdapterConfig = {
        hostOrigin: 'https://example.com/"test"',
      };
      
      // Should not throw and should properly escape quotes
      expect(() => getAppsSdkAdapterScript(config)).not.toThrow();
      
      const script = getAppsSdkAdapterScript(config);
      // The JSON.stringify should handle escaping
      expect(script).toContain('\\"test\\"');
    });
  });

  describe('Type Definitions', () => {
    it('should accept valid config types', () => {
      const validConfigs: AppsSdkAdapterConfig[] = [
        {},
        { timeout: 5000 },
        { intentHandling: 'prompt' },
        { intentHandling: 'ignore' },
        { hostOrigin: 'https://example.com' },
        {
          timeout: 10000,
          intentHandling: 'ignore',
          hostOrigin: 'https://test.com',
        },
      ];

      for (const config of validConfigs) {
        expect(() => getAppsSdkAdapterScript(config)).not.toThrow();
      }
    });
  });

  describe('Script Size', () => {
    it('should generate a reasonably sized script', () => {
      const script = getAppsSdkAdapterScript();
      
      // Script should be present but not excessively large
      expect(script.length).toBeGreaterThan(100);
      expect(script.length).toBeLessThan(50000); // ~50KB max
    });

    it('should not significantly grow with config', () => {
      const baseScript = getAppsSdkAdapterScript();
      const configuredScript = getAppsSdkAdapterScript({
        timeout: 10000,
        intentHandling: 'ignore',
        hostOrigin: 'https://example.com',
      });
      
      // Config should only add a small amount to script size
      const sizeDiff = configuredScript.length - baseScript.length;
      expect(sizeDiff).toBeLessThan(200);
    });
  });

  describe('Script Validity', () => {
    it('should generate syntactically valid JavaScript', () => {
      const script = getAppsSdkAdapterScript();
      
      // Extract just the JavaScript code (remove <script> tags)
      const jsCode = script.replace(/<\/?script>/g, '');
      
      // This should not throw a SyntaxError
      expect(() => new Function(jsCode)).not.toThrow();
    });

    it('should handle special characters in config', () => {
      const config: AppsSdkAdapterConfig = {
        hostOrigin: 'https://example.com/path?param=value&other=123',
      };
      
      const script = getAppsSdkAdapterScript(config);
      
      // Should properly escape and not break the script
      const jsCode = script.replace(/<\/?script>/g, '');
      expect(() => new Function(jsCode)).not.toThrow();
    });
  });
});
