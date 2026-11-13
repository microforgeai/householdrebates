export interface PublicInstaller {
  id: string;
  tradingName: string;
  accreditedProvider: string;
  activities: ('rcac' | 'hotwater' | 'solar' | 'battery')[];
  postcodes: string[];
  active: boolean;
  agreementSignedOn?: Date | string;
}

export function matchInstallers(
  installers: PublicInstaller[],
  postcode: string,
  activity: 'rcac' | 'hotwater' | 'either',
): PublicInstaller[] {
  const cleanPostcode = postcode.trim();
  if (!/^3\d{3}$/.test(cleanPostcode)) {
    return [];
  }
  return installers
    .filter((inst) => {
      if (!inst.active || !inst.agreementSignedOn || !inst.accreditedProvider) {
        return false;
      }
      if (!inst.postcodes.includes(cleanPostcode)) {
        return false;
      }
      if (activity === 'either') {
        return inst.activities.includes('rcac') || inst.activities.includes('hotwater');
      }
      return inst.activities.includes(activity);
    })
    .slice(0, 3);
}
