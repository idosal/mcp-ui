import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';
import { UIResourceRenderer } from '../UIResourceRenderer';
import { UI_METADATA_PREFIX } from '../../types';

describe('UIResourceRenderer', () => {
  const testResource: Partial<EmbeddedResource['resource']> = {
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

  describe('Proxy', () => {
    function nextTick(): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, 0));
    }

    it('should render proxy iframe and send data when proxy iframe is ready', async () => {
      const ref = React.createRef<HTMLIFrameElement>();
      const proxy = 'https://proxy.example/';
      const resource: Partial<EmbeddedResource['resource']> = {
        mimeType: 'text/html',
        text: '<!doctype html><html><body><form><input></form></body></html>',
      };

      render(
        <UIResourceRenderer
          resource={resource}
          htmlProps={{ proxy, sandboxPermissions: 'allow-forms', iframeProps: { ref } }}
        />,
      );

      expect(ref.current).toBeInTheDocument();
      // Outer iframe should target the proxy with contentType=rawhtml
      expect(ref.current?.src).toContain('contentType=rawhtml');

      // Stub and simulate proxy ready
      const postMessageMock = vi.fn();
      Object.defineProperty(ref.current as HTMLIFrameElement, 'contentWindow', {
        value: { postMessage: postMessageMock },
        writable: false,
      });

      const MsgEvent: typeof MessageEvent = window.MessageEvent;
      window.dispatchEvent(
        new MsgEvent('message', {
          data: { type: 'ui-proxy-iframe-ready' },
          source: (ref.current as HTMLIFrameElement).contentWindow as Window,
          origin: 'https://proxy.example',
        }),
      );

      await nextTick();

      const calls = postMessageMock.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const [sentMessage, targetOrigin] = calls[0];
      expect(targetOrigin).toBe('https://proxy.example');
      expect(sentMessage?.type).toBe('ui-html-content');
      expect(sentMessage?.payload?.html).toContain('<form>');
      const payloadSandbox: string = sentMessage?.payload?.sandbox || '';
      expect(payloadSandbox.includes('allow-scripts')).toBe(true);
      expect(payloadSandbox.includes('allow-forms')).toBe(true);
    });
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
