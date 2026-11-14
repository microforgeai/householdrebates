import { formatAud, type FigureData } from '../figures';
import { resolveInternalUrl, resolveLinkKey } from './links';
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

export const MESSAGES: readonly MessageDefinition[] = [
  {
    id: 'X1',
    template:
      "That postcode isn't in the Victorian Energy Upgrades postcode list, so we can't check it. VEU only covers Victoria. Check the number, or try a nearby postcode.",
    specHrefs: ['/victoria/postcode/'],
    linkKeys: ['postcode-lookup'],
  },
  {
    id: 'N-AGE',
    template:
      "Most VEU replacement discounts need a building more than 2 years old. Newer homes, including new estate homes, usually can't get the heating, cooling or hot water replacement discounts yet.",
    specHrefs: ['/victoria/new-homes-all-electric-2027/'],
    linkKeys: ['new-homes-2027'],
  },
  {
    id: 'N-HW-EFF',
    template:
      "You already have an efficient system (working solar or a heat pump), so there's no VEU discount to replace it.",
    specHrefs: ['/victoria/gas-hot-water-to-heat-pump/'],
    linkKeys: ['guide-gas-hw-to-hp'],
  },
  {
    id: 'N-COOK',
    template: 'The VEU cooktop discount is for replacing a gas or LPG cooktop.',
    specHrefs: ['/victoria/gas-cooktop-to-induction/'],
    linkKeys: ['guide-cooktop-induction'],
  },
  {
    id: 'N-INS-SAFE',
    template:
      "Homes with halogen downlights or unsafe wiring can't get the insulation discount until a licensed electrician fixes them. After that, you can apply.",
    specHrefs: ['/victoria/ceiling-insulation-rebate/'],
    linkKeys: ['guide-ceiling-insulation'],
  },
  {
    id: 'N-INS-R2',
    template:
      'The discount is for ceilings with no insulation or insulation below R2.0 (about 90 mm).',
    specHrefs: ['/victoria/ceiling-insulation-rebate/'],
    linkKeys: ['guide-ceiling-insulation'],
  },
  {
    id: 'N-GLAZE',
    template: 'Window discounts are for single-glazed windows.',
    specHrefs: ['/victoria/draught-proofing-rebate/'],
    linkKeys: ['guide-draught-proofing'],
  },
  {
    id: 'N-SEAL-GAS',
    template:
      "Homes with open-flued or flueless gas heaters, or an indoor open-flued water heater, can't get the weather sealing discount (carbon monoxide risk). The provider checks your appliances first.",
    specHrefs: ['/victoria/draught-proofing-rebate/'],
    linkKeys: ['guide-draught-proofing'],
  },
  {
    id: 'N-SH-INC',
    template:
      "Solar Homes rebates need a combined owners' taxable income under {incomeCap} a year (since 1 Jul 2026). VEU discounts have no income test, so they still apply.",
    figurePlaceholders: { incomeCap: 'vic-solar-homes-income-cap' },
    specHrefs: ['/victoria/veu-vs-solar-homes/'],
    linkKeys: ['veu-vs-solar-homes'],
  },
  {
    id: 'N-SH-PROP',
    template: 'Solar Homes rebates need a property worth under {propertyCap}.',
    figurePlaceholders: { propertyCap: 'vic-solar-homes-property-cap' },
    specHrefs: ['/victoria/veu-vs-solar-homes/'],
    linkKeys: ['veu-vs-solar-homes'],
  },
  {
    id: 'N-SH-DUP',
    template:
      "This address has already had this Solar Homes rebate (or a solar battery rebate), so it can't get another.",
    specHrefs: ['/victoria/can-you-claim-veu-twice/'],
    linkKeys: ['can-claim-twice'],
  },
  {
    id: 'N-SH-AGE',
    template: 'The Solar Homes hot water rebate needs the old system to be at least 3 years old.',
    specHrefs: ['/victoria/heat-pump-rebate/'],
    linkKeys: ['guide-heat-pump'],
  },
  {
    id: 'N-SH-TENURE',
    template:
      'The Solar Homes hot water rebate is for owner-occupiers. Tenants and landlords can still use VEU discounts.',
    specHrefs: ['/victoria/renters/', '/victoria/landlords-rental-standards-2027/'],
    linkKeys: ['renters', 'landlords-2027'],
  },
  {
    id: 'N-PV-10Y',
    template:
      "The Solar Homes PV rebate isn't available where solar was installed in the last 10 years.",
    specHrefs: ['/victoria/veu-vs-solar-homes/'],
    linkKeys: ['veu-vs-solar-homes'],
  },
  {
    id: 'N-BAT-SOLAR',
    template:
      'The federal battery discount is for batteries connected to new or existing solar panels.',
    specHrefs: ['/victoria/veu-vs-solar-homes/'],
    linkKeys: ['veu-vs-solar-homes'],
  },
  {
    id: 'N-SCHED',
    template:
      "Sites on the ESC Register of Scheduled Activity Premises can't use VEU unless they opt in. Check the register or ask the ESC.",
    specHrefs: ['/victoria/business-energy-upgrades/#scheduled-premises'],
    linkKeys: ['business-hub'],
    anchorLabels: {
      '/victoria/business-energy-upgrades/#scheduled-premises':
        'Scheduled activity premises rules for businesses',
    },
  },
  {
    id: 'N-LIGHT',
    template: 'Indoor business lighting discounts now apply only when replacing fluorescent lights.',
    specHrefs: ['/victoria/business-energy-upgrades/#indoor-lighting-fluorescent-only'],
    linkKeys: ['business-hub'],
    anchorLabels: {
      '/victoria/business-energy-upgrades/#indoor-lighting-fluorescent-only':
        'Indoor fluorescent-only business lighting rule',
    },
  },
  {
    id: 'N-COLD',
    template:
      'Cold room discounts need a walk-in room of at least 4 m² that stores goods below 7 °C or runs as a freezer.',
    specHrefs: ['/victoria/business-energy-upgrades/#cold-room-rules'],
    linkKeys: ['business-hub'],
    anchorLabels: {
      '/victoria/business-energy-upgrades/#cold-room-rules': 'Walk-in cold room eligibility rules',
    },
  },
  {
    id: 'N-PRV',
    template: 'You need an existing pre-rinse spray valve, or a fitting for one.',
    specHrefs: ['/victoria/business-energy-upgrades/#pre-rinse-spray-valves'],
    linkKeys: ['business-hub'],
    anchorLabels: {
      '/victoria/business-energy-upgrades/#pre-rinse-spray-valves':
        'Commercial pre-rinse spray valve rules',
    },
  },
  {
    id: 'N-PV-30',
    template:
      'VEU business solar discounts are for systems of 30–200 kW. Smaller systems may still get federal STCs through your installer.',
    specHrefs: ['/victoria/business-energy-upgrades/#business-solar-30-200-kw'],
    linkKeys: ['business-hub'],
    anchorLabels: {
      '/victoria/business-energy-upgrades/#business-solar-30-200-kw':
        'Commercial solar PV (30 to 200 kW) rules',
    },
  },
  {
    id: 'N-BIZ-RES',
    template:
      'Ceiling insulation, induction cooktops, weather sealing and in-home displays are household-only VEU products.',
    specHrefs: ['/victoria/business-energy-upgrades/#household-only-products'],
    linkKeys: ['business-hub'],
    anchorLabels: {
      '/victoria/business-energy-upgrades/#household-only-products':
        'Household-only VEU products vs business upgrades',
    },
  },
  {
    id: 'N-NONE',
    template:
      "Nothing matched this time. Here's why, line by line. Rules change often; we last checked them on {date}.",
    specHrefs: ['/victoria/'],
    linkKeys: ['victoria-hub'],
  },
];

export const MESSAGES_BY_ID: ReadonlyMap<MessageId, MessageDefinition> = new Map(
  MESSAGES.map((m) => [m.id, m]),
);

export function renderMessage(
  id: MessageId,
  figures: Map<string, FigureData>,
  enabledUrls: Set<string>,
  checkedDateFormatted = '',
): EvaluatedMessage {
  const def = MESSAGES_BY_ID.get(id);
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
    const baseResolved = resolveLinkKey(key, enabledUrls);
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
