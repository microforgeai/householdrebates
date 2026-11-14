import { isSolsticePostcode, SOLSTICE_POSTCODE_SET } from './area-runtime';
import type {
  CheckerAnswers,
  PostcodeAreaRecord,
} from './types';

export interface FieldOptionMeta {
  id: string;
  label: string;
}

export interface FieldOption extends FieldOptionMeta {
  showWhen?: (answers: CheckerAnswers, area: PostcodeAreaRecord | null) => boolean;
}

export interface FieldMeta {
  id: keyof CheckerAnswers;
  branch: 'shared' | 'residential' | 'business';
  label: string;
  helper?: string;
  type: 'single' | 'multi' | 'postcode' | 'single-with-count';
  required: boolean;
  options?: FieldOptionMeta[];
}

export interface FieldHooks {
  showWhen: (
    answers: CheckerAnswers,
    area: PostcodeAreaRecord | null,
    solsticePostcodes?: ReadonlySet<string>,
  ) => boolean;
  optionShowWhen?: (optId: string) => FieldOption['showWhen'];
}

export interface FieldDefinition extends Omit<FieldMeta, 'options'> {
  options?: FieldOption[];
  showWhen: FieldHooks['showWhen'];
}

export function shouldShowSh1(answers: CheckerAnswers): boolean {
  if (answers.S1 !== 'residential') return false;
  if (answers.R2a === 'yes') return false;

  const hasHw = Boolean(answers.R6?.includes('hot-water'));
  const hasPv = Boolean(answers.R6?.includes('solar-panels'));
  if (!hasHw && !hasPv) return false;

  if (answers.R3 === 'own-and-live') {
    return true;
  }
  if (answers.R3 === 'building-it' || answers.R3 === 'landlord') {
    return hasPv;
  }
  return false;
}

const isRes = (a: CheckerAnswers) => a.S1 === 'residential';
const isBiz = (a: CheckerAnswers) => a.S1 === 'business';
const notBuild = (a: CheckerAnswers) => a.R3 !== 'building-it';
const bizVeu = (a: CheckerAnswers) => a.B4 !== 'yes-not-opted-in';
const resHas =
  (item: NonNullable<CheckerAnswers['R6']>[number]) =>
  (a: CheckerAnswers) =>
    a.S1 === 'residential' && Boolean(a.R6?.includes(item));
const bizHas =
  (item: NonNullable<CheckerAnswers['B6']>[number]) =>
  (a: CheckerAnswers) =>
    a.S1 === 'business' && a.B4 !== 'yes-not-opted-in' && Boolean(a.B6?.includes(item));

export const FIELD_HOOKS: Readonly<Record<string, FieldHooks>> = {
  S1: { showWhen: () => true },
  R2: { showWhen: isRes },
  R2a: {
    showWhen: (a, _area, solsticeSet = SOLSTICE_POSTCODE_SET) =>
      isRes(a) && isSolsticePostcode(a.R2, solsticeSet),
  },
  R3: { showWhen: isRes },
  R4: { showWhen: (a) => isRes(a) && a.R3 !== undefined && notBuild(a) },
  R5: { showWhen: (a) => isRes(a) && a.R3 !== undefined && notBuild(a) },
  R6: {
    showWhen: isRes,
    optionShowWhen: (id) =>
      id === 'solar-panels' || id === 'home-battery' ? undefined : notBuild,
  },
  H1: { showWhen: resHas('heating-cooling') },
  H2: { showWhen: resHas('heating-cooling') },
  H3: {
    showWhen: (a) => resHas('heating-cooling')(a) && a.H2 === 'several-splits-or-multi-split',
  },
  W1: { showWhen: resHas('hot-water') },
  W2: {
    showWhen: (a) => resHas('hot-water')(a) && (a.W1 === 'gas-mains' || a.W1 === 'lpg'),
  },
  W3: {
    showWhen: (a) => resHas('hot-water')(a) && a.W1 !== undefined && a.W1 !== 'heat-pump-already',
  },
  W4: {
    showWhen: (a) => resHas('hot-water')(a) && a.R3 === 'own-and-live' && a.R2a !== 'yes',
  },
  C1: { showWhen: resHas('cooktop') },
  I1: { showWhen: (a) => resHas('ceiling-insulation')(a) && a.R4 !== 'apartment' },
  I2: {
    showWhen: (a) =>
      resHas('ceiling-insulation')(a) &&
      a.R4 !== 'apartment' &&
      (a.I1 === 'nothing' || a.I1 === 'thin-or-patchy' || a.I1 === 'not-sure'),
  },
  G1: { showWhen: resHas('windows') },
  P1: { showWhen: resHas('solar-panels') },
  BT1: { showWhen: resHas('home-battery') },
  A1: { showWhen: resHas('appliances') },
  SH1: { showWhen: shouldShowSh1 },
  SH2: { showWhen: shouldShowSh1 },
  SH3: {
    showWhen: (a) =>
      shouldShowSh1(a) ||
      (a.R2a === 'yes' && (resHas('hot-water')(a) || resHas('solar-panels')(a))),
  },
  B2: { showWhen: isBiz },
  B3: { showWhen: isBiz },
  B4: { showWhen: (a) => isBiz(a) && a.B3 !== undefined && a.B3 !== 'council' },
  B5: { showWhen: (a) => isBiz(a) && bizVeu(a) },
  B6: {
    showWhen: isBiz,
    optionShowWhen: (id) => (id === 'battery' ? undefined : bizVeu),
  },
  BH1: { showWhen: bizHas('heating-cooling') },
  BH2: { showWhen: bizHas('heating-cooling') },
  BW1: { showWhen: bizHas('hot-water') },
  BW2: { showWhen: bizHas('hot-water') },
  BL1: {
    showWhen: bizHas('lighting'),
    optionShowWhen: (id) => (id === 'street-lighting' ? (a) => a.B3 === 'council' : undefined),
  },
  BR1: { showWhen: bizHas('refrigeration') },
  BR2: {
    showWhen: (a) => bizHas('refrigeration')(a) && Boolean(a.BR1?.includes('walk-in-cold-room')),
  },
  BR3: {
    showWhen: (a) => bizHas('refrigeration')(a) && Boolean(a.BR1?.includes('walk-in-cold-room')),
  },
  BM1: { showWhen: bizHas('motors') },
  BK1: { showWhen: bizHas('kitchen-spray-valves') },
  BP1: { showWhen: bizHas('solar-panels') },
  BG1: { showWhen: bizHas('windows') },
  BB1: { showWhen: (a) => isBiz(a) && Boolean(a.B6?.includes('battery')) },
};

export function hydrateFields(
  metas: readonly FieldMeta[],
  hooksMap: Readonly<Record<string, FieldHooks>> = FIELD_HOOKS,
): FieldDefinition[] {
  return metas.map((m) => {
    const h = hooksMap[String(m.id)];
    if (!h) {
      throw new Error(`Missing field hooks for field "${String(m.id)}"`);
    }
    const options: FieldOption[] | undefined = m.options?.map((opt) => {
      const optFn = h.optionShowWhen?.(opt.id);
      return optFn ? { ...opt, showWhen: optFn } : { ...opt };
    });
    return {
      ...m,
      ...(options ? { options } : {}),
      showWhen: h.showWhen,
    };
  });
}

export function getVisibleFieldsFromList(
  fields: readonly FieldDefinition[],
  answers: CheckerAnswers,
  area: PostcodeAreaRecord | null,
  solsticePostcodes: ReadonlySet<string> = SOLSTICE_POSTCODE_SET,
): FieldDefinition[] {
  return fields.filter((f) => f.showWhen(answers, area, solsticePostcodes));
}

export function pruneHiddenAnswersFromList(
  fields: readonly FieldDefinition[],
  answers: CheckerAnswers,
  area: PostcodeAreaRecord | null,
  solsticePostcodes: ReadonlySet<string> = SOLSTICE_POSTCODE_SET,
): CheckerAnswers {
  const visible = getVisibleFieldsFromList(fields, answers, area, solsticePostcodes);
  const visibleIds = new Set<keyof CheckerAnswers>(visible.map((f) => f.id));
  const out: CheckerAnswers = {};

  for (const field of visible) {
    const rawVal = answers[field.id];
    if (rawVal === undefined) continue;

    if (field.options) {
      const allowedOptionIds = new Set(
        field.options
          .filter((o) => !o.showWhen || o.showWhen(answers, area))
          .map((o) => o.id),
      );
      if (Array.isArray(rawVal)) {
        const filtered = (rawVal as string[]).filter((v) => allowedOptionIds.has(v));
        if (filtered.length > 0) {
          out[field.id] = filtered as never;
        }
      } else if (allowedOptionIds.has(String(rawVal))) {
        out[field.id] = rawVal as never;
      }
    } else {
      out[field.id] = rawVal as never;
    }
  }

  if (visibleIds.has('BW1') && out.BW1 === 'household-size' && answers.BW1Count !== undefined) {
    out.BW1Count = answers.BW1Count;
  }
  if (
    visibleIds.has('BP1') &&
    (out.BP1 === '50-to-100-kw' || out.BP1 === '100-to-200-kw') &&
    answers.BP1ExactKw !== undefined
  ) {
    out.BP1ExactKw = answers.BP1ExactKw;
  }

  return out;
}
