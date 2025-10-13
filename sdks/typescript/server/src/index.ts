import {
  Base64BlobContent,
  CreateUIResourceOptions,
  HTMLTextContent,
  MimeType,
  UIActionResult,
  UIActionResultLink,
  UIActionResultNotification,
  UIActionResultPrompt,
  UIActionResultIntent,
  UIActionResultToolCall,
} from './types.js';
import { getAdditionalResourceProps, utf8ToBase64, wrapHtmlWithAdapters, getAdapterMimeType } from './utils.js';

export type UIResource = {
  type: 'resource';
  resource: HTMLTextContent | Base64BlobContent;
  annotations?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
};

/**
 * Creates a UIResource.
 * This is the object that should be included in the 'content' array of a toolResult.
 * @param options Configuration for the interactive resource.
 * @returns a UIResource.
 */
export function createUIResource(options: CreateUIResourceOptions): UIResource {
  let actualContentString: string;
  let mimeType: MimeType;

  if (options.content.type === 'rawHtml') {
    if (!options.uri.startsWith('ui://')) {
      throw new Error("MCP-UI SDK: URI must start with 'ui://' when content.type is 'rawHtml'.");
    }
    actualContentString = options.content.htmlString;
    if (typeof actualContentString !== 'string') {
      throw new Error(
        "MCP-UI SDK: content.htmlString must be provided as a string when content.type is 'rawHtml'.",
      );
    }

    // Wrap with adapters if any are enabled
    if (options.adapters) {
      actualContentString = wrapHtmlWithAdapters(actualContentString, options.adapters);
      // Use adapter's mime type if provided, otherwise fall back to 'text/html'
      mimeType = (getAdapterMimeType(options.adapters) as MimeType) ?? 'text/html';
    } else {
      mimeType = 'text/html';
    }
  } else if (options.content.type === 'externalUrl') {
    if (!options.uri.startsWith('ui://')) {
      throw new Error(
        "MCP-UI SDK: URI must start with 'ui://' when content.type is 'externalUrl'.",
      );
    }
    actualContentString = options.content.iframeUrl;
    if (typeof actualContentString !== 'string') {
      throw new Error(
        "MCP-UI SDK: content.iframeUrl must be provided as a string when content.type is 'externalUrl'.",
      );
    }
    mimeType = 'text/uri-list';
  } else if (options.content.type === 'remoteDom') {
    if (!options.uri.startsWith('ui://')) {
      throw new Error("MCP-UI SDK: URI must start with 'ui://' when content.type is 'remoteDom'.");
    }
    actualContentString = options.content.script;
    if (typeof actualContentString !== 'string') {
      throw new Error(
        "MCP-UI SDK: content.script must be provided as a string when content.type is 'remoteDom'.",
      );
    }
    mimeType = `application/vnd.mcp-ui.remote-dom+javascript; framework=${options.content.framework}`;
  } else {
    // This case should ideally be prevented by TypeScript's discriminated union checks
    const exhaustiveCheckContent: never = options.content;
    throw new Error(`MCP-UI SDK: Invalid content.type specified: ${exhaustiveCheckContent}`);
  }

  let resource: UIResource['resource'];

  switch (options.encoding) {
    case 'text':
      resource = {
        uri: options.uri,
        mimeType: mimeType as MimeType,
        text: actualContentString,
        ...getAdditionalResourceProps(options),
      };
      break;
    case 'blob':
      resource = {
        uri: options.uri,
        mimeType: mimeType as MimeType,
        blob: utf8ToBase64(actualContentString),
        ...getAdditionalResourceProps(options),
      };
      break;
    default: {
      const exhaustiveCheck: never = options.encoding;
      throw new Error(`MCP-UI SDK: Invalid encoding type: ${exhaustiveCheck}`);
    }
  }

  return {
    type: 'resource',
    resource: resource,
    ...(options.embeddedResourceProps ?? {}),
  };
}

export type {
  CreateUIResourceOptions,
  ResourceContentPayload,
  UIActionResult,
  AdaptersConfig,
  AppsSdkAdapterOptions,
} from './types.js';

// Export adapters
export { wrapHtmlWithAdapters, getAdapterMimeType } from './utils.js';
export * from './adapters/index.js';

export function postUIActionResult(result: UIActionResult): void {
  if (window.parent) {
    window.parent.postMessage(result, '*');
  }
}

export const InternalMessageType = {
  UI_MESSAGE_RECEIVED: 'ui-message-received',
  UI_MESSAGE_RESPONSE: 'ui-message-response',

  UI_SIZE_CHANGE: 'ui-size-change',

  UI_LIFECYCLE_IFRAME_READY: 'ui-lifecycle-iframe-ready',
  UI_LIFECYCLE_IFRAME_RENDER_DATA: 'ui-lifecycle-iframe-render-data',
};

export const ReservedUrlParams = {
  WAIT_FOR_RENDER_DATA: 'waitForRenderData',
} as const;

export function uiActionResultToolCall(
  toolName: string,
  params: Record<string, unknown>,
): UIActionResultToolCall {
  return {
    type: 'tool',
    payload: {
      toolName,
      params,
    },
  };
}

export function uiActionResultPrompt(prompt: string): UIActionResultPrompt {
  return {
    type: 'prompt',
    payload: {
      prompt,
    },
  };
}

export function uiActionResultLink(url: string): UIActionResultLink {
  return {
    type: 'link',
    payload: {
      url,
    },
  };
}

export function uiActionResultIntent(
  intent: string,
  params: Record<string, unknown>,
): UIActionResultIntent {
  return {
    type: 'intent',
    payload: {
      intent,
      params,
    },
  };
}

export function uiActionResultNotification(message: string): UIActionResultNotification {
  return {
    type: 'notify',
    payload: {
      message,
    },
  };
}
