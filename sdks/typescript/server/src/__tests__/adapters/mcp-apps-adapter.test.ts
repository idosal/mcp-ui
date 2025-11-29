import { describe, it, expect } from 'vitest';
import { getMcpAppsAdapterScript } from '../../adapters/mcp-apps/adapter';
import type { McpAppsAdapterConfig } from '../../adapters/mcp-apps/types';

describe('MCP Apps Adapter', () => {
  describe('getMcpAppsAdapterScript', () => {
    it('should generate a valid script tag', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain('<script>');
      expect(script).toContain('</script>');
      expect(script.trim().startsWith('<script>')).toBe(true);
      expect(script.trim().endsWith('</script>')).toBe(true);
    });

    it('should include the bundled adapter code', () => {
      const script = getMcpAppsAdapterScript();
      
      // Check for key adapter components
      expect(script).toContain('McpAppsAdapter');
      expect(script).toContain('initAdapter');
      expect(script).toContain('uninstallAdapter');
    });

    it('should inject default config when no config provided', () => {
      const script = getMcpAppsAdapterScript();
      
      // Should call initAdapter with empty config
      expect(script).toContain('initAdapter({})');
    });

    it('should inject custom timeout config', () => {
      const config: McpAppsAdapterConfig = {
        timeout: 5000,
      };
      
      const script = getMcpAppsAdapterScript(config);
      
      expect(script).toContain('5000');
      expect(script).toContain('"timeout":5000');
    });

    it('should expose global McpAppsAdapter API', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain('window.McpAppsAdapter');
      expect(script).toContain('init: initAdapter');
      expect(script).toContain('initWithConfig: () => initAdapter({})');
      expect(script).toContain('uninstall: uninstallAdapter');
    });

    it('should expose an initWithConfig with custom timeout', () => {
      const config: McpAppsAdapterConfig = {
        timeout: 10000,
      };

      const script = getMcpAppsAdapterScript(config);

      expect(script).toContain('initWithConfig: () => initAdapter({"timeout":10000})');
    });

    it('should check for window before initialization', () => {
      const script = getMcpAppsAdapterScript();
      
      // Should have window checks
      expect(script).toContain("typeof window !== 'undefined'");
    });

    it('should be wrapped in IIFE', () => {
      const script = getMcpAppsAdapterScript();
      
      // Should be wrapped in a function to avoid global pollution
      expect(script).toContain('(function()');
      expect(script).toContain('})()');
    });

    it('should include use strict directive', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain("'use strict'");
    });

    it('should contain core adapter functionality keywords', () => {
      const script = getMcpAppsAdapterScript();
      
      // Check for essential adapter components
      expect(script).toContain('postMessage');
      expect(script).toContain('handleHostMessage');
      expect(script).toContain('handleMCPUIMessage');
    });

    it('should support tool calling translation', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain('tools/call');
      // Check for case statement (may use single or double quotes in bundled output)
      expect(script).toMatch(/case\s+["']tool["']/);
    });

    it('should support prompt sending translation', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain('ui/message');
      expect(script).toMatch(/case\s+["']prompt["']/);
    });

    it('should handle render data', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain('renderData');
      expect(script).toContain('toolInput');
      expect(script).toContain('toolOutput');
      expect(script).toContain('sendRenderData');
    });

    it('should handle lifecycle messages', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain('ui-lifecycle');
      expect(script).toContain('ui-request-render-data');
    });

    it('should handle MCP Apps SEP protocol methods', () => {
      const script = getMcpAppsAdapterScript();
      
      // Host -> App notifications
      expect(script).toContain('ui/notifications/tool-input');
      expect(script).toContain('ui/notifications/tool-input-partial');
      expect(script).toContain('ui/notifications/tool-result');
      expect(script).toContain('ui/notifications/host-context-changed');
      expect(script).toContain('ui/notifications/size-change');
      
      // App -> Host methods
      expect(script).toContain('ui/initialize');
      expect(script).toContain('ui/notifications/initialized');
      expect(script).toContain('ui/open-link');
      expect(script).toContain('notifications/message');
    });

    it('should include protocol version', () => {
      const script = getMcpAppsAdapterScript();
      
      // Should contain the protocol version constant
      expect(script).toContain('PROTOCOL_VERSION');
      expect(script).toContain('2025-11-21');
    });

    it('should handle intent translation', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toMatch(/case\s+["']intent["']/);
    });

    it('should handle link translation', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toMatch(/case\s+["']link["']/);
      expect(script).toContain('ui/open-link');
    });

    it('should handle notify translation', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toMatch(/case\s+["']notify["']/);
      expect(script).toContain('notifications/message');
    });

    it('should handle size change translation', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toMatch(/case\s+["']ui-size-change["']/);
    });
  });

  describe('Type Definitions', () => {
    it('should accept valid config types', () => {
      const validConfigs: McpAppsAdapterConfig[] = [
        {},
        { timeout: 5000 },
        { timeout: 30000 },
      ];

      for (const config of validConfigs) {
        expect(() => getMcpAppsAdapterScript(config)).not.toThrow();
      }
    });
  });

  describe('Script Size', () => {
    it('should generate a reasonably sized script', () => {
      const script = getMcpAppsAdapterScript();
      
      // Script should be present but not excessively large
      expect(script.length).toBeGreaterThan(100);
      expect(script.length).toBeLessThan(50000); // ~50KB max
    });

    it('should not significantly grow with config', () => {
      const baseScript = getMcpAppsAdapterScript();
      const configuredScript = getMcpAppsAdapterScript({
        timeout: 10000,
      });
      
      // Config should only add a small amount to script size
      const sizeDiff = configuredScript.length - baseScript.length;
      expect(sizeDiff).toBeLessThan(100);
    });
  });

  describe('Script Validity', () => {
    it('should generate syntactically valid JavaScript', () => {
      const script = getMcpAppsAdapterScript();
      
      // Extract just the JavaScript code (remove <script> tags)
      const jsCode = script.replace(/<\/?script>/gi, '');
      
      // This should not throw a SyntaxError
      expect(() => new Function(jsCode)).not.toThrow();
    });
  });

  describe('JSON-RPC Message Format', () => {
    it('should generate JSON-RPC 2.0 compliant messages', () => {
      const script = getMcpAppsAdapterScript();
      
      // Should contain JSON-RPC version (may use single or double quotes)
      expect(script).toMatch(/jsonrpc:\s*["']2\.0["']/);
    });

    it('should support request/response pattern', () => {
      const script = getMcpAppsAdapterScript();
      
      // Should handle responses via id matching
      expect(script).toContain('pendingRequests');
      expect(script).toContain('data.id');
      expect(script).toContain('data.result');
      expect(script).toContain('data.error');
    });

    it('should support notification pattern', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain('sendJsonRpcNotification');
      // Notifications have method but no id
      expect(script).toContain('data.method');
    });
  });

  describe('Initialization Handshake', () => {
    it('should perform initialization handshake', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain('performInitialization');
      expect(script).toContain('ui/initialize');
      expect(script).toContain('ui/notifications/initialized');
    });

    it('should handle initialization timeout', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain('Initialization timed out');
      // Should resolve the promise on timeout to not hang
      expect(script).toContain('resolve()');
    });

    it('should send app info during initialization', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain('appInfo');
      expect(script).toContain('appCapabilities');
      expect(script).toContain('protocolVersion');
    });
  });

  describe('MCP-UI Message Detection', () => {
    it('should detect MCP-UI message types', () => {
      const script = getMcpAppsAdapterScript();
      
      expect(script).toContain('isMCPUIMessage');
      // Should detect ui- prefixed messages (may use single or double quotes)
      expect(script).toMatch(/type\.startsWith\(["']ui-["']\)/);
      // Should detect action messages
      expect(script).toMatch(/["']tool["']/);
      expect(script).toMatch(/["']prompt["']/);
      expect(script).toMatch(/["']intent["']/);
      expect(script).toMatch(/["']notify["']/);
      expect(script).toMatch(/["']link["']/);
    });
  });
});

