export { UIResourceRenderer } from './components/UIResourceRenderer';
export { getUIResourceMetadata, getResourceMetadata } from './utils/metadataUtils';

// The types needed to create a custom component library
export type {
  ComponentLibrary,
  ComponentLibraryElement,
  RemoteElementConfiguration,
} from './types';

// Export the default libraries so hosts can register them if they choose
export { basicComponentLibrary } from './remote-dom/component-libraries/basic';

// --- Remote Element Extensibility ---
export {
  remoteCardDefinition,
  remoteButtonDefinition,
  remoteTextDefinition,
  remoteStackDefinition,
  remoteImageDefinition,
} from './remote-dom/remote-elements';

export type {
  UIActionResult,
  UIActionType,
  ResourceContentType,
  ALL_RESOURCE_CONTENT_TYPES,
  UIActionResultIntent,
  UIActionResultLink,
  UIActionResultNotification,
  UIActionResultPrompt,
  UIActionResultToolCall,
} from './types';
