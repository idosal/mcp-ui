import { API_RUNTIME_SCRIPT } from './open-ai-runtime-script.bundled';
import type { HostProps } from '../../types';

export type OpenAiScriptOptions = {
  widgetStateKey: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  toolResponseMetadata?: Record<string, unknown>;
  toolName?: string;
  theme?: string;
  locale?: string;
  userAgent?: unknown;
  model?: string;
  displayMode?: string;
  maxHeight?: number;
  safeArea?: HostProps['safeArea'];
  capabilities?: HostProps['capabilities'];
};

const CONFIG_GLOBAL_KEY = '__MCP_WIDGET_CONFIG__';

function escapeForInlineScript(json: string): string {
  return json
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function createOpenAiScript(options: OpenAiScriptOptions): string {
  const config: Record<string, unknown> = {
    widgetStateKey: options.widgetStateKey,
    toolInput: options.toolInput ?? null,
    toolOutput: options.toolOutput ?? null,
    toolResponseMetadata: options.toolResponseMetadata ?? null,
    toolName: options.toolName ?? null,
    theme: options.theme ?? undefined,
    locale: options.locale ?? undefined,
    userAgent: options.userAgent ?? null,
    model: options.model ?? null,
    displayMode: options.displayMode ?? undefined,
    maxHeight: typeof options.maxHeight === 'number' ? options.maxHeight : undefined,
    safeArea: options.safeArea ?? undefined,
    capabilities: options.capabilities ?? undefined,
  };

  const serializedConfig = JSON.stringify(config);
  const escapedConfig = escapeForInlineScript(serializedConfig);

  return `
<script>
  window.${CONFIG_GLOBAL_KEY} = ${escapedConfig};
</script>
<script>
${API_RUNTIME_SCRIPT}
</script>
`;
}
