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
import { ADAPTER_RUNTIME_SCRIPT } from './adapter-runtime.bundled.js';

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
    window.MCP_APPSSDK_ADAPTER_NO_AUTO_INSTALL = true; // Prevent auto-init from bundled code
    
    // Initialize with config from server
    if (typeof initAdapter === 'function') {
      initAdapter(${configJson});
    }
    
    // Expose functions globally
    if (typeof window.MCPUIAppsSdkAdapter === 'undefined') {
      window.MCPUIAppsSdkAdapter = {
        init: initAdapter,
        uninstall: uninstallAdapter,
      };
    }
  }
})();
</script>
`.trim();
}
