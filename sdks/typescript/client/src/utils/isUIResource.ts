import type { Resource } from '@modelcontextprotocol/sdk/types.js';

export function isUIResource<T extends { type: string; resource?: Partial<Resource> }>(content: T): boolean {
    return (content.type === 'resource' && content.resource?.uri?.startsWith('ui://')) ?? false;
}