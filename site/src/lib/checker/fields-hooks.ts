import { isSolsticePostcode } from './area-runtime';
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

export type FieldHookEntry = FieldHooks['showWhen'] | FieldHooks;

export const FIELD_HOOKS: Readonly<Record<string, FieldHookEntry>> = {
  S1: () => true,
  R2: isRes,
  R2a: (a, _area, solsticeSet) =>
    isRes(a) && isSolsticePostcode(a.R2, solsticeSet),
  R3: isRes,
  R4: (a) => isRes(a) && a.R3 !== undefined && notBuild(a),
  R5: (a) => isRes(a) && a.R3 !== undefined && notBuild(a),
  R6: {
    showWhen: isRes,
    optionShowWhen: (id) =>
      id === 'solar-panels' || id === 'home-battery' ? undefined : notBuild,
  },
  H1: resHas('heating-cooling'),
  H2: resHas('heating-cooling'),
  H3: (a) => resHas('heating-cooling')(a) && a.H2 === 'several-splits-or-multi-split',
  W1: resHas('hot-water'),
  W2: (a) => resHas('hot-water')(a) && (a.W1 === 'gas-mains' || a.W1 === 'lpg'),
  W3: (a) => resHas('hot-water')(a) && a.W1 !== undefined && a.W1 !== 'heat-pump-already',
  W4: (a) => resHas('hot-water')(a) && a.R3 === 'own-and-live' && a.R2a !== 'yes',
  C1: resHas('cooktop'),
  I1: (a) => resHas('ceiling-insulation')(a) && a.R4 !== 'apartment',
  I2: (a) =>
    resHas('ceiling-insulation')(a) &&
    a.R4 !== 'apartment' &&
    (a.I1 === 'nothing' || a.I1 === 'thin-or-patchy' || a.I1 === 'not-sure'),
  G1: resHas('windows'),
  P1: resHas('solar-panels'),
  BT1: resHas('home-battery'),
  A1: resHas('appliances'),
  SH1: shouldShowSh1,
  SH2: shouldShowSh1,
  SH3: (a) =>
    shouldShowSh1(a) ||
    (a.R2a === 'yes' && (resHas('hot-water')(a) || resHas('solar-panels')(a))),
  B2: isBiz,
  B3: isBiz,
  B4: (a) => isBiz(a) && a.B3 !== undefined && a.B3 !== 'council',
  B5: (a) => isBiz(a) && bizVeu(a),
  B6: {
    showWhen: isBiz,
    optionShowWhen: (id) => (id === 'battery' ? undefined : bizVeu),
  },
  BH1: bizHas('heating-cooling'),
  BH2: bizHas('heating-cooling'),
  BW1: bizHas('hot-water'),
  BW2: bizHas('hot-water'),
  BL1: {
    showWhen: bizHas('lighting'),
    optionShowWhen: (id) => (id === 'street-lighting' ? (a) => a.B3 === 'council' : undefined),
  },
  BR1: bizHas('refrigeration'),
  BR2: (a) => bizHas('refrigeration')(a) && Boolean(a.BR1?.includes('walk-in-cold-room')),
  BR3: (a) => bizHas('refrigeration')(a) && Boolean(a.BR1?.includes('walk-in-cold-room')),
  BM1: bizHas('motors'),
  BK1: bizHas('kitchen-spray-valves'),
  BP1: bizHas('solar-panels'),
  BG1: bizHas('windows'),
  BB1: (a) => isBiz(a) && Boolean(a.B6?.includes('battery')),
};

export function hydrateFields(
  metas: readonly FieldMeta[],
  hooksMap: Readonly<Record<string, FieldHookEntry>> = FIELD_HOOKS,
): FieldDefinition[] {
  return metas.map((m) => {
    const raw = hooksMap[String(m.id)];
    if (!raw) {
      throw new Error(`Missing field hooks for field "${String(m.id)}"`);
    }
    const h: FieldHooks = typeof raw === 'function' ? { showWhen: raw } : raw;
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
  solsticePostcodes?: ReadonlySet<string>,
): FieldDefinition[] {
  return fields.filter((f) => f.showWhen(answers, area, solsticePostcodes));
}

export function pruneHiddenAnswersFromList(
  fields: readonly FieldDefinition[],
  answers: CheckerAnswers,
  area: PostcodeAreaRecord | null,
  solsticePostcodes?: ReadonlySet<string>,
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
