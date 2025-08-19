import { describe, it, expect } from 'vitest';
import { getAdditionalResourceProps } from '../utils.js';
import { UI_METADATA_PREFIX } from '../types.js';

describe('getAdditionalResourceProps', () => {
  it('should return the additional resource props', () => {
    const uiMetadata = {
      'preferred-frame-size': ['100px', '100px'] as [string, string],
      'initial-render-data': { test: 'test' },
    };
    const additionalResourceProps = getAdditionalResourceProps({ uiMetadata });
    expect(additionalResourceProps).toEqual({
      _meta: {
        [`${UI_METADATA_PREFIX}preferred-frame-size`]: ['100px', '100px'],
        [`${UI_METADATA_PREFIX}initial-render-data`]: { test: 'test' },
      },
    });
  });

  it('should return the additional resource props with user defined _meta', () => {
    const uiMetadata = {
      'preferred-frame-size': ['100px', '100px'] as [string, string],
      'initial-render-data': { test: 'test' },
    };
    const additionalResourceProps = getAdditionalResourceProps({
      uiMetadata,
      resourceProps: {
        annotations: { audience: 'user' },
        _meta: { foo: 'bar', [`${UI_METADATA_PREFIX}preferred-frame-size`]: ['200px', '200px'] },
      },
    });
    expect(additionalResourceProps).toEqual({
      _meta: {
        [`${UI_METADATA_PREFIX}initial-render-data`]: { test: 'test' },
        foo: 'bar',
        [`${UI_METADATA_PREFIX}preferred-frame-size`]: ['200px', '200px'],
      },
      annotations: { audience: 'user' },
    });
  });

  it('should return an empty object if no uiMetadata or metadata is provided', () => {
    const additionalResourceProps = getAdditionalResourceProps({});
    expect(additionalResourceProps).toEqual({});
  });

  it('should respect order of overriding metadata', () => {
    const additionalResourceProps = getAdditionalResourceProps({
      uiMetadata: { 'preferred-frame-size': ['100px', '100px'] as [string, string] },
      metadata: { [`${UI_METADATA_PREFIX}preferred-frame-size`]: ['200px', '200px'], foo: 'bar' },
      resourceProps: { annotations: { audience: 'user' }, _meta: { foo: 'baz' } },
    });
    expect(additionalResourceProps).toEqual({
      _meta: {
        [`${UI_METADATA_PREFIX}preferred-frame-size`]: ['200px', '200px'],
        foo: 'baz',
      },
      annotations: { audience: 'user' },
    });
  });
});
