import type { InstallerRecord } from './config.js';

export interface PublicInstallerSummary {
  id: string;
  tradingName: string;
  accreditedProvider: string;
}

export function routeInstallers(
  installers: InstallerRecord[],
  postcode: string,
  activity: 'rcac' | 'hotwater',
): InstallerRecord[] {
  const cleanPostcode = postcode.trim();
  if (!/^3\d{3}$/.test(cleanPostcode)) {
    return [];
  }

  return installers
    .filter(
      (i) =>
        i.active &&
        Boolean(i.agreementSignedOn) &&
        Boolean(i.accreditedProvider) &&
        i.activities.includes(activity) &&
        i.postcodes.includes(cleanPostcode),
    )
    .slice(0, 3);
}

export function toPublicSummaries(installers: InstallerRecord[]): PublicInstallerSummary[] {
  return installers.map((i) => ({
    id: i.id,
    tradingName: i.tradingName,
    accreditedProvider: i.accreditedProvider,
  }));
}
