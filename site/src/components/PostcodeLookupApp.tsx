import { useMemo, useRef, useState } from 'preact/hooks';
import { AreaCardView, renderResolvedLink } from './AreaCardView';
import { formatAuDate } from '../lib/dates';
import {
  buildAreaCardFromData,
  lookupPostcode,
} from '../lib/checker/area-runtime';
import {
  resolveLinkKeyFromData,
  type LinksCatalogData,
} from '../lib/checker/links-runtime';
import {
  renderMessageFromMap,
  type MessageDefinition,
} from '../lib/checker/messages-runtime';
import { fetchCompactPostcodesOnce } from '../lib/checker/postcode-client';
import type {
  EvaluatedMessage,
  MessageId,
  PostcodeAreaRecord,
  PostcodesDataset,
  ResolvedLink,
  SourceMeta,
} from '../lib/checker/types';

export interface PostcodeFigureBootstrap {
  id: string;
  formatted: string;
  scenario: string;
  kindTag: string;
  basis: 'official' | 'estimate';
  method?: string;
  sourceId: string;
  checkedOn: string;
}

export interface PostcodeLookupBootstrapPayload {
  postcodesUrl: string;
  figures: PostcodeFigureBootstrap[];
  sources: SourceMeta[];
  enabledUrls: string[];
  links: LinksCatalogData;
  x1Message: MessageDefinition;
  gasNoText: string;
  hpz5Text: string;
}

interface LocalitySuggestion {
  record: PostcodeAreaRecord;
  matchedLocality: string;
  score: number;
}

function findLocalitySuggestions(
  query: string,
  dataset: PostcodesDataset | null,
): LocalitySuggestion[] {
  const q = query.trim().toLowerCase();
  if (!dataset || q.length < 2 || /^\d+$/.test(q)) {
    return [];
  }

  const matches: LocalitySuggestion[] = [];
  for (const record of Object.values(dataset.rows)) {
    let bestScore = 99;
    let bestLocality = record.localitiesList[0] ?? '';
    for (const loc of record.localitiesList) {
      const lower = loc.toLowerCase();
      if (lower === q) {
        bestScore = 0;
        bestLocality = loc;
        break;
      }
      if (lower.startsWith(q) && bestScore > 1) {
        bestScore = 1;
        bestLocality = loc;
      } else if (lower.includes(q) && bestScore > 2) {
        bestScore = 2;
        bestLocality = loc;
      }
    }
    if (bestScore < 99) {
      matches.push({ record, matchedLocality: bestLocality, score: bestScore });
    }
  }

  matches.sort(
    (a, b) => a.score - b.score || a.record.postcode.localeCompare(b.record.postcode),
  );
  return matches.slice(0, 8);
}

export function PostcodeLookupApp({
  bootstrap,
}: {
  bootstrap: PostcodeLookupBootstrapPayload;
}) {
  const figuresById = useMemo(
    () => new Map(bootstrap.figures.map((f) => [f.id, f])),
    [bootstrap.figures],
  );
  const sourcesById = useMemo(
    () => new Map(bootstrap.sources.map((s) => [s.id, s])),
    [bootstrap.sources],
  );
  const enabledUrlsSet = useMemo(
    () => new Set(bootstrap.enabledUrls),
    [bootstrap.enabledUrls],
  );
  const messagesById = useMemo(
    () => new Map<MessageId, MessageDefinition>([[bootstrap.x1Message.id, bootstrap.x1Message]]),
    [bootstrap.x1Message],
  );

  const [query, setQuery] = useState<string>('');
  const [dataset, setDataset] = useState<PostcodesDataset | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PostcodeAreaRecord | null>(null);
  const [notFoundError, setNotFoundError] = useState<EvaluatedMessage | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [activeOptionIdx, setActiveOptionIdx] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement>(null);

  const ensureDataset = async (): Promise<PostcodesDataset> => {
    if (dataset) return dataset;
    setLoading(true);
    setLoadError(null);
    try {
      const loaded = await fetchCompactPostcodesOnce(bootstrap.postcodesUrl);
      setDataset(loaded);
      return loaded;
    } catch {
      const msg = 'Could not load the Victorian postcode table. Check your connection and try again.';
      setLoadError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const buildX1 = (): EvaluatedMessage => {
    const raw = renderMessageFromMap(
      'X1',
      messagesById,
      bootstrap.links,
      new Map(),
      enabledUrlsSet,
      '',
    );
    return {
      ...raw,
      links: raw.links.filter((l) => l.href !== '/victoria/postcode/'),
    };
  };

  const evaluateFourDigit = (val: string, ds: PostcodesDataset) => {
    const res = lookupPostcode(val, ds);
    if (res.ok) {
      setSelectedRecord(res.record);
      setNotFoundError(null);
      setDropdownOpen(false);
    } else {
      setSelectedRecord(null);
      setNotFoundError(buildX1());
      setDropdownOpen(false);
    }
  };

  const suggestions = useMemo(
    () => findLocalitySuggestions(query, dataset),
    [query, dataset],
  );

  const selectSuggestion = (record: PostcodeAreaRecord) => {
    setQuery(`${record.postcode} (${record.localitiesList[0] ?? ''})`.trim());
    setSelectedRecord(record);
    setNotFoundError(null);
    setDropdownOpen(false);
    setActiveOptionIdx(-1);
  };

  const handleInput = async (rawValue: string) => {
    setQuery(rawValue);
    setActiveOptionIdx(-1);
    const trimmed = rawValue.trim();

    if (!trimmed) {
      setSelectedRecord(null);
      setNotFoundError(null);
      setDropdownOpen(false);
      return;
    }

    let ds = dataset;
    if (!ds) {
      try {
        ds = await ensureDataset();
      } catch {
        return;
      }
    }

    if (/^\d{4}$/.test(trimmed)) {
      evaluateFourDigit(trimmed, ds);
      return;
    }

    if (/^\d+$/.test(trimmed)) {
      setSelectedRecord(null);
      setNotFoundError(trimmed.length > 4 ? buildX1() : null);
      setDropdownOpen(false);
      return;
    }

    setSelectedRecord(null);
    setNotFoundError(null);
    setDropdownOpen(trimmed.length >= 2);
  };

  const handleSubmit = async (ev: Event) => {
    ev.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setSelectedRecord(null);
      setNotFoundError(null);
      return;
    }

    let ds = dataset;
    if (!ds) {
      try {
        ds = await ensureDataset();
      } catch {
        return;
      }
    }

    const leadingPcMatch = trimmed.match(/^(\d{4})\b/);
    if (leadingPcMatch) {
      evaluateFourDigit(leadingPcMatch[1], ds);
      return;
    }

    if (/^\d+$/.test(trimmed)) {
      setSelectedRecord(null);
      setNotFoundError(buildX1());
      setDropdownOpen(false);
      return;
    }

    const liveSuggestions = findLocalitySuggestions(trimmed, ds);
    if (activeOptionIdx >= 0 && liveSuggestions[activeOptionIdx]) {
      selectSuggestion(liveSuggestions[activeOptionIdx].record);
      return;
    }
    if (liveSuggestions.length > 0) {
      selectSuggestion(liveSuggestions[0].record);
      return;
    }

    setSelectedRecord(null);
    setNotFoundError(buildX1());
    setDropdownOpen(false);
  };

  const handleKeyDown = (ev: KeyboardEvent) => {
    if (!dropdownOpen || suggestions.length === 0) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      setActiveOptionIdx((prev) => (prev + 1) % suggestions.length);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setActiveOptionIdx((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (ev.key === 'Enter' && activeOptionIdx >= 0 && suggestions[activeOptionIdx]) {
      ev.preventDefault();
      selectSuggestion(suggestions[activeOptionIdx].record);
    } else if (ev.key === 'Escape') {
      setDropdownOpen(false);
      setActiveOptionIdx(-1);
    }
  };

  const areaCard = useMemo(() => {
    if (!dataset || !selectedRecord) return null;
    const built = buildAreaCardFromData(
      selectedRecord,
      dataset.checkedOn,
      enabledUrlsSet,
      bootstrap.links,
    );
    // Avoid self-linking back to /victoria/postcode/ when already on /victoria/postcode/
    const resolvedAreaLink: ResolvedLink =
      built.areaLink.href === '/victoria/postcode/'
        ? {
            label: 'More about your area — Victorian rebate guides',
            specHref: built.areaLink.specHref,
            href: '/victoria/',
            external: false,
          }
        : built.areaLink;
    return { ...built, areaLink: resolvedAreaLink };
  }, [dataset, selectedRecord, enabledUrlsSet, bootstrap.links]);

  const insulationFigure = areaCard?.insulationFigureId
    ? figuresById.get(areaCard.insulationFigureId) ?? null
    : null;
  const insulationSource = insulationFigure
    ? sourcesById.get(insulationFigure.sourceId) ?? null
    : null;

  const gasNoLink = useMemo(
    () => resolveLinkKeyFromData('gas-no-lpg', enabledUrlsSet, bootstrap.links),
    [enabledUrlsSet, bootstrap.links],
  );
  const hpz5Link = useMemo(
    () => resolveLinkKeyFromData('hw-size-guide', enabledUrlsSet, bootstrap.links),
    [enabledUrlsSet, bootstrap.links],
  );

  const showSuggestions = dropdownOpen && suggestions.length > 0;
  const listboxId = 'postcode-lookup-listbox';

  return (
    <div class="postcode-lookup-shell" data-postcode-hydrated="true">
      <form class="postcode-lookup-form" data-postcode-form noValidate onSubmit={handleSubmit}>
        <label class="field-label checker-legend" for="postcode-lookup-input">
          Enter a Victorian postcode or suburb/locality
        </label>
        <p id="postcode-lookup-hint" class="field-hint">
          Type a 4-digit postcode (for example 3427) or a suburb/town name (for example Gisborne). Nothing you type is stored or sent anywhere.
        </p>

        <div class="postcode-lookup-bar">
          <div class="postcode-combobox">
            <input
              ref={inputRef}
              id="postcode-lookup-input"
              name="postcode"
              type="search"
              list={undefined}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggestions ? 'true' : 'false'}
              aria-controls={showSuggestions ? listboxId : undefined}
              aria-activedescendant={
                showSuggestions && activeOptionIdx >= 0
                  ? `postcode-opt-${suggestions[activeOptionIdx].record.postcode}`
                  : undefined
              }
              aria-describedby="postcode-lookup-hint"
              aria-invalid={notFoundError || loadError ? 'true' : undefined}
              placeholder="e.g. 3427 or Gisborne"
              class="postcode-search-input"
              value={query}
              data-postcode-search-input
              onFocus={() => {
                if (!dataset) {
                  void ensureDataset().catch(() => {});
                }
              }}
              onInput={(ev) => void handleInput(ev.currentTarget.value)}
              onKeyDown={handleKeyDown}
            />

            {showSuggestions && (
              <ul
                id={listboxId}
                role="listbox"
                class="postcode-suggestions"
                aria-label="Matching Victorian postcodes"
                data-postcode-suggestions
              >
                {suggestions.map((item, idx) => {
                  const isActive = idx === activeOptionIdx;
                  const locs =
                    item.record.localitiesList.length <= 3
                      ? item.record.localitiesList.join(', ')
                      : `${item.record.localitiesList.slice(0, 3).join(', ')}, +${
                          item.record.localitiesList.length - 3
                        } more`;
                  return (
                    <li
                      key={item.record.postcode}
                      id={`postcode-opt-${item.record.postcode}`}
                      role="option"
                      aria-selected={isActive ? 'true' : 'false'}
                      class={`postcode-suggestions__item ${
                        isActive ? 'postcode-suggestions__item--active' : ''
                      }`}
                      data-suggestion-postcode={item.record.postcode}
                      onMouseDown={(ev) => {
                        ev.preventDefault();
                        selectSuggestion(item.record);
                      }}
                    >
                      <strong>{item.record.postcode}</strong> — {locs}{' '}
                      <span class="postcode-suggestions__meta">
                        ({item.record.veu_area} · {item.record.primary_lga})
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <button
            type="submit"
            class="btn"
            disabled={loading}
            data-postcode-submit
          >
            {loading ? 'Loading…' : 'Look up'}
          </button>

          {(query || selectedRecord || notFoundError) && (
            <button
              type="button"
              class="checker-reset-btn"
              data-postcode-clear
              onClick={() => {
                setQuery('');
                setSelectedRecord(null);
                setNotFoundError(null);
                setDropdownOpen(false);
                setActiveOptionIdx(-1);
                inputRef.current?.focus();
              }}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {notFoundError && (
        <div
          class="field-error checker-postcode-error"
          role="alert"
          data-postcode-error
          data-message-id={notFoundError.id}
        >
          <p>{notFoundError.text}</p>
          {notFoundError.links.length > 0 && (
            <p>
              {notFoundError.links.map((lnk, idx) => (
                <span key={`${lnk.specHref}|${lnk.href}`}>
                  {idx > 0 ? ' · ' : ''}
                  {renderResolvedLink(lnk)}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {loadError && !notFoundError && (
        <p class="field-error" role="alert">
          {loadError}
        </p>
      )}

      {areaCard && selectedRecord && (
        <div aria-live="polite" data-postcode-result>
          <AreaCardView
            card={areaCard}
            councilSuffix={
              selectedRecord.primary_lga_share_pct === null
                ? ' (indicative — non-residential postcode)'
                : undefined
            }
            sourceNote={`From VEU Specifications v25.0 Table A; councils from ABS ASGS Edition 3 allocation files, weighted by 2021 Census dwellings. Checked ${formatAuDate(areaCard.specCheckedOn)}.`}
            hideDefaultAreaLink
          >
            {insulationFigure && (
              <div
                class="postcode-insulation-box"
                data-postcode-insulation
                data-figure={insulationFigure.id}
                data-figure-basis={insulationFigure.basis}
              >
                <div class="postcode-insulation-box__top">
                  <span class="postcode-insulation-box__label">
                    Ceiling insulation (150 m² house · {areaCard.veuArea} + {areaCard.climaticRegion}):
                  </span>{' '}
                  <strong class="postcode-insulation-box__amount">
                    {insulationFigure.formatted}
                  </strong>{' '}
                  <span class="postcode-insulation-box__kind">
                    ({insulationFigure.kindTag})
                  </span>
                </div>
                {insulationFigure.basis === 'estimate' && (
                  <details class="checker-estimate-disclosure" data-estimate-disclosure>
                    <summary>How we estimated this</summary>
                    <p>
                      {insulationFigure.method ??
                        'Estimated from VEU Specifications v25.0 Part 48.'}
                    </p>
                  </details>
                )}
                <div class="postcode-insulation-box__meta">
                  Checked on {formatAuDate(insulationFigure.checkedOn)}
                  {insulationSource ? (
                    <>
                      {' '}
                      ·{' '}
                      <a
                        href={insulationSource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {insulationSource.publisher} ↗
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {(!selectedRecord.reticulated_gas || selectedRecord.heat_pump_zone === 5) && (
              <div class="postcode-card-notes" data-postcode-notes>
                {!selectedRecord.reticulated_gas && (
                  <p class="checker-modifier-note" data-postcode-note="GAS-NO">
                    {bootstrap.gasNoText} {renderResolvedLink(gasNoLink)}
                  </p>
                )}
                {selectedRecord.heat_pump_zone === 5 && (
                  <p class="checker-modifier-note" data-postcode-note="HPZ-5">
                    {bootstrap.hpz5Text} {renderResolvedLink(hpz5Link)}
                  </p>
                )}
              </div>
            )}

            <div class="postcode-card-actions" data-postcode-actions>
              <a
                class="btn"
                href={`/victoria/eligibility-checker/?pc=${selectedRecord.postcode}`}
                data-postcode-checker-link
              >
                Check your discounts for this postcode
              </a>
              <span data-area-link>
                {renderResolvedLink(areaCard.areaLink, 'btn btn--secondary')}
              </span>
            </div>
          </AreaCardView>
        </div>
      )}
    </div>
  );
}
