import type { EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';

export function isUIResource<
  T extends { type: string; resource?: Partial<EmbeddedResource['resource']> },
>(
  content: T,
): content is T & { type: 'resource'; resource: Partial<EmbeddedResource['resource']> } {
  return (content.type === 'resource' && content.resource?.uri?.startsWith('ui://')) ?? false;
}
