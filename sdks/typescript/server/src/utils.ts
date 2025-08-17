import type { CreateUIResourceOptions, UIResourceProps } from './types.js';
import { UI_METADATA_PREFIX } from './types.js';

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
