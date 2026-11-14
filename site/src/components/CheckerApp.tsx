import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { AreaCardView, renderResolvedLink } from './AreaCardView';
import { formatAuDate } from '../lib/dates';
import type { FigureData, FigureKind } from '../lib/figures';
import {
  buildAreaCardFromData,
  computeOldestCheckerCheckedOnFromRules,
  evaluateWithCatalog,
  FIELD_HOOKS,
  getVisibleFieldsFromList,
  hydrateFields,
  hydrateRules,
  lookupPostcode,
  pruneHiddenAnswersFromList,
  renderMessageFromMap,
  RULE_HOOKS,
  type CheckerAnswers,
  type CheckerCatalogRuntime,
  type CheckerEvaluationContext,
  type EvaluatedFigure,
  type EvaluatedLine,
  type EvaluatedMessage,
  type FieldDefinition,
  type FieldMeta,
  type LinksCatalogData,
  type MessageDefinition,
  type MessageId,
  type PostcodesDataset,
  type ResolvedLink,
  type RuleMeta,
  type RuleStatus,
  type SourceMeta,
} from '../lib/checker/client';
import { fetchCompactPostcodesOnce } from '../lib/checker/postcode-client';
import { decodeAnswersFromHash, encodeAnswersToHash } from '../lib/checker/share';

export interface CheckerElectionNoticeBootstrap {
  visible: boolean;
  message: string;
  sourceUrl: string;
  sourcePublisher: string;
  checkedOnFormatted: string;
}

export interface CheckerBootstrapCatalog {
  rules: RuleMeta[];
  fields: FieldMeta[];
  messages: MessageDefinition[];
  links: LinksCatalogData;
}

export interface CheckerBootstrapPayload {
  postcodesUrl: string;
  figures: FigureData[];
  kindTags: Record<FigureKind, string>;
  sources: SourceMeta[];
  enabledUrls: string[];
  solsticePostcodes: string[];
  catalog: CheckerBootstrapCatalog;
  electionNotice: CheckerElectionNoticeBootstrap;
}

const SESSION_ANSWERS_KEY = 'hr_checker_v2_answers';
const SESSION_STEP_KEY = 'hr_checker_v2_step';

const STATUS_LABELS: Readonly<Record<RuleStatus, string>> = {
  likely: 'Likely',
  possibly: 'Possibly',
  'not-eligible': 'Not eligible',
  info: 'Info',
};

function readSessionAnswers(): { answers: CheckerAnswers; savedStep: string | null } {
  try {
    const raw = sessionStorage.getItem(SESSION_ANSWERS_KEY);
    const savedStep = sessionStorage.getItem(SESSION_STEP_KEY);
    if (!raw) return { answers: {}, savedStep: null };
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { answers: parsed as CheckerAnswers, savedStep };
    }
  } catch {}
  return { answers: {}, savedStep: null };
}

function writeSessionState(answers: CheckerAnswers, stepValue: string): void {
  try {
    sessionStorage.setItem(SESSION_ANSWERS_KEY, JSON.stringify(answers));
    sessionStorage.setItem(SESSION_STEP_KEY, stepValue);
  } catch {}
}

function clearSessionState(): void {
  try {
    sessionStorage.removeItem(SESSION_ANSWERS_KEY);
    sessionStorage.removeItem(SESSION_STEP_KEY);
  } catch {}
}

function InlineLinks({ links }: { links: ResolvedLink[] }) {
  return (
    <>
      {links.map((lnk, idx) => (
        <span key={`${lnk.specHref}|${lnk.href}`}>
          {idx > 0 ? ' · ' : ''}
          {renderResolvedLink(lnk)}
        </span>
      ))}
    </>
  );
}

function CheckerMoneyBlock({
  fig,
  kindTags,
  sourcesMap,
}: {
  fig: EvaluatedFigure;
  kindTags: Record<FigureKind, string>;
  sourcesMap: Map<string, SourceMeta>;
}) {
  const src = sourcesMap.get(fig.sourceId);
  const isEstimate = fig.basis === 'estimate';
  return (
    <figure
      class="money-block checker-money-block"
      data-money-block
      data-figure={fig.id}
      data-figure-basis={fig.basis}
      data-kind={fig.kind}
    >
      <figcaption class="money-block__label" data-money-label>
        {fig.scenario}
      </figcaption>
      <span class="money-block__kind" data-money-kind>
        {kindTags[fig.kind]}
      </span>
      <span class="money-block__amount">{fig.formatted}</span>
      {isEstimate && (
        <details class="checker-estimate-disclosure" data-estimate-disclosure>
          <summary>How we estimated this</summary>
          <p>{fig.method ?? 'Estimated from VEU Specifications v25.0.'}</p>
        </details>
      )}
      <span class="money-block__meta">
        Checked on {formatAuDate(fig.checkedOn)}
        {src ? (
          <>
            {' '}
            ·{' '}
            <a href={src.url} target="_blank" rel="noopener noreferrer">
              {src.publisher} ↗
            </a>
          </>
        ) : null}
      </span>
    </figure>
  );
}

function LineCard({
  line,
  kindTags,
  sourcesMap,
}: {
  line: EvaluatedLine;
  kindTags: Record<FigureKind, string>;
  sourcesMap: Map<string, SourceMeta>;
}) {
  return (
    <article
      class={`checker-line checker-line--${line.status}`}
      data-checker-line
      data-rule-id={line.ruleId}
      data-status={line.status}
      data-program={line.programGroup}
    >
      <div class="checker-line__header">
        <span class={`checker-chip checker-chip--${line.status}`} data-status-chip>
          {STATUS_LABELS[line.status]}
        </span>
        <span class="checker-program-tag" data-program-label>
          {line.programLabel}
        </span>
      </div>

      <h4 class="checker-line__title">{line.title}</h4>

      {line.figures.length > 0 && (
        <div class="checker-line__figures" data-line-figures>
          {line.figures.map((fig) => (
            <CheckerMoneyBlock key={fig.id} fig={fig} kindTags={kindTags} sourcesMap={sourcesMap} />
          ))}
        </div>
      )}

      {line.coPayFigures.length > 0 && (
        <div class="checker-line__copay" data-line-copay>
          {line.coPayFigures.map((fig) => (
            <CheckerMoneyBlock key={fig.id} fig={fig} kindTags={kindTags} sourcesMap={sourcesMap} />
          ))}
        </div>
      )}

      {line.message && (
        <p class="checker-line__message" data-message-id={line.message.id}>
          {line.message.text}
        </p>
      )}

      {(!line.message || line.status !== 'not-eligible') && (
        <p class="checker-line__why">{line.why}</p>
      )}

      {line.notes.length > 0 && (
        <ul class="checker-line__notes">
          {line.notes.map((note, idx) => (
            <li key={idx}>{note}</li>
          ))}
        </ul>
      )}

      {line.links.length > 0 && (
        <ul class="checker-line__links">
          {line.links.map((lnk) => (
            <li key={`${lnk.specHref}|${lnk.href}`}>{renderResolvedLink(lnk)}</li>
          ))}
        </ul>
      )}

      {line.sources.length > 0 && (
        <div class="checker-line__sources">
          {line.sources.map((src, idx) => (
            <span key={src.id} class="checker-source-cite">
              {idx > 0 ? ' · ' : ''}
              <a href={src.url} target="_blank" rel="noopener noreferrer">
                {src.publisher}: {src.title} ↗
              </a>{' '}
              · Checked {formatAuDate(src.checkedOn)}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export function CheckerApp({ bootstrap }: { bootstrap: CheckerBootstrapPayload }) {
  const figuresMap = useMemo(
    () => new Map<string, FigureData>(bootstrap.figures.map((f) => [f.id, f])),
    [bootstrap.figures],
  );
  const sourcesMap = useMemo(
    () => new Map<string, SourceMeta>(bootstrap.sources.map((s) => [s.id, s])),
    [bootstrap.sources],
  );
  const enabledUrlsSet = useMemo(() => new Set<string>(bootstrap.enabledUrls), [bootstrap.enabledUrls]);
  const solsticeSet = useMemo(
    () => new Set<string>(bootstrap.solsticePostcodes),
    [bootstrap.solsticePostcodes],
  );
  const hydratedFields = useMemo(
    () => hydrateFields(bootstrap.catalog.fields, FIELD_HOOKS),
    [bootstrap.catalog.fields],
  );
  const catalogRuntime = useMemo<CheckerCatalogRuntime>(() => {
    const rules = hydrateRules(bootstrap.catalog.rules, RULE_HOOKS);
    const rulesById = new Map(rules.map((r) => [r.id, r]));
    const messagesById = new Map<MessageId, MessageDefinition>(
      bootstrap.catalog.messages.map((m) => [m.id, m]),
    );
    return { rules, rulesById, messagesById, links: bootstrap.catalog.links };
  }, [bootstrap.catalog.rules, bootstrap.catalog.messages, bootstrap.catalog.links]);
  const oldestCheckedIso = useMemo(
    () => computeOldestCheckerCheckedOnFromRules(catalogRuntime.rules, figuresMap),
    [catalogRuntime.rules, figuresMap],
  );

  const [answers, setAnswers] = useState<CheckerAnswers>({});
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [mode, setMode] = useState<'questions' | 'result'>('questions');
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [pendingHashRestore, setPendingHashRestore] = useState<boolean>(false);
  const [postcodesData, setPostcodesData] = useState<PostcodesDataset | null>(null);
  const [postcodesLoading, setPostcodesLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [postcodeError, setPostcodeError] = useState<EvaluatedMessage | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const stepFocusRef = useRef<HTMLDivElement>(null);
  const resultFocusRef = useRef<HTMLHeadingElement>(null);
  const hasInteractedRef = useRef<boolean>(false);
  const answersRef = useRef<CheckerAnswers>(answers);
  answersRef.current = answers;

  const prefetchPostcodesSilently = () => {
    if (postcodesData) return;
    void fetchCompactPostcodesOnce(bootstrap.postcodesUrl)
      .then((loaded) => setPostcodesData(loaded))
      .catch(() => {});
  };

  const ensurePostcodes = async (): Promise<PostcodesDataset> => {
    if (postcodesData) return postcodesData;
    setPostcodesLoading(true);
    setLoadError(null);
    try {
      const loaded = await fetchCompactPostcodesOnce(bootstrap.postcodesUrl);
      setPostcodesData(loaded);
      return loaded;
    } catch {
      const msg = 'Could not load the Victorian postcode table. Check your connection and try again.';
      setLoadError(msg);
      throw new Error(msg);
    } finally {
      setPostcodesLoading(false);
    }
  };

  // Restore from #a= URL hash first, then ?pc= pre-fill (starts at S1), else sessionStorage
  useEffect(() => {
    const applyHashIfPresent = (): boolean => {
      const decoded = decodeAnswersFromHash(window.location.hash);
      if (decoded) {
        answersRef.current = decoded;
        setAnswers(decoded);
        setPendingHashRestore(true);
        return true;
      }
      return false;
    };

    if (!applyHashIfPresent()) {
      const queryPc = new URLSearchParams(window.location.search).get('pc')?.trim() ?? '';
      if (/^3\d{3}$/.test(queryPc)) {
        const prefilled: CheckerAnswers = { R2: queryPc, B2: queryPc };
        answersRef.current = prefilled;
        setAnswers(prefilled);
        setStepIndex(0);
        setMode('questions');
        writeSessionState(prefilled, '0');
        prefetchPostcodesSilently();
      } else {
        const { answers: savedAnswers, savedStep } = readSessionAnswers();
        if (Object.keys(savedAnswers).length > 0) {
          answersRef.current = savedAnswers;
          setAnswers(savedAnswers);
          if (savedStep === 'result') {
            setPendingHashRestore(true);
          } else if (savedStep && /^\d+$/.test(savedStep)) {
            setStepIndex(Number(savedStep));
            if (savedAnswers.S1) {
              prefetchPostcodesSilently();
            }
          }
        }
      }
    }
    setHydrated(true);

    const onHashChange = () => {
      applyHashIfPresent();
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Fetch postcodes when restoring a saved/shared result
  useEffect(() => {
    if (pendingHashRestore && !postcodesData && !postcodesLoading) {
      void ensurePostcodes().catch(() => {});
    }
  }, [pendingHashRestore]);

  // Complete hash/session result restoration once postcodes dataset is ready
  useEffect(() => {
    if (!pendingHashRestore || !postcodesData) return;
    const rawPc = answers.S1 === 'business' ? answers.B2 : answers.R2;
    const check = lookupPostcode(rawPc, postcodesData);
    setPendingHashRestore(false);
    if (check.ok) {
      setMode('result');
    } else {
      setMode('questions');
      setStepIndex(1);
    }
  }, [pendingHashRestore, postcodesData, answers]);

  const activePostcode = answers.S1 === 'business' ? answers.B2 : answers.R2;

  const currentAreaRecord = useMemo(() => {
    if (!postcodesData || !activePostcode) return null;
    const res = lookupPostcode(activePostcode, postcodesData);
    return res.ok ? res.record : null;
  }, [postcodesData, activePostcode]);

  const liveAreaCard = useMemo(() => {
    if (!postcodesData || !currentAreaRecord) return null;
    return buildAreaCardFromData(
      currentAreaRecord,
      postcodesData.checkedOn,
      enabledUrlsSet,
      catalogRuntime.links,
    );
  }, [postcodesData, currentAreaRecord, enabledUrlsSet, catalogRuntime.links]);

  const visibleFields = useMemo(
    () => getVisibleFieldsFromList(hydratedFields, answers, currentAreaRecord, solsticeSet),
    [hydratedFields, answers, currentAreaRecord, solsticeSet],
  );

  const safeStepIndex = Math.min(stepIndex, Math.max(0, visibleFields.length - 1));
  const currentField: FieldDefinition = visibleFields[safeStepIndex] ?? visibleFields[0];
  const displayTotalSteps = answers.S1
    ? Math.max(visibleFields.length, safeStepIndex + 1)
    : 6;
  const isLastStep = safeStepIndex >= visibleFields.length - 1 && Boolean(answers.S1);

  const filterOptions = (field: FieldDefinition | undefined, ans: CheckerAnswers) =>
    (field?.options ?? []).filter((o) => !o.showWhen || o.showWhen(ans, currentAreaRecord));

  const visibleOptions = filterOptions(currentField, answers);

  // Move focus synchronously before paint when navigating between steps or onto the result screen
  useLayoutEffect(() => {
    if (!hasInteractedRef.current) return;
    (mode === 'result' ? resultFocusRef : stepFocusRef).current?.focus();
  }, [mode, safeStepIndex]);

  const updateAnswer = <K extends keyof CheckerAnswers>(key: K, value: CheckerAnswers[K]) => {
    setStepError(null);
    if (key === 'R2' || key === 'B2') {
      setPostcodeError(null);
    }
    const next: CheckerAnswers = { ...answersRef.current, [key]: value };
    if (key === 'BW1' && value === 'household-size' && next.BW1Count === undefined) {
      next.BW1Count = 1;
    }
    answersRef.current = next;
    writeSessionState(next, String(safeStepIndex));
    setAnswers(next);
  };

  const toggleMultiOption = (fieldId: keyof CheckerAnswers, optionId: string) => {
    setStepError(null);
    const prev = answersRef.current;
    const currentArr = Array.isArray(prev[fieldId]) ? [...(prev[fieldId] as string[])] : [];
    const exists = currentArr.includes(optionId);
    const nextArr = exists
      ? currentArr.filter((item) => item !== optionId)
      : [...currentArr, optionId];
    const next: CheckerAnswers = { ...prev, [fieldId]: nextArr as never };
    answersRef.current = next;
    writeSessionState(next, String(safeStepIndex));
    setAnswers(next);
  };

  const handleNext = async (e: Event) => {
    e.preventDefault();
    hasInteractedRef.current = true;
    setStepError(null);
    setPostcodeError(null);

    if (!currentField) return;
    const liveAnswers = answersRef.current;

    let areaForNext = currentAreaRecord;

    if (currentField.type === 'postcode') {
      const rawVal = String(liveAnswers[currentField.id] ?? '').trim();
      let ds = postcodesData;
      if (!ds) {
        try {
          ds = await ensurePostcodes();
        } catch {
          return;
        }
      }
      const lookup = lookupPostcode(rawVal, ds);
      if (!lookup.ok) {
        setPostcodeError(
          renderMessageFromMap(
            'X1',
            catalogRuntime.messagesById,
            catalogRuntime.links,
            figuresMap,
            enabledUrlsSet,
            formatAuDate(oldestCheckedIso),
          ),
        );
        return;
      }
      areaForNext = lookup.record;
    } else {
      const stepOptions = filterOptions(currentField, liveAnswers);

      if (currentField.type === 'single' || currentField.type === 'single-with-count') {
        const val = liveAnswers[currentField.id];
        const isValidSelection =
          val !== undefined && stepOptions.some((o) => o.id === String(val));

        if (currentField.required && !isValidSelection) {
          setStepError('Choose an option to continue.');
          return;
        }

        if (currentField.id === 'BW1' && liveAnswers.BW1 === 'household-size') {
          const count = Number(liveAnswers.BW1Count ?? 1);
          if (!Number.isInteger(count) || count < 1 || count > 5) {
            setStepError('Enter a whole number of hot water units from 1 to 5.');
            return;
          }
        }

        if (currentField.id === 'S1') {
          prefetchPostcodesSilently();
        }
      } else {
        const allowedIds = new Set(stepOptions.map((o) => o.id));
        const rawSelected = Array.isArray(liveAnswers[currentField.id])
          ? (liveAnswers[currentField.id] as string[])
          : [];
        const activeSelected = rawSelected.filter((id) => allowedIds.has(id));
        const allowZero = currentField.id === 'B6' && liveAnswers.B4 === 'yes-not-opted-in';

        if (currentField.required && activeSelected.length === 0 && !allowZero) {
          setStepError('Choose at least one option to continue.');
          return;
        }
      }
    }

    const updatedVisible = getVisibleFieldsFromList(
      hydratedFields,
      liveAnswers,
      areaForNext,
      solsticeSet,
    );
    if (safeStepIndex + 1 < updatedVisible.length) {
      const nextIdx = safeStepIndex + 1;
      setStepIndex(nextIdx);
      writeSessionState(liveAnswers, String(nextIdx));
    } else {
      if (!postcodesData && currentField.type !== 'postcode') {
        try {
          await ensurePostcodes();
        } catch {
          return;
        }
      }
      setMode('result');
      writeSessionState(liveAnswers, 'result');
    }
  };

  const handleBack = () => {
    hasInteractedRef.current = true;
    setStepError(null);
    setPostcodeError(null);
    setShareUrl(null);
    setShareCopied(false);

    if (mode === 'result') {
      const lastIdx = Math.max(0, visibleFields.length - 1);
      setMode('questions');
      setStepIndex(lastIdx);
      writeSessionState(answers, String(lastIdx));
      return;
    }

    const prevIdx = Math.max(0, safeStepIndex - 1);
    setStepIndex(prevIdx);
    writeSessionState(answers, String(prevIdx));
  };

  const handleReset = () => {
    hasInteractedRef.current = true;
    clearSessionState();
    answersRef.current = {};
    setAnswers({});
    setStepIndex(0);
    setMode('questions');
    setStepError(null);
    setPostcodeError(null);
    setShareUrl(null);
    setShareCopied(false);
    if (window.location.hash) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
    }
  };

  const evaluation = useMemo(() => {
    if (mode !== 'result' || !postcodesData) return null;
    const pruned = pruneHiddenAnswersFromList(
      hydratedFields,
      answers,
      currentAreaRecord,
      solsticeSet,
    );
    const ctx: CheckerEvaluationContext = {
      postcodes: postcodesData,
      figures: figuresMap,
      sources: sourcesMap,
      enabledUrls: enabledUrlsSet,
      solsticePostcodes: solsticeSet,
    };
    return {
      pruned,
      result: evaluateWithCatalog(pruned, ctx, catalogRuntime),
    };
  }, [
    mode,
    postcodesData,
    hydratedFields,
    catalogRuntime,
    answers,
    currentAreaRecord,
    solsticeSet,
    figuresMap,
    sourcesMap,
    enabledUrlsSet,
  ]);

  const handleShareWithLandlord = async () => {
    if (!evaluation) return;
    const hash = encodeAnswersToHash(evaluation.pruned);
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    setShareUrl(url);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
      } else {
        setShareCopied(false);
      }
    } catch {
      setShareCopied(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isHydratedReady = hydrated && !pendingHashRestore ? 'true' : undefined;

  if (mode === 'result' && evaluation) {
    const { result, pruned } = evaluation;
    const topModifiers = result.modifiers.filter((m) => m.placement === 'top');
    const footerModifiers = result.modifiers.filter((m) => m.placement === 'footer');
    const isTenant = pruned.S1 === 'residential' && pruned.R3 === 'tenant';
    const bizSource = sourcesMap.get('energyvic-businesses');

    return (
      <div class="checker-result" data-checker-hydrated={isHydratedReady} data-checker-result aria-live="polite">
        <div class="checker-result__topbar">
          <h3 ref={resultFocusRef} tabIndex={-1} class="checker-result__heading">
            Your indicative eligibility result
          </h3>
          <div class="checker-actions">
            <button
              type="button"
              class="btn btn--secondary"
              data-checker-back
              onClick={handleBack}
            >
              Back
            </button>
            {isTenant && (
              <button
                type="button"
                class="btn btn--secondary"
                data-checker-share
                onClick={handleShareWithLandlord}
              >
                Share this result with your landlord
              </button>
            )}
            <button
              type="button"
              class="btn btn--secondary"
              data-checker-print
              onClick={handlePrint}
            >
              Print
            </button>
            <button
              type="button"
              class="checker-reset-btn"
              data-checker-reset
              onClick={handleReset}
            >
              Start again
            </button>
          </div>
        </div>

        {shareUrl && (
          <div class="callout callout--info checker-share-box" role="status" data-share-box>
            <p class="checker-share-box__text">
              {shareCopied ? 'Link copied. ' : 'Copy this link to share. '}
              Your answers stay in the URL (#a=…) and nothing is stored on a server.
            </p>
            <label class="field-label" for="checker-share-url-input">
              Shareable result link
            </label>
            <input
              id="checker-share-url-input"
              type="text"
              readOnly
              value={shareUrl}
              data-share-url-input
              onFocus={(ev) => ev.currentTarget.select()}
            />
          </div>
        )}

        {bootstrap.electionNotice.visible && (
          <div class="rule-status-notice" role="note" data-checker-election-notice>
            <strong class="rule-status-notice__label">Election watch:</strong>{' '}
            {bootstrap.electionNotice.message}{' '}
            <span class="rule-status-notice__source">
              (Source:{' '}
              <a
                href={bootstrap.electionNotice.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {bootstrap.electionNotice.sourcePublisher}
              </a>
              , checked {bootstrap.electionNotice.checkedOnFormatted}.)
            </span>
          </div>
        )}

        {result.areaCard && <AreaCardView card={result.areaCard} />}

        {topModifiers.length > 0 && (
          <div class="checker-modifiers checker-modifiers--top" data-checker-modifiers-top>
            {topModifiers.map((mod) => (
              <div
                key={mod.ruleId}
                class="checker-modifier-note"
                data-modifier-id={mod.ruleId}
              >
                <p>
                  {mod.text}
                  {mod.links.length > 0 ? (
                    <>
                      {' '}
                      <InlineLinks links={mod.links} />
                    </>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        )}

        {result.banners.length > 0 && (
          <div class="checker-banners" data-checker-banners>
            {result.banners.map((banner) => (
              <LineCard key={banner.ruleId} line={banner} kindTags={bootstrap.kindTags} sourcesMap={sourcesMap} />
            ))}
          </div>
        )}

        {result.allIneligibleMessage && (
          <div
            class="callout callout--caution"
            data-all-ineligible
            data-message-id={result.allIneligibleMessage.id}
          >
            <p>{result.allIneligibleMessage.text}</p>
            {result.allIneligibleMessage.links.length > 0 && (
              <p>
                <InlineLinks links={result.allIneligibleMessage.links} />
              </p>
            )}
          </div>
        )}

        {(
          [
            ['veu', 'VEU (Victoria)', result.veuLines],
            ['solar-homes', 'Solar Homes (Victoria)', result.solarHomesLines],
            ['federal', 'FEDERAL', result.federalLines],
            ['not-eligible', 'Not eligible', result.ineligibleLines],
          ] as const
        ).map(([groupId, groupHeading, groupLines]) =>
          groupLines.length > 0 ? (
            <section
              key={groupId}
              class="checker-program-section"
              aria-labelledby={`checker-sec-${groupId}`}
              data-program-group={groupId}
            >
              <h3 id={`checker-sec-${groupId}`} class="checker-program-section__heading">
                {groupHeading}
              </h3>
              <div class="checker-line-list">
                {groupLines.map((line) => (
                  <LineCard
                    key={`${line.ruleId}-${line.title}`}
                    line={line}
                    kindTags={bootstrap.kindTags}
                    sourcesMap={sourcesMap}
                  />
                ))}
              </div>
            </section>
          ) : null,
        )}

        <section
          class="checker-ctas"
          aria-labelledby="checker-next-steps-heading"
          data-checker-ctas
        >
          <h3 id="checker-next-steps-heading" class="checker-program-section__heading">
            Next steps
          </h3>
          {result.ctas.primary.length > 0 && (
            <div class="checker-ctas__primary" data-cta-tier="primary">
              {result.ctas.primary.map((cta, idx) =>
                renderResolvedLink(cta, idx === 0 ? 'btn' : 'btn btn--secondary'),
              )}
            </div>
          )}
          {result.ctas.secondary.length > 0 && (
            <ul class="checker-ctas__secondary" data-cta-tier="secondary">
              {result.ctas.secondary.map((cta) => (
                <li key={`${cta.specHref}|${cta.href}`}>{renderResolvedLink(cta)}</li>
              ))}
            </ul>
          )}
          {result.branch === 'business' && bizSource && result.ctas.primary.every((c) => !c.external) && (
            <p class="checker-ctas__external-note">
              Official Victorian business guidance:{' '}
              <a href={bizSource.url} target="_blank" rel="nofollow noopener">
                {bizSource.title} ({bizSource.publisher}) ↗
              </a>
            </p>
          )}
        </section>

        {footerModifiers.length > 0 && (
          <footer
            class="checker-modifiers checker-modifiers--footer"
            data-checker-modifiers-footer
          >
            <h3 class="checker-modifiers__heading">Before you book or sign</h3>
            <ul>
              {footerModifiers.map((mod) => (
                <li key={mod.ruleId} data-modifier-id={mod.ruleId}>
                  {mod.message ? mod.message.text : mod.text}{' '}
                  <InlineLinks links={mod.links} />
                </li>
              ))}
            </ul>
          </footer>
        )}
      </div>
    );
  }

  const fieldId = String(currentField.id);
  const helperId = `checker-helper-${fieldId}`;
  const errorId = `checker-error-${fieldId}`;
  const bizSource = sourcesMap.get('energyvic-businesses');

  const hasHelper =
    Boolean(currentField.helper) ||
    currentField.type === 'postcode' ||
    currentField.type === 'multi';
  const hasVisibleError = Boolean(stepError || postcodeError || loadError);
  const describedByIds: string[] = [];
  if (hasHelper) describedByIds.push(helperId);
  if (hasVisibleError) describedByIds.push(errorId);
  const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

  return (
    <div class="checker-step-shell" data-checker-hydrated={isHydratedReady} data-checker-step={fieldId}>
      <div ref={stepFocusRef} tabIndex={-1} class="checker-step-header">
        <p class="checker-progress" data-checker-progress aria-live="polite">
          Step {safeStepIndex + 1} of {displayTotalSteps}
        </p>
      </div>

      <form data-checker-form noValidate onSubmit={handleNext}>
        {currentField.type === 'postcode' && (
          <div key={fieldId} class="field-group">
            <label class="field-label checker-legend" for={`checker-input-${fieldId}`}>
              {currentField.label}
            </label>
            <p id={helperId} class="field-hint">
              Enter a 4-digit Victorian postcode (starting with 3). Stays in your browser.
            </p>
            <input
              id={`checker-input-${fieldId}`}
              name={fieldId}
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={4}
              class="checker-postcode-input"
              value={String(answers[currentField.id] ?? '')}
              aria-invalid={hasVisibleError ? 'true' : undefined}
              aria-describedby={describedBy}
              data-postcode-input
              onInput={(ev) => {
                const cleaned = ev.currentTarget.value.trim();
                updateAnswer(currentField.id, cleaned as never);
              }}
            />
            {postcodeError && (
              <div
                id={errorId}
                class="field-error checker-postcode-error"
                role="alert"
                data-postcode-error
                data-message-id={postcodeError.id}
              >
                <p>{postcodeError.text}</p>
                {postcodeError.links.length > 0 && (
                  <p>
                    <InlineLinks links={postcodeError.links} />
                  </p>
                )}
              </div>
            )}
            {loadError && !postcodeError && (
              <p id={errorId} class="field-error" role="alert">
                {loadError}
              </p>
            )}
          </div>
        )}

        {currentField.type !== 'postcode' && (
          <fieldset key={fieldId} class="field-group checker-fieldset" aria-describedby={describedBy}>
            <legend class="field-label checker-legend">{currentField.label}</legend>
            {currentField.type === 'multi' ? (
              <p id={helperId} class="field-hint">
                {currentField.id === 'B6' && answers.B4 === 'yes-not-opted-in'
                  ? 'Sites on the ESC Scheduled Activity Premises register that have not opted in can only check the federal battery option below (or continue to view the VEU notice).'
                  : 'Choose one or more options.'}
              </p>
            ) : currentField.helper ? (
              <p id={helperId} class="field-hint">
                {currentField.helper}
                {currentField.id === 'B4' && bizSource ? (
                  <>
                    {' '}
                    <a href={bizSource.url} target="_blank" rel="nofollow noopener">
                      Check Energy Victoria business eligibility &amp; ESC register details ↗
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
            <div class="checker-options">
              {visibleOptions.map((opt) => {
                const isMulti = currentField.type === 'multi';
                const checked = isMulti
                  ? Array.isArray(answers[currentField.id]) &&
                    (answers[currentField.id] as string[]).includes(opt.id)
                  : String(answers[currentField.id] ?? '') === opt.id;
                return (
                  <label
                    key={opt.id}
                    class={`option-row ${checked ? 'option-row--selected' : ''}`}
                  >
                    <input
                      type={isMulti ? 'checkbox' : 'radio'}
                      name={fieldId}
                      value={opt.id}
                      checked={checked}
                      data-option-id={opt.id}
                      onChange={() =>
                        isMulti
                          ? toggleMultiOption(currentField.id, opt.id)
                          : updateAnswer(currentField.id, opt.id as never)
                      }
                      onKeyDown={
                        isMulti
                          ? undefined
                          : (ev) => {
                              if (ev.key === 'Enter') {
                                ev.preventDefault();
                                ev.currentTarget.form?.requestSubmit();
                              }
                            }
                      }
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>

            {currentField.id === 'BW1' && answers.BW1 === 'household-size' && (
              <div class="checker-sub-field">
                <label class="field-label" for="checker-bw1-count">
                  Number of household-size hot water units (1 to 5)
                </label>
                <input
                  id="checker-bw1-count"
                  name="BW1Count"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={5}
                  step={1}
                  class="checker-postcode-input"
                  value={answers.BW1Count ?? 1}
                  onInput={(ev) => {
                    const parsed = Number(ev.currentTarget.value);
                    updateAnswer('BW1Count', (Number.isNaN(parsed) ? 0 : parsed) as never);
                  }}
                />
              </div>
            )}

            {currentField.id === 'BP1' &&
              (answers.BP1 === '50-to-100-kw' || answers.BP1 === '100-to-200-kw') && (
                <div class="checker-sub-field">
                  <label class="field-label" for="checker-bp1-exact">
                    Optional: pick a published example size in this band
                  </label>
                  <select
                    id="checker-bp1-exact"
                    name="BP1ExactKw"
                    value={answers.BP1ExactKw ? String(answers.BP1ExactKw) : ''}
                    onChange={(ev) => {
                      const v = ev.currentTarget.value;
                      updateAnswer(
                        'BP1ExactKw',
                        (v ? (Number(v) as 50 | 75 | 100 | 150 | 200) : undefined) as never,
                      );
                    }}
                  >
                    <option value="">Show all published sizes in this band</option>
                    {(answers.BP1 === '50-to-100-kw' ? [50, 75, 100] : [100, 150, 200]).map(
                      (kw) => (
                        <option key={kw} value={String(kw)}>
                          {kw} kW
                        </option>
                      ),
                    )}
                  </select>
                </div>
              )}

            {stepError && (
              <p id={errorId} class="field-error" role="alert">
                {stepError}
              </p>
            )}
          </fieldset>
        )}

        <div class="checker-step-nav">
          <button
            type="submit"
            class="btn"
            disabled={postcodesLoading}
            data-checker-next
          >
            {postcodesLoading ? 'Loading…' : isLastStep ? 'See results' : 'Next'}
          </button>

          {safeStepIndex > 0 && (
            <button
              type="button"
              class="btn btn--secondary"
              data-checker-back
              onClick={handleBack}
            >
              Back
            </button>
          )}

          {(safeStepIndex > 0 || Object.keys(answers).length > 0) && (
            <button
              type="button"
              class="checker-reset-btn"
              data-checker-reset
              onClick={handleReset}
            >
              Start again
            </button>
          )}
        </div>
      </form>

      {liveAreaCard && safeStepIndex >= 1 && <AreaCardView card={liveAreaCard} />}
    </div>
  );
}
