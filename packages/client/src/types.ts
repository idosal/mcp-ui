export type UiActionType = 'tool' | 'prompt' | 'link' | 'intent' | 'notification';

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
