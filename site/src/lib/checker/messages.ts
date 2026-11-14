import type { FigureData } from '../figures';
import { LINKS_DATA } from './links';
import messagesJson from './messages-data.json' with { type: 'json' };
import {
  renderMessageFromMap,
  type MessageDefinition,
} from './messages-runtime';
import type { EvaluatedMessage, MessageId } from './types';

export type { MessageDefinition };

export const MESSAGES: readonly MessageDefinition[] =
  messagesJson as unknown as MessageDefinition[];

export const MESSAGES_BY_ID: ReadonlyMap<MessageId, MessageDefinition> = new Map(
  MESSAGES.map((m) => [m.id, m]),
);

export function renderMessage(
  id: MessageId,
  figures: Map<string, FigureData>,
  enabledUrls: Set<string>,
  checkedDateFormatted = '',
): EvaluatedMessage {
  return renderMessageFromMap(
    id,
    MESSAGES_BY_ID,
    LINKS_DATA,
    figures,
    enabledUrls,
    checkedDateFormatted,
  );
}
