import r2wc from '@r2wc/react-to-web-component';
import { UIResourceRenderer, type UIResourceRendererProps } from './UIResourceRenderer';
import { FC, useCallback, useRef } from 'react';
import { UIActionResult } from '../types';
import type { EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';

type UIResourceRendererWCProps = Omit<UIResourceRendererProps, 'resource' | 'onUIAction'> & {
  resource?: EmbeddedResource['resource'] | string;
};

function normalizeJsonProp(prop: unknown): Record<string, unknown> | undefined {
  if (typeof prop === 'object' && prop !== null) {
    return prop as Record<string, unknown>;
  }
  if (typeof prop === 'string' && prop.trim() !== '') {
    try {
      return JSON.parse(prop);
    } catch (e) {
      console.error('Failed to parse JSON prop:', { prop, error: e });
      return undefined;
    }
  }
}

export const UIResourceRendererWCWrapper: FC<UIResourceRendererWCProps> = (props) => {
  const {
    resource: rawResource,
    supportedContentTypes: rawSupportedContentTypes,
    htmlProps: rawHtmlProps,
    remoteDomProps: rawRemoteDomProps,
  } = props;

  const resource = normalizeJsonProp(rawResource) as
    | Partial<EmbeddedResource['resource']>
    | undefined;
  const supportedContentTypes = normalizeJsonProp(rawSupportedContentTypes);
  const htmlProps = normalizeJsonProp(rawHtmlProps);
  const remoteDomProps = normalizeJsonProp(rawRemoteDomProps);

  const ref = useRef<HTMLDivElement>(null);

  const onUIActionCallback = useCallback(async (event: UIActionResult): Promise<void> => {
    if (ref.current) {
      const customEvent = new CustomEvent('onUIAction', {
        detail: event,
        composed: true,
        bubbles: true,
      });
      ref.current.dispatchEvent(customEvent);
    }
  }, []);

  if (!resource) {
    return <p style={{ color: 'red' }}>Resource not provided.</p>;
  }

  return (
    <div ref={ref}>
      <UIResourceRenderer
        resource={resource}
        supportedContentTypes={
          supportedContentTypes as unknown as UIResourceRendererProps['supportedContentTypes']
        }
        htmlProps={htmlProps}
        remoteDomProps={remoteDomProps}
        onUIAction={onUIActionCallback}
      />
    </div>
  );
};

customElements.define(
  'ui-resource-renderer',
  r2wc(UIResourceRendererWCWrapper, {
    props: {
      resource: 'json',
      supportedContentTypes: 'json',
      htmlProps: 'json',
      remoteDomProps: 'json',
      /* `onUIAction` is intentionally omitted as the WC implements its own event dispatching mechanism for UI actions.
       * Consumers should listen for the `onUIAction` CustomEvent on the element instead of passing an `onUIAction` prop.
       */
    },
  }),
);
