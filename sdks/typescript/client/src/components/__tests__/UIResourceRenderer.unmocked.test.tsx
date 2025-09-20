import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Resource } from '@modelcontextprotocol/sdk/types.js';
import { UIResourceRenderer } from '../UIResourceRenderer';
import { UI_METADATA_PREFIX } from '../../types';

describe('UIResourceRenderer', () => {
  const testResource: Partial<Resource> = {
    mimeType: 'text/html',
    text: `<html><body><h1>Test Content</h1><script>
      console.log("iframe script loaded for onUIAction tests");
    </script></body></html>`,
    uri: 'ui://test-resource',
  };
  it('should pass ref to HTMLResourceRenderer', () => {
    const ref = React.createRef<HTMLIFrameElement>();
    render(<UIResourceRenderer resource={testResource} htmlProps={{ iframeProps: { ref } }} />);
    expect(ref.current).toBeInTheDocument();
  });

  it('should respect a ui-size-change message', () => {
    const ref = React.createRef<HTMLIFrameElement>();
    render(
      <UIResourceRenderer
        resource={testResource}
        htmlProps={{ iframeProps: { ref }, autoResizeIframe: true }}
      />,
    );
    expect(ref.current).toBeInTheDocument();
    dispatchMessage(ref.current?.contentWindow ?? null, {
      type: 'ui-size-change',
      payload: { width: 100, height: 100 },
    });
    expect(ref.current?.style.width).toBe('100px');
    expect(ref.current?.style.height).toBe('100px');
  });

  it('should respect a limited ui-size-change prop', () => {
    const ref = React.createRef<HTMLIFrameElement>();
    render(
      <UIResourceRenderer
        resource={testResource}
        htmlProps={{ iframeProps: { ref }, autoResizeIframe: { width: true, height: false } }}
      />,
    );
    expect(ref.current).toBeInTheDocument();
    dispatchMessage(ref.current?.contentWindow ?? null, {
      type: 'ui-size-change',
      payload: { width: 100, height: 100 },
    });
    expect(ref.current?.style.width).toBe('100px');
    expect(ref.current?.style.height).toBe('100%');
  });

  it('should respect a preferred-frame-size metadata', () => {
    const ref = React.createRef<HTMLIFrameElement>();
    render(
      <UIResourceRenderer
        resource={{
          ...testResource,
          _meta: { [`${UI_METADATA_PREFIX}preferred-frame-size`]: ['200px', '100px'] },
        }}
        htmlProps={{ iframeProps: { ref }, autoResizeIframe: true }}
      />,
    );
    expect(ref.current).toBeInTheDocument();
    expect(ref.current?.style.width).toBe('200px');
    expect(ref.current?.style.height).toBe('100px');
  });
});

const dispatchMessage = (source: Window | null, data: Record<string, unknown> | null) => {
  fireEvent(
    window,
    new MessageEvent('message', {
      data,
      source,
    }),
  );
};
