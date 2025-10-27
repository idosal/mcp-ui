import type { EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';
import { ResourceContentType, UIActionResult, ClientContextProps, MCPContextProps } from '../types';
import { HTMLResourceRenderer, HTMLResourceRendererProps } from './HTMLResourceRenderer';
import { RemoteDOMResourceProps, RemoteDOMResourceRenderer } from './RemoteDOMResourceRenderer';
import { basicComponentLibrary } from '../remote-dom/component-libraries/basic';

export type UIResourceRendererProps = {
  resource: Partial<EmbeddedResource>;
  onUIAction?: (result: UIActionResult) => Promise<unknown>;
  supportedContentTypes?: ResourceContentType[];
  htmlProps?: Omit<HTMLResourceRendererProps, 'resource' | 'onUIAction' | 'mcpContextProps' | 'clientContextProps'>;
  remoteDomProps?: RemoteDOMResourceProps;
  mcpContextProps?: MCPContextProps;
  clientContextProps?: ClientContextProps;
};

function getContentType(
  resource: Partial<EmbeddedResource['resource']>,
): ResourceContentType | undefined {
  if (resource.contentType) {
    return resource.contentType as ResourceContentType;
  }

  if (resource.mimeType === 'text/html') {
    return 'rawHtml';
  }
  if (resource.mimeType === 'text/html+skybridge') {
    return 'skybridge';
  }
  if (resource.mimeType === 'text/uri-list') {
    return 'externalUrl';
  }
  if (resource.mimeType?.startsWith('application/vnd.mcp-ui.remote-dom')) {
    return 'remoteDom';
  }
}

export const UIResourceRenderer = (props: UIResourceRendererProps) => {
  const { resource, onUIAction, supportedContentTypes, htmlProps, remoteDomProps, mcpContextProps, clientContextProps } = props;
  const contentType = getContentType(resource);

  if (supportedContentTypes && contentType && !supportedContentTypes.includes(contentType)) {
    return <p className="text-red-500">Unsupported content type: {contentType}.</p>;
  }

  switch (contentType) {
    case 'rawHtml':
    case 'skybridge':
    case 'externalUrl': {
      return (
        <HTMLResourceRenderer
          resource={resource}
          onUIAction={onUIAction}
          {...htmlProps}
          {...mcpContextProps}
          {...clientContextProps}
        />
      );
    }
    case 'remoteDom':
      return (
        <RemoteDOMResourceRenderer
          resource={resource}
          onUIAction={onUIAction}
          library={remoteDomProps?.library || basicComponentLibrary}
          {...remoteDomProps}
        />
      );
    default:
      return <p className="text-red-500">Unsupported resource type.</p>;
  }
};

UIResourceRenderer.displayName = 'UIResourceRenderer';
