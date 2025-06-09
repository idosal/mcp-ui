// Primary identifier for the resource. Starts with ui://`
export type URI = `ui://${string}`;

// text/html for rawHtml content, text/uri-list for externalUrl content
export type MimeType = 'text/html' | 'text/uri-list';

export type HtmlTextContent = {
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
  | { type: 'externalUrl'; iframeUrl: string };

export interface CreateHtmlResourceOptions {
  uri: URI; // REQUIRED. Must start with "ui://" if content.type is "rawHtml",
  // or "ui-app://" if content.type is "externalUrl".
  content: ResourceContentPayload; // REQUIRED. The actual content payload.
  delivery: 'text' | 'blob'; // REQUIRED. How the content string (htmlString or iframeUrl) should be packaged.
}

export type UiActionType =
  | 'tool'
  | 'prompt'
  | 'link'
  | 'intent'
  | 'notification';

export type UiActionResultToolCall = {
  type: 'tool';
  payload: {
    toolName: string;
    params: Record<string, unknown>;
  };
};

export type UiActionResultPrompt = {
  type: 'prompt';
  payload: {
    prompt: string;
  };
};

export type UiActionResultLink = {
  type: 'link';
  payload: {
    url: string;
  };
};

export type UiActionResultIntent = {
  type: 'intent';
  payload: {
    intent: string;
    params: Record<string, unknown>;
  };
};

export type UiActionResultNotification = {
  type: 'notification';
  payload: {
    message: string;
  };
};

export type UiActionResult =
  | UiActionResultToolCall
  | UiActionResultPrompt
  | UiActionResultLink
  | UiActionResultIntent
  | UiActionResultNotification;
