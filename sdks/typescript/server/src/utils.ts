import type { CreateUIResourceOptions, UIResourceProps, AdaptersConfig } from './types.js';
import { UI_METADATA_PREFIX } from './types.js';
import { getAppsSdkAdapterScript } from './adapters/appssdk/adapter.js';
import { getMcpAppsAdapterScript } from './adapters/mcp-apps/adapter.js';

export function getAdditionalResourceProps(
  resourceOptions: Partial<CreateUIResourceOptions>,
): UIResourceProps {
  const additionalResourceProps = { ...(resourceOptions.resourceProps ?? {}) } as UIResourceProps;

  // prefix ui specific metadata with the prefix to be recognized by the client
  if (resourceOptions.uiMetadata || resourceOptions.metadata) {
    const uiPrefixedMetadata = Object.fromEntries(
      Object.entries(resourceOptions.uiMetadata ?? {}).map(([key, value]) => [
        `${UI_METADATA_PREFIX}${key}`,
        value,
      ]),
    );
    // allow user defined _meta to override ui metadata
    additionalResourceProps._meta = {
      ...uiPrefixedMetadata,
      ...(resourceOptions.metadata ?? {}),
      ...(additionalResourceProps._meta ?? {}),
    };
  }

  return additionalResourceProps;
}

/**
 * Robustly encodes a UTF-8 string to Base64.
 * Uses Node.js Buffer if available, otherwise TextEncoder and btoa.
 * @param str The string to encode.
 * @returns Base64 encoded string.
 */
export function utf8ToBase64(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  } else if (typeof TextEncoder !== 'undefined' && typeof btoa !== 'undefined') {
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);
    // Efficiently convert Uint8Array to binary string, handling large arrays in chunks
    let binaryString = '';
    // 8192 is a common chunk size used in JavaScript for performance reasons.
    // It tends to align well with internal buffer sizes and memory page sizes,
    // and it's small enough to avoid stack overflow errors with String.fromCharCode.
    const CHUNK_SIZE = 8192;
    for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
      binaryString += String.fromCharCode(...uint8Array.slice(i, i + CHUNK_SIZE));
    }
    return btoa(binaryString);
  } else {
    console.warn(
      'MCP-UI SDK: Buffer API and TextEncoder/btoa not available. Base64 encoding might not be UTF-8 safe.',
    );
    try {
      return btoa(str);
    } catch (e) {
      throw new Error(
        'MCP-UI SDK: Suitable UTF-8 to Base64 encoding method not found, and fallback btoa failed.',
      );
    }
  }
}

/**
 * Determines the MIME type based on enabled adapters.
 *
 * @param adaptersConfig - Configuration for all adapters
 * @returns The MIME type to use, or undefined if no adapters are enabled
 */
export function getAdapterMimeType(adaptersConfig?: AdaptersConfig): string | undefined {
  if (!adaptersConfig) {
    return undefined;
  }

  // Apps SDK adapter
  if (adaptersConfig.appsSdk?.enabled) {
    return adaptersConfig.appsSdk.mimeType ?? 'text/html+skybridge';
  }

  // MCP Apps adapter uses text/html+mcp as per the ext-apps specification
  if (adaptersConfig.mcpApps?.enabled) {
      return 'text/html+mcp';
  }

  // Future adapters can be added here by checking for their config and returning their mime type.

  return undefined;
}

/**
 * Wraps HTML content with enabled adapter scripts.
 * This allows the HTML to communicate with different platform environments.
 *
 * @param htmlContent - The HTML content to wrap
 * @param adaptersConfig - Configuration for all adapters
 * @returns The wrapped HTML content with adapter scripts injected
 */
export function wrapHtmlWithAdapters(
  htmlContent: string,
  adaptersConfig?: AdaptersConfig,
): string {
  if (!adaptersConfig) {
    return htmlContent;
  }

  const adapterScripts: string[] = [];

  // Apps SDK adapter
  if (adaptersConfig.appsSdk?.enabled) {
    const script = getAppsSdkAdapterScript(adaptersConfig.appsSdk.config);
    adapterScripts.push(script);
  }

  // MCP Apps adapter
  if (adaptersConfig.mcpApps?.enabled) {
    const script = getMcpAppsAdapterScript(adaptersConfig.mcpApps.config);
    adapterScripts.push(script);
  }

  // Future adapters can be added here by checking for their config and pushing their scripts to adapterScripts.

  // If no adapters are enabled, return original HTML
  if (adapterScripts.length === 0) {
    return htmlContent;
  }

  // Combine all adapter scripts
  const combinedScripts = adapterScripts.join('\n');

  let finalHtmlContent: string;

  // If the HTML already has a <head> tag, inject the adapter scripts into it
  if (htmlContent.includes('<head>')) {
    finalHtmlContent = htmlContent.replace('<head>', `<head>\n${combinedScripts}`);
  }
  // If the HTML has an <html> tag but no <head>, add a <head> with the adapter scripts
  else if (htmlContent.includes('<html>')) {
    finalHtmlContent = htmlContent.replace('<html>', `<html>\n<head>\n${combinedScripts}\n</head>`);
  }
  // Otherwise, prepend the adapter scripts before the content
  else {
    finalHtmlContent = `${combinedScripts}\n${htmlContent}`;
  }

  return finalHtmlContent;
}
