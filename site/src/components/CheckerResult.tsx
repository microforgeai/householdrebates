import type { RefObject } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { AreaCardView, InlineLinks, renderResolvedLink } from './AreaCardView';
import type { CheckerBootstrapPayload } from './CheckerApp';
import { formatAuDate } from '../lib/dates';
import type { FigureData, FigureKind } from '../lib/figures';
import {
  evaluateWithCatalog,
  type CheckerCatalogRuntime,
} from '../lib/checker/evaluate-runtime';
import {
  pruneHiddenAnswersFromList,
  type FieldDefinition,
} from '../lib/checker/fields-hooks';
import type { MessageDefinition } from '../lib/checker/messages-runtime';
import { hydrateRules, RULE_HOOKS } from '../lib/checker/rules-hooks';
import { encodeAnswersToHash } from '../lib/checker/share';
import type {
  CheckerAnswers,
  CheckerEvaluationContext,
  EvaluatedFigure,
  EvaluatedLine,
  MessageId,
  PostcodeAreaRecord,
  PostcodesDataset,
  RuleStatus,
  SourceMeta,
} from '../lib/checker/types';

const STATUS_LABELS: Readonly<Record<RuleStatus, string>> = {
  likely: 'Likely',
  possibly: 'Possibly',
  'not-eligible': 'Not eligible',
  info: 'Info',
};

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

export interface CheckerResultProps {
  bootstrap: CheckerBootstrapPayload;
  hydratedFields: FieldDefinition[];
  answers: CheckerAnswers;
  currentAreaRecord: PostcodeAreaRecord | null;
  postcodesData: PostcodesDataset;
  enabledUrlsSet: Set<string>;
  solsticeSet: Set<string>;
  sourcesMap: Map<string, SourceMeta>;
  isHydratedReady: 'true' | undefined;
  resultFocusRef: RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onReset: () => void;
}

export function CheckerResult({
  bootstrap,
  hydratedFields,
  answers,
  currentAreaRecord,
  postcodesData,
  enabledUrlsSet,
  solsticeSet,
  sourcesMap,
  isHydratedReady,
  resultFocusRef,
  onBack,
  onReset,
}: CheckerResultProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const figuresMap = useMemo(
    () => new Map<string, FigureData>(bootstrap.figures.map((f) => [f.id, f])),
    [bootstrap.figures],
  );

  const catalogRuntime = useMemo<CheckerCatalogRuntime>(() => {
    const rules = hydrateRules(bootstrap.catalog.rules, RULE_HOOKS);
    const rulesById = new Map(rules.map((r) => [r.id, r]));
    const messagesById = new Map<MessageId, MessageDefinition>(
      bootstrap.catalog.messages.map((m) => [m.id, m]),
    );
    return { rules, rulesById, messagesById, links: bootstrap.catalog.links };
  }, [bootstrap.catalog.rules, bootstrap.catalog.messages, bootstrap.catalog.links]);

  const evaluation = useMemo(() => {
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
            onClick={onBack}
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
            onClick={onReset}
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
