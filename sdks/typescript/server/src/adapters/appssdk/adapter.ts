/**
 * MCP-UI to Apps SDK Adapter
 *
 * This module enables MCP-UI embeddable widgets to run in Apps SDK environments (e.g., ChatGPT)
 * by intercepting postMessage calls and translating them to the Apps SDK API (e.g., window.openai).
 * 
 * The actual implementation is in adapter-runtime.ts (with full TypeScript support).
 * This file imports the pre-bundled version and injects it with configuration.
 */

import type { AppsSdkAdapterConfig } from './types.js';
/*
 * The bundler generates both JavaScript and TypeScript variants of the bundled runtime.
 * We import the TypeScript file here so that TypeScript compilation works even when the
 * JavaScript output has not been generated yet (e.g., in tests).
 *
 * Runtime consumers will still resolve to the JavaScript build via package exports.
 */
import { ADAPTER_RUNTIME_SCRIPT } from './adapter-runtime.bundled';

/**
 * Returns the complete adapter script as a string that can be injected into HTML.
 * This is the runtime code that will be executed in the browser.
 *
 * @param config - Optional configuration for the adapter
 * @returns A string containing the complete adapter initialization script
 */
export function getAppsSdkAdapterScript(config?: AppsSdkAdapterConfig): string {
  const configJson = config ? JSON.stringify(config) : '{}';

  // Wrap the bundled runtime with configuration and auto-init
  return `
<script>
(function() {
  'use strict';
  
  ${ADAPTER_RUNTIME_SCRIPT}
  
  // Override auto-init from runtime and initialize with provided config
  if (typeof window !== 'undefined') {
    // If the functions are not defined, just return, we can't do anything.
    if (typeof initAdapter !== 'function' || typeof uninstallAdapter !== 'function') {
      console.warn('[MCPUI-Apps SDK Adapter] Adapter runtime not found with the correct methods. Adapter will not activate.')    
      return;
    }
    
    // If auto-init is enabled, initialize with config from server 
    if (!window.MCP_APPSSDK_ADAPTER_NO_AUTO_INSTALL) {
      initAdapter(${configJson});
    }
    
    // Expose functions globally
    if (typeof window.MCPUIAppsSdkAdapter === 'undefined') {
      window.MCPUIAppsSdkAdapter = {
        init: initAdapter,
        initWithConfig: () => initAdapter(${configJson}),
        uninstall: uninstallAdapter,
      };
    }
  }
})();
</script>
`.trim();
}
