import { formatAud, type FigureData } from '../figures';
import {
  resolveInternalUrl,
  resolveLinkKeyFromData,
  type LinksCatalogData,
} from './links-runtime';
import type {
  EvaluatedMessage,
  LinkKey,
  MessageId,
  ResolvedLink,
} from './types';

export interface MessageDefinition {
  id: MessageId;
  template: string;
  figurePlaceholders?: Record<string, string>;
  specHrefs: string[];
  linkKeys: LinkKey[];
  anchorLabels?: Record<string, string>;
}

export function renderMessageFromMap(
  id: MessageId,
  messagesById: ReadonlyMap<MessageId, MessageDefinition>,
  linksData: LinksCatalogData,
  figures: Map<string, FigureData>,
  enabledUrls: Set<string>,
  checkedDateFormatted = '',
): EvaluatedMessage {
  const def = messagesById.get(id);
  if (!def) {
    throw new Error(`Unknown checker message id: ${id}`);
  }

  let text = def.template;
  if (def.figurePlaceholders) {
    for (const [token, figId] of Object.entries(def.figurePlaceholders)) {
      const fig = figures.get(figId);
      const formatted = fig ? formatAud(fig.amountMax, fig.display ?? 'standard') : figId;
      text = text.replace(`{${token}}`, formatted);
    }
  }
  if (text.includes('{date}')) {
    text = text.replace('{date}', checkedDateFormatted);
  }

  const links: ResolvedLink[] = def.specHrefs.map((specHref, idx) => {
    const key = def.linkKeys[idx] ?? def.linkKeys[0];
    const baseResolved = resolveLinkKeyFromData(key, enabledUrls, linksData);
    if (specHref.includes('#')) {
      const resolvedHref = resolveInternalUrl(specHref, enabledUrls, [
        baseResolved.href,
        '/victoria/',
      ]);
      return {
        key,
        label: def.anchorLabels?.[specHref] ?? baseResolved.label,
        specHref,
        href: resolvedHref,
        external: false,
      };
    }
    return baseResolved;
  });

  return {
    id: def.id,
    text,
    links,
  };
}
