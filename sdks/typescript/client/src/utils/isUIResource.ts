import type { Resource } from '@modelcontextprotocol/sdk/types.js';

export function isUIResource<T extends { type: string; resource?: Partial<Resource> }>(content: T): content is T & { type: 'resource'; resource: Partial<Resource> } {
    return (content.type === 'resource' && content.resource?.uri?.startsWith('ui://')) ?? false;
}