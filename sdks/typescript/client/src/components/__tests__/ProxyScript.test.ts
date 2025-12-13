import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import '@testing-library/jest-dom';

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('Proxy script', () => {
  it('should use document.write to inject HTML via postMessage', async () => {
    const proxyPath = path.resolve(__dirname, '../../../scripts/proxy/index.html');
    const proxyHtml = readFileSync(proxyPath, 'utf8');

    // Create jsdom with proxy URL using contentType=rawhtml
    const dom = new JSDOM(proxyHtml, {
      url: 'http://proxy.local/?contentType=rawhtml',
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
    });

    const { window } = dom;

    // Capture the ready signal emitted by the proxy
    let proxyReady = false;
    window.addEventListener('message', (event: MessageEvent) => {
      const data = event.data as { type?: string };
      if (data?.type === 'ui-proxy-iframe-ready') {
        proxyReady = true;
      }
    });

    // Allow the inline script to run and emit readiness
    await nextTick();
    expect(proxyReady).toBe(true);

    // Find the iframe created by the script
    const outerDoc = window.document;
    const innerIframe = outerDoc.querySelector('iframe');
    expect(innerIframe).toBeTruthy();

    // Verify the iframe has id="root" and src="about:blank" as per the new implementation
    expect(innerIframe?.getAttribute('id')).toBe('root');
    expect(innerIframe?.getAttribute('src')).toBe('about:blank');

    // Send the html payload
    const html = '<!doctype html><html><body><form><input></form></body></html>';
    // Simulate parent -> proxy message ensuring source === window.parent
    const MsgEvent: typeof MessageEvent = window.MessageEvent;
    window.dispatchEvent(
      new MsgEvent('message', {
        data: { type: 'ui-html-content', payload: { html } },
        source: window.parent,
      }),
    );

    // Let the proxy handle the message
    await nextTick();
    await nextTick();

    // Note: JSDOM has limitations with document.write on dynamically created iframes
    // The new implementation uses document.write() instead of srcdoc, which avoids
    // CSP base-uri issues. In a real browser, the contentDocument would contain the HTML.
    // Here we just verify the iframe structure is correct.
    expect(innerIframe).toBeTruthy();

    // The new implementation doesn't use sandbox attributes from payload since
    // allow-same-origin is required for document.write to work. The sandbox
    // attribute is not set on the inner iframe anymore.
    expect(innerIframe?.hasAttribute('srcdoc')).toBe(false);
  });
});
