import { describe, it, expect } from 'vitest';
import { getResourceMetadata, getUIResourceMetadata } from '../metadataUtils';
import { UI_METADATA_PREFIX } from '../../types';

describe('metadataUtils', () => {
  it('should get resource metadata', () => {
    const resource = { _meta: { foo: 'bar' } };
    expect(getResourceMetadata(resource)).toEqual({ foo: 'bar' });
  });

  it('should get ui resource metadata', () => {
    const resource = { _meta: { [`${UI_METADATA_PREFIX}foo`]: 'bar' } };
    expect(getUIResourceMetadata(resource)).toEqual({ foo: 'bar' });
  });

  it('should get ui resource metadata with prefix and user defined metadata', () => {
    const resource = { _meta: { [`${UI_METADATA_PREFIX}foo`]: 'bar', foo: 'baz' } };
    expect(getUIResourceMetadata(resource)).toEqual({ foo: 'bar' });
  });
});
