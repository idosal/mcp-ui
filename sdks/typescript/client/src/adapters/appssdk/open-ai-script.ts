import { API_RUNTIME_SCRIPT } from './open-ai-runtime-script.bundled';
import type { ClientContextProps } from '../../types';

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
  safeArea?: ClientContextProps['safeArea'];
  capabilities?: ClientContextProps['capabilities'];
};

const CONFIG_GLOBAL_KEY = '__MCP_WIDGET_CONFIG__';

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

  return `
<script>
  window.${CONFIG_GLOBAL_KEY} = ${serializedConfig};
</script>
<script>
${API_RUNTIME_SCRIPT}
</script>
`;
}
