import { describe, it, expect } from 'vitest';
import { getMcpAppsAdapterScript } from '../../adapters/mcp-apps/adapter';
import type { McpAppsAdapterConfig } from '../../adapters/mcp-apps/types';

/**
 * Tests for MCP Apps Adapter script generation
 *
 * Note: Behavioral tests for message translation are in mcp-apps-adapter.behavior.test.ts
 * These tests focus on script structure, validity, and configuration injection.
 */
describe('MCP Apps Adapter - Script Generation', () => {
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
  });

  describe('Type Definitions', () => {
    it('should accept valid config types', () => {
      const validConfigs: McpAppsAdapterConfig[] = [{}, { timeout: 5000 }, { timeout: 30000 }];

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

  describe('Protocol Constants', () => {
    it('should include protocol version constant', () => {
      const script = getMcpAppsAdapterScript();

      // Should contain the protocol version constant
      expect(script).toContain('PROTOCOL_VERSION');
      expect(script).toContain('2025-11-21');
    });

    it('should include JSON-RPC version', () => {
      const script = getMcpAppsAdapterScript();

      // Should contain JSON-RPC version (may use single or double quotes)
      expect(script).toMatch(/jsonrpc:\s*["']2\.0["']/);
    });
  });
});
