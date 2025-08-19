import type { Resource } from '@modelcontextprotocol/sdk/types.js';

// Primary identifier for the resource. Starts with ui://`
export type URI = `ui://${string}`;

// text/html for rawHtml content, text/uri-list for externalUrl content
export type MimeType =
  | 'text/html'
  | 'text/uri-list'
  | 'application/vnd.mcp-ui.remote-dom+javascript; framework=react'
  | 'application/vnd.mcp-ui.remote-dom+javascript; framework=webcomponents';

export type HTMLTextContent = {
  uri: URI;
  mimeType: MimeType;
  text: string; // HTML content (for mimeType `text/html`), or iframe URL (for mimeType `text/uri-list`)
  blob?: never;
  _meta?: Record<string, unknown>;
};

export type Base64BlobContent = {
  uri: URI;
  mimeType: MimeType;
  blob: string; //  Base64 encoded HTML content (for mimeType `text/html`), or iframe URL (for mimeType `text/uri-list`)
  text?: never;
  _meta?: Record<string, unknown>;
};

export type ResourceContentPayload =
  | { type: 'rawHtml'; htmlString: string }
  | { type: 'externalUrl'; iframeUrl: string }
  | {
      type: 'remoteDom';
      script: string;
      framework: 'react' | 'webcomponents';
    };

export interface CreateUIResourceOptions {
  uri: URI;
  content: ResourceContentPayload;
  encoding: 'text' | 'blob';
  // specific mcp-ui metadata
  uiMetadata?: UIResourceMetadata;
  // additional metadata to be passed on _meta
  metadata?: Record<string, unknown>;
  // additional resource props to be passed on resource (i.e. annotations)
  resourceProps?: UIResourceProps;
}

export type UIResourceProps = Omit<Partial<Resource>, 'uri' | 'mimeType'>;

export const UIMetadataKey = {
  PREFERRED_FRAME_SIZE: 'preferred-frame-size',
  INITIAL_RENDER_DATA: 'initial-render-data',
} as const;

export const UI_METADATA_PREFIX = 'mcpui.dev/ui-';

export type UIResourceMetadata = {
  [UIMetadataKey.PREFERRED_FRAME_SIZE]?: [string, string];
  [UIMetadataKey.INITIAL_RENDER_DATA]?: Record<string, unknown>;
};

export type UIActionType = 'tool' | 'prompt' | 'link' | 'intent' | 'notify';

type GenericActionMessage = {
  messageId?: string;
};

export type UIActionResultToolCall = GenericActionMessage & {
  type: 'tool';
  payload: {
    toolName: string;
    params: Record<string, unknown>;
  };
};

export type UIActionResultPrompt = GenericActionMessage & {
  type: 'prompt';
  payload: {
    prompt: string;
  };
};

export type UIActionResultLink = GenericActionMessage & {
  type: 'link';
  payload: {
    url: string;
  };
};

export type UIActionResultIntent = GenericActionMessage & {
  type: 'intent';
  payload: {
    intent: string;
    params: Record<string, unknown>;
  };
};

export type UIActionResultNotification = GenericActionMessage & {
  type: 'notify';
  payload: {
    message: string;
  };
};

export type UIActionResult =
  | UIActionResultToolCall
  | UIActionResultPrompt
  | UIActionResultLink
  | UIActionResultIntent
  | UIActionResultNotification;
