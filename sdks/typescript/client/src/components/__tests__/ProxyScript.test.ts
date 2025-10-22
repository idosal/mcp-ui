import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import '@testing-library/jest-dom';

function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('Proxy script', () => {
  it('should apply sandbox and inject srcdoc when receiving html via postMessage', async () => {
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

    // Find the outer iframe container (created after readiness listener install)
    const outerDoc = window.document;
    const outerIframe = outerDoc.querySelector('iframe');
    expect(outerIframe).toBeTruthy();

    // Send the html + sandbox payload
    const html = '<!doctype html><html><body><form><input></form></body></html>';
    const sandbox = 'allow-forms allow-scripts';
    // Simulate parent -> proxy message ensuring source === window.parent
    const MsgEvent: typeof MessageEvent = window.MessageEvent;
    window.dispatchEvent(
      new MsgEvent('message', {
        data: { type: 'ui-html-content', payload: { html, sandbox } },
        source: window.parent,
      }),
    );

    // Let the proxy handle the message and construct the inner iframe
    await nextTick();
    await nextTick();

    // Assert inner iframe present and configured
    const innerIframe = outerDoc.querySelector('iframe');
    expect(innerIframe).toBeTruthy();
    // In this simple structure, the same reference is inner (since appended to body),
    // but we still assert sandbox and srcdoc were applied
    const sandboxAttr = innerIframe?.getAttribute('sandbox') || '';
    expect(sandboxAttr.includes('allow-forms')).toBe(true);
    expect(sandboxAttr.includes('allow-scripts')).toBe(true);

    // jsdom exposes srcdoc as attribute
    const srcdocAttr = innerIframe?.getAttribute('srcdoc') || '';
    expect(srcdocAttr.includes('<form>')).toBe(true);
  });
});
