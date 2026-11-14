export interface AlertsSenderInfo {
  abn: string;
  postalOrContactAddress: string;
  contactEmail: string;
}

// IMPORTANT (#22): When setting ALERTS_SENDER_ADDRESS, use a PO box or Agenor's registered office
// (never a private family home address). Details must remain accurate for at least 30 days after each send.
export const ALERTS_SENDER_TEMPLATE =
  'Household Rebates is run by Agenor Services Pty Ltd, ABN <<ABN>>, <<postal or contact address>>, <<contact email>>.';

export const ALERTS_INDEPENDENCE_LINE =
  "We're not a government website and we are not affiliated with, endorsed by, or representing the Victorian Government, Energy Victoria, Solar Victoria, the Department of Energy, Environment and Climate Action (DEECA), the Essential Services Commission (ESC), the Australian Government, the Clean Energy Regulator or any council.";

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function assertNoUnresolvedPlaceholders(value: string, label: string): void {
  if (value.includes('<<') || value.includes('>>')) {
    throw new Error(`Unresolved placeholder in ${label}: "${value}"`);
  }
}

export function assertNoDollarCharacter(value: string, label: string): void {
  if (value.includes('\u0024')) {
    throw new Error(
      `Alert email ${label} must not contain currency amounts; link to the canonical site page instead.`,
    );
  }
}

export function renderAlertsSenderBlock(sender: AlertsSenderInfo): string {
  const abn = sender.abn.trim();
  const address = sender.postalOrContactAddress.trim();
  const email = sender.contactEmail.trim();

  if (!abn || !address || !email) {
    throw new Error(
      'Alerts sender block requires non-empty ALERTS_SENDER_ABN, ALERTS_SENDER_ADDRESS and ALERTS_SENDER_EMAIL.',
    );
  }

  const rendered = ALERTS_SENDER_TEMPLATE.replace('<<ABN>>', abn)
    .replace('<<postal or contact address>>', address)
    .replace('<<contact email>>', email);

  assertNoUnresolvedPlaceholders(rendered, 'alerts sender block');
  return rendered;
}
