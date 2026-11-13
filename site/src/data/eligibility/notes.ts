export type NoteId =
  | 'copay-hc'
  | 'rcac-ducted-size'
  | 'rcac-not-sure'
  | 'rcac-no-decomm-only'
  | 'hw-min-contribution'
  | 'hw-solar-homes'
  | 'hw-gas-2027'
  | 'hw-broken-solar'
  | 'lpg-provider-confirms'
  | 'lpg-not-covered'
  | 'insulation-safety-fix-first'
  | 'insulation-r2'
  | 'insulation-postcode'
  | 'postcode-unknown'
  | 'insulation-safety-checks'
  | 'insulation-few-providers'
  | 'renter-permission'
  | 'rental-standards-2027'
  | 'rental-insulation-2027'
  | 'induction-must-replace-gas'
  | 'property-age'
  | 'induction-claimed-before'
  | 'induction-product-rules'
  | 'induction-process'
  | 'retro'
  | 'sealing-co-risk'
  | 'sealing-examples'
  | 'renter-sealing'
  | 'rental-sealing-2027';

export interface NoteDefinition {
  text: string;
  figureIds?: readonly string[];
  sourceId?: string;
}

export const ELIGIBILITY_NOTES: Record<NoteId, NoteDefinition> = {
  'copay-hc': {
    text: "You still pay at least this amount after the discount (VEU Specifications v25.0, from 30 September 2026). An offer of a free ducted system can't be a genuine VEU offer.",
    sourceId: 'vic-veu-spec-v25',
  },
  'rcac-ducted-size': {
    text: 'Ducted reverse-cycle discounts depend on the capacity installed (10 kW, 16 kW, or 22.4 kW). Size decides which row applies.',
    sourceId: 'energyvic-heating-cooling',
  },
  'rcac-not-sure': {
    text: 'Because you have not chosen between ducted and split systems yet, we have listed the household scenarios below. The accredited provider confirms which row applies.',
    sourceId: 'energyvic-heating-cooling',
  },
  'rcac-no-decomm-only': {
    text: 'An accredited provider can confirm whether the smaller no-decommissioning activity applies to your property.',
    sourceId: 'energyvic-heating-cooling',
  },
  'hw-min-contribution': {
    text: 'All VEU hot water upgrades require at least this minimum customer co-payment, including GST.',
    figureIds: ['vic-veu-hw-min-contribution'],
    sourceId: 'vic-veu-spec-v25',
  },
  'hw-solar-homes': {
    text: 'Eligible owner-occupier households may also be able to combine the VEU discount with the Solar Victoria Solar Homes hot water rebate (confirmed during quoting).',
    sourceId: 'solarvic-hot-water-rebate',
  },
  'hw-gas-2027': {
    text: 'From 1 March 2027, a mains gas water heater needing replacement in an existing Victorian home must generally be replaced with an efficient electric system unless an exemption applies.',
    sourceId: 'energyvic-electrification',
  },
  'hw-broken-solar': {
    text: 'For a broken solar hot water unit, the accredited provider confirms whether the electric-boosted or gas-boosted replacement category applies.',
    sourceId: 'energyvic-hot-water',
  },
  'lpg-provider-confirms': {
    text: 'VEU covers replacing gas or LPG water heaters, but Energy Victoria only publishes a figure for mains gas. An accredited provider confirms whether a discount applies to your LPG system, and how much.',
    sourceId: 'energyvic-hot-water',
  },
  'lpg-not-covered': {
    text: "Victoria's 1 March 2027 mains gas hot water replacement rule does not apply to bottled LPG systems.",
    sourceId: 'energyvic-electrification',
  },
  'insulation-safety-fix-first': {
    text: "Energy Victoria says halogen downlights or unsafe wiring make a home ineligible until they're fixed.",
    sourceId: 'energyvic-insulation',
  },
  'insulation-r2': {
    text: 'Ceiling insulation discounts apply only where the ceiling has no insulation or existing insulation is below R2.0 (about 90 mm).',
    sourceId: 'energyvic-insulation',
  },
  'insulation-postcode': {
    text: 'In the VEU postcode table, your postcode determines the area and climatic region.',
    sourceId: 'vic-veu-spec-v25',
  },
  'postcode-unknown': {
    text: 'This postcode is not in the VEU Specifications v25.0 Victorian postcode list. An accredited provider confirms whether your address is eligible and which climatic zone applies.',
    sourceId: 'vic-veu-spec-v25',
  },
  'insulation-safety-checks': {
    text: 'Before work starts, a licensed electrician and the installer must each complete a safety assessment, and the installer must be Energy Efficiency Council certified.',
    sourceId: 'energyvic-insulation',
  },
  'insulation-few-providers': {
    text: 'Energy Victoria listed only a few insulation providers when we checked.',
    sourceId: 'energyvic-insulation',
  },
  'renter-permission': {
    text: "Renters can get the discount, though upgrades to fixed equipment need the landlord's approval.",
    sourceId: 'energyvic-renters-landlords',
  },
  'rental-standards-2027': {
    text: 'From 1 March 2027, Victorian rental minimum standards require an efficient electric water heater when an unrepairable unit is replaced, an efficient reverse-cycle air conditioner when a main living area heater fails, and efficient cooling in the main living area at the start of a new lease.',
    sourceId: 'energyvic-rental-efficiency',
  },
  'rental-insulation-2027': {
    text: 'Under Victorian rental minimum standards, ceilings where no insulation is present must be upgraded to at least R5.0 at a new lease from 1 March 2027.',
    sourceId: 'energyvic-rental-efficiency',
  },
  'induction-must-replace-gas': {
    text: 'The VEU induction cooktop discount applies only when replacing an existing mains gas or LPG cooktop.',
    sourceId: 'energyvic-induction',
  },
  'property-age': {
    text: 'Replacing an appliance under this VEU activity requires a home that is more than 2 years old.',
    sourceId: 'energyvic-induction',
  },
  'induction-claimed-before': {
    text: 'An induction cooktop discount cannot be claimed again if one has already been claimed at this address.',
    sourceId: 'energyvic-induction',
  },
  'induction-product-rules': {
    text: 'Eligible induction cooktops must be built-in or freestanding, at least 550 by 380 mm, with 3 or more cooking zones and at least a 2-year warranty. Portable plug-in units do not qualify.',
    sourceId: 'energyvic-induction',
  },
  'induction-process': {
    text: "Energy Victoria's process for cooktops is different: check eligibility, buy the cooktop, then send the invoice to an accredited provider. Installation can be arranged separately.",
    sourceId: 'energyvic-induction',
  },
  retro: {
    text: 'Discounts generally need an accredited provider involved before installation work starts. Check with an accredited provider whether an already-installed unit can still be claimed.',
    sourceId: 'energyvic-retrospective',
  },
  'sealing-co-risk': {
    text: "Homes with an open-flued or flueless gas heater, or an open-flued gas water heater inside, don't qualify, because sealing can raise the risk of carbon monoxide.",
    sourceId: 'energyvic-weather-sealing',
  },
  'sealing-examples': {
    text: "Energy Victoria's examples; the amount depends on what's sealed and the product warranty.",
    sourceId: 'energyvic-weather-sealing',
  },
  'renter-sealing': {
    text: 'Consumer Affairs Victoria lists draughtproofing as a reasonable change a landlord cannot refuse without good reason in a property without gas appliances; where gas appliances are present, a gas safety check is required first.',
    sourceId: 'cav-renter-changes',
  },
  'rental-sealing-2027': {
    text: 'Victorian rental minimum standards introduce a draughtproofing standard at a new lease from 1 July 2027.',
    sourceId: 'energyvic-rental-efficiency',
  },
};
