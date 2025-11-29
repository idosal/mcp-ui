import type { McpAppsAdapterConfig } from './types.js';
// @ts-expect-error - The bundled file is generated at build time
import { ADAPTER_RUNTIME_SCRIPT } from './adapter-runtime.bundled.ts';

export function getMcpAppsAdapterScript(config?: McpAppsAdapterConfig): string {
  const serializableConfig = config ? {
    timeout: config.timeout,
  } : {};
  const configJson = JSON.stringify(serializableConfig);

  return `
<script>
(function() {
  'use strict';
  
  ${ADAPTER_RUNTIME_SCRIPT}
  
  if (typeof window !== 'undefined') {
    if (typeof initAdapter !== 'function' || typeof uninstallAdapter !== 'function') {
      console.warn('[MCP Apps Adapter] Adapter runtime not found. Adapter will not activate.');
      return;
    }
    
    if (!window.MCP_APPS_ADAPTER_NO_AUTO_INSTALL) {
      initAdapter(${configJson});
    }
    
    window.McpAppsAdapter = {
      init: initAdapter,
      initWithConfig: () => initAdapter(${configJson}),
      uninstall: uninstallAdapter,
    };
  }
})();
</script>
`.trim();
}

