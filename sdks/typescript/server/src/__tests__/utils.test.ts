import { describe, it, expect, vi } from 'vitest';
import { getAdditionalResourceProps, robustUtf8ToBase64 } from '../utils.js';
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

describe('robustUtf8ToBase64', () => {
  it('should correctly encode a simple ASCII string', () => {
    const str = 'hello world';
    const expected = 'aGVsbG8gd29ybGQ=';
    expect(robustUtf8ToBase64(str)).toBe(expected);
  });

  it('should correctly encode a string with UTF-8 characters', () => {
    const str = '你好,世界';
    const expected = '5L2g5aW9LOS4lueVjA==';
    expect(robustUtf8ToBase64(str)).toBe(expected);
  });

  it('should correctly encode an empty string', () => {
    const str = '';
    const expected = '';
    expect(robustUtf8ToBase64(str)).toBe(expected);
  });

  it('should correctly encode a string with various special characters', () => {
    const str = '`~!@#$%^&*()_+-=[]{}\\|;\':",./<>?';
    const expected = 'YH4hQCMkJV4mKigpXystPVtde31cfDsnOiIsLi88Pj8=';
    expect(robustUtf8ToBase64(str)).toBe(expected);
  });

  it('should use TextEncoder and btoa when Buffer is not available', () => {
    const str = 'hello world';
    const expected = 'aGVsbG8gd29ybGQ=';

    const bufferBackup = global.Buffer;
    // @ts-expect-error - simulating Buffer not being available
    delete global.Buffer;

    expect(robustUtf8ToBase64(str)).toBe(expected);

    global.Buffer = bufferBackup;
  });

  it('should use fallback btoa when Buffer and TextEncoder are not available', () => {
    const str = 'hello world';
    const expected = 'aGVsbG8gd29ybGQ=';

    const bufferBackup = global.Buffer;
    const textEncoderBackup = global.TextEncoder;

    // @ts-expect-error - simulating Buffer not being available
    delete global.Buffer;
    // @ts-expect-error - simulating TextEncoder not being available
    delete global.TextEncoder;

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(robustUtf8ToBase64(str)).toBe(expected);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'MCP-UI SDK: Buffer API and TextEncoder/btoa not available. Base64 encoding might not be UTF-8 safe.',
    );

    consoleWarnSpy.mockRestore();
    global.Buffer = bufferBackup;
    global.TextEncoder = textEncoderBackup;
  });

  it('should throw an error if all encoding methods fail', () => {
    const str = 'hello world';

    const bufferBackup = global.Buffer;
    const textEncoderBackup = global.TextEncoder;
    const btoaBackup = global.btoa;

    // @ts-expect-error - simulating Buffer not being available
    delete global.Buffer;
    // @ts-expect-error - simulating TextEncoder not being available
    delete global.TextEncoder;
    // @ts-expect-error - simulating btoa not being available
    delete global.btoa;

    expect(() => robustUtf8ToBase64(str)).toThrow(
      'MCP-UI SDK: Suitable UTF-8 to Base64 encoding method not found, and fallback btoa failed.',
    );

    global.Buffer = bufferBackup;
    global.TextEncoder = textEncoderBackup;
    global.btoa = btoaBackup;
  });
});
