import type { ComponentChildren } from 'preact';
import { formatAuDate } from '../lib/dates';
import type { AreaCard, ResolvedLink } from '../lib/checker/types';

export function renderResolvedLink(link: ResolvedLink, className?: string) {
  if (link.external) {
    return (
      <a
        href={link.href}
        class={className}
        target="_blank"
        rel={link.rel ?? 'noopener noreferrer'}
      >
        {link.label} ↗
      </a>
    );
  }
  return (
    <a href={link.href} class={className}>
      {link.label}
    </a>
  );
}

export function InlineLinks({ links }: { links: ResolvedLink[] }) {
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

export interface AreaCardViewProps {
  card: AreaCard;
  councilSuffix?: string;
  sourceNote?: string;
  hideDefaultAreaLink?: boolean;
  children?: ComponentChildren;
}

export function AreaCardView({
  card,
  councilSuffix,
  sourceNote,
  hideDefaultAreaLink,
  children,
}: AreaCardViewProps) {
  return (
    <section
      class="checker-area-card"
      aria-label={`Your area for postcode ${card.postcode}`}
      data-area-card
      data-area-postcode={card.postcode}
    >
      <div class="checker-area-card__header">
        <h3 class="checker-area-card__title">Your area — Postcode {card.postcode}</h3>
        <span class="checker-area-card__badge">{card.veuArea}</span>
      </div>
      <p class="checker-area-card__summary" data-area-summary>
        {card.summaryText}
      </p>
      <dl class="checker-area-card__grid">
        {(
          [
            ['Localities', card.localitiesDisplay],
            ['Council (LGA)', `${card.lgaDisplay}${councilSuffix ?? ''}`],
            ['Mains gas', card.reticulatedGas ? 'Yes (reticulated gas)' : 'No reticulated mains gas'],
            ['Climate & heat pump zone', `${card.climaticRegion} · Heat pump zone ${card.heatPumpZone}`],
          ] as const
        ).map(([dt, dd]) => (
          <div key={dt}>
            <dt>{dt}</dt>
            <dd>{dd}</dd>
          </div>
        ))}
      </dl>
      {children}
      <div class="checker-area-card__footer">
        <span class="checker-area-card__meta" data-area-meta>
          {sourceNote ?? `From VEU Specifications v25.0 Table A · Checked ${formatAuDate(card.specCheckedOn)}`}
        </span>
        {!hideDefaultAreaLink && (
          <span data-area-link>{renderResolvedLink(card.areaLink, 'checker-area-card__link')}</span>
        )}
      </div>
    </section>
  );
}
