// Primary identifier for the resource. Starts with ui://`
export type URI = `ui://${string}`;

// text/html for rawHtml content, text/uri-list for externalUrl content
export type MimeType =
  | 'text/html'
  | 'text/uri-list'
  | 'application/vnd.mcp-ui.remote-dom+javascript; flavor=react'
  | 'application/vnd.mcp-ui.remote-dom+javascript; flavor=webcomponents';

export type HTMLTextContent = {
  uri: URI;
  mimeType: MimeType;
  text: string; // HTML content (for mimeType `text/html`), or iframe URL (for mimeType `text/uri-list`)
  blob?: never;
};

export type Base64BlobContent = {
  uri: URI;
  mimeType: MimeType;
  blob: string; //  Base64 encoded HTML content (for mimeType `text/html`), or iframe URL (for mimeType `text/uri-list`)
  text?: never;
};

export type ResourceContentPayload =
  | { type: 'rawHtml'; htmlString: string }
  | { type: 'externalUrl'; iframeUrl: string }
  | {
      type: 'remoteDom';
      script: string;
      flavor: 'react' | 'webcomponents';
    };

export interface CreateUIResourceOptions {
  uri: URI;
  content: ResourceContentPayload;
  delivery: 'text' | 'blob';
}

export type UIActionType = 'tool' | 'prompt' | 'link' | 'intent' | 'notification';

export type UIActionResultToolCall = {
  type: 'tool';
  payload: {
    toolName: string;
    params: Record<string, unknown>;
  };
};

export type UIActionResultPrompt = {
  type: 'prompt';
  payload: {
    prompt: string;
  };
};

export type UIActionResultLink = {
  type: 'link';
  payload: {
    url: string;
  };
};

export type UIActionResultIntent = {
  type: 'intent';
  payload: {
    intent: string;
    params: Record<string, unknown>;
  };
};

export type UIActionResultNotification = {
  type: 'notification';
  payload: {
    message: string;
  };
};

export type UIActionResultRequestInfo = {
  type: 'requestInfo';
  payload: {
    requestId: string;
    requestContext: string;
    params?: Record<string, unknown>;
  };
};

export type UIActionResult =
  | UIActionResultToolCall
  | UIActionResultPrompt
  | UIActionResultLink
  | UIActionResultIntent
  | UIActionResultNotification
  | UIActionResultRequestInfo;
