import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { RemoteDOMResourceRenderer } from '../RemoteDOMResourceRenderer';
import '@testing-library/jest-dom';
import { basicComponentLibrary } from '../../remote-dom/component-libraries/basic';
import { RemoteRootRenderer } from '@remote-dom/react/host';

// Mock child components and dependencies - complete mock to avoid jsx-runtime issues with React 16
vi.mock('@remote-dom/react/host', () => ({
  RemoteRootRenderer: vi.fn(() => <div data-testid="remote-root-renderer" />),
  createRemoteComponentRenderer: vi.fn(() => ({
    render: vi.fn(),
  })),
  RemoteReceiver: vi.fn(),
}));

vi.mock('../iframe-bundle', () => ({
  IFRAME_SRC_DOC: '<html><body>Mock Iframe Content</body></html>',
}));

describe('<RemoteDOMResourceRenderer />', () => {
  const baseResource = {
    uri: 'ui://test-remote-dom',
    content: 'const a = 1;',
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should use React renderer when mimeType includes "framework=react"', () => {
    const resource = {
      ...baseResource,
      mimeType: 'application/vnd.mcp-ui.remote-dom+javascript; framework=react',
    };

    render(<RemoteDOMResourceRenderer resource={resource} library={basicComponentLibrary} />);

    expect(screen.getByTestId('remote-root-renderer')).toBeInTheDocument();
    expect(screen.queryByTestId('standard-dom-renderer-container')).not.toBeInTheDocument();
  });

  it('should use standard DOM renderer when mimeType includes "framework=webcomponents"', () => {
    const resource = {
      ...baseResource,
      mimeType: 'application/vnd.mcp-ui.remote-dom+javascript; framework=webcomponents',
    };

    render(<RemoteDOMResourceRenderer resource={resource} />);

    expect(screen.getByTestId('standard-dom-renderer-container')).toBeInTheDocument();
    expect(screen.queryByTestId('remote-root-renderer')).not.toBeInTheDocument();
  });

  it('should default to standard DOM renderer when mimeType is not provided', () => {
    const resource = { ...baseResource };

    render(<RemoteDOMResourceRenderer resource={resource} />);

    expect(screen.getByTestId('standard-dom-renderer-container')).toBeInTheDocument();
    expect(screen.queryByTestId('remote-root-renderer')).not.toBeInTheDocument();
  });

  it('should default to standard DOM renderer for an unknown framework', () => {
    const resource = {
      ...baseResource,
      mimeType: 'application/vnd.mcp-ui.remote-dom+javascript; framework=unknown',
    };

    render(<RemoteDOMResourceRenderer resource={resource} />);

    expect(screen.getByTestId('standard-dom-renderer-container')).toBeInTheDocument();
    expect(screen.queryByTestId('remote-root-renderer')).not.toBeInTheDocument();
  });

  it('should use the provided component library', () => {
    const resource = {
      ...baseResource,
      mimeType: 'application/vnd.mcp-ui.remote-dom+javascript; framework=react',
    };
    render(<RemoteDOMResourceRenderer resource={resource} library={basicComponentLibrary} />);

    const remoteRootRendererMock = RemoteRootRenderer as Mock;
    expect(remoteRootRendererMock).toHaveBeenCalled();

    const props = remoteRootRendererMock.mock.calls[0][0];
    const componentsMap = props.components as Map<string, unknown>;

    expect(componentsMap).toBeInstanceOf(Map);
    basicComponentLibrary.elements.forEach((element) => {
      expect(componentsMap.has(element.tagName)).toBe(true);
    });
  });
});
