const AGENOR_FOOTER_TEXT = `
---
Household Rebates (https://householdrebates.com.au)
Published by Agenor Services Pty Ltd (ABN 29 644 447 263), Melbourne VIC
Privacy & consent withdrawal: privacy@householdrebates.com.au
Consumer rights under the VEU code of conduct: https://householdrebates.com.au/how-quotes-work/#your-rights
`.trim();

export function buildInternalNoticeEmail(input: {
  ref: string;
  activity: 'rcac' | 'hotwater';
  postcode: string;
  recipientIds: string[];
  createdAtUtc: string;
}): { subject: string; text: string; html: string } {
  const subject = `New quote request ${input.ref} — ${input.activity} — ${input.postcode}`;
  const text = [
    `A new quote enquiry has been recorded.`,
    ``,
    `Reference: ${input.ref}`,
    `Activity: ${input.activity}`,
    `Postcode: ${input.postcode}`,
    `Routed installers: ${input.recipientIds.join(', ')}`,
    `Created (UTC): ${input.createdAtUtc}`,
    ``,
    `To deliver this enquiry to the named installer(s), run:`,
    `npm run deliver -- ${input.ref}`,
    ``,
    AGENOR_FOOTER_TEXT,
  ].join('\n');

  const html = `<p>A new quote enquiry has been recorded.</p>
<ul>
  <li><strong>Reference:</strong> ${input.ref}</li>
  <li><strong>Activity:</strong> ${input.activity}</li>
  <li><strong>Postcode:</strong> ${input.postcode}</li>
  <li><strong>Routed installers:</strong> ${input.recipientIds.join(', ')}</li>
  <li><strong>Created (UTC):</strong> ${input.createdAtUtc}</li>
</ul>
<p>To deliver this enquiry to the named installer(s), run: <code>npm run deliver -- ${input.ref}</code></p>
<hr/>
<p><small>Household Rebates — Agenor Services Pty Ltd (ABN 29 644 447 263), Melbourne VIC</small></p>`;

  return { subject, text, html };
}

export function buildConsumerConfirmationEmail(input: {
  ref: string;
  firstName: string;
  activity: 'rcac' | 'hotwater';
  installers: { tradingName: string; accreditedProvider: string }[];
  channels: string[];
  expiresAtUtc: string;
}): { subject: string; text: string; html: string } {
  const subject = `Your Household Rebates quote request (${input.ref})`;
  const installerLines = input.installers
    .map(
      (i) =>
        `- ${i.tradingName} (works with Victorian Energy Upgrades accredited provider ${i.accreditedProvider})`,
    )
    .join('\n');
  const channelStr = input.channels.join(', ');

  const text = [
    `Hi ${input.firstName},`,
    ``,
    `We have received your quote request (reference ${input.ref}).`,
    ``,
    `Who will contact you:`,
    installerLines,
    ``,
    `Approved contact channel(s): ${channelStr}`,
    `Consent expiry (UTC): ${input.expiresAtUtc} (3 months from submission unless withdrawn sooner)`,
    ``,
    `How to withdraw your consent at any time:`,
    `Reply to this email or email privacy@householdrebates.com.au quoting reference ${input.ref}.`,
    ``,
    `Important reminder: A quote does not guarantee a discount. The VEU accredited provider checks your eligibility and confirms any discount in your written quote before work begins.`,
    `Read your consumer rights under the VEU code of conduct and the VEET scheme consumer factsheet: https://householdrebates.com.au/how-quotes-work/#your-rights`,
    `Privacy policy: https://householdrebates.com.au/privacy/`,
    ``,
    AGENOR_FOOTER_TEXT,
  ].join('\n');

  const html = `<p>Hi ${input.firstName},</p>
<p>We have received your quote request (reference <strong>${input.ref}</strong>).</p>
<p><strong>Who will contact you:</strong></p>
<ul>
  ${input.installers
    .map(
      (i) =>
        `<li><strong>${i.tradingName}</strong> (works with Victorian Energy Upgrades accredited provider <strong>${i.accreditedProvider}</strong>)</li>`,
    )
    .join('')}
</ul>
<p><strong>Approved contact channel(s):</strong> ${channelStr}<br/>
<strong>Consent expiry (UTC):</strong> ${input.expiresAtUtc} (3 months from submission unless withdrawn sooner)</p>
<p><strong>How to withdraw your consent:</strong> Reply to this email or write to <a href="mailto:privacy@householdrebates.com.au">privacy@householdrebates.com.au</a> quoting <strong>${input.ref}</strong>.</p>
<p>A quote does not guarantee a discount. The VEU accredited provider checks your eligibility and confirms any discount in your written quote before work begins. Read your consumer rights under the VEU code of conduct and the VEET scheme consumer factsheet at <a href="https://householdrebates.com.au/how-quotes-work/#your-rights">householdrebates.com.au/how-quotes-work/#your-rights</a> and our <a href="https://householdrebates.com.au/privacy/">privacy policy</a>.</p>
<hr/>
<p><small>Household Rebates — Published by Agenor Services Pty Ltd (ABN 29 644 447 263), Melbourne VIC</small></p>`;

  return { subject, text, html };
}

export function buildInstallerDeliveryEmail(input: {
  ref: string;
  installerTradingName: string;
  accreditedProvider: string;
  activity: 'rcac' | 'hotwater';
  currentSystem: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phoneE164: string;
  postcode: string;
  ownership: string;
  buildingOver2Years: string;
  workStarted: string;
  productBought: number;
  message: string | null;
  channels: string[];
  consentVersion: string;
  consentSha256: string;
  consentSnapshot: string;
  givenAtUtc: string;
  expiresAtUtc: string;
}): { subject: string; text: string; html: string } {
  const subject = `VEU Quote Enquiry ${input.ref} — ${input.postcode} (${input.activity})`;
  const fullName = [input.firstName, input.lastName].filter(Boolean).join(' ');

  const text = [
    `Consented VEU Quote Enquiry for ${input.installerTradingName}`,
    `Accredited Provider on Record: ${input.accreditedProvider}`,
    `Reference: ${input.ref}`,
    ``,
    `--- Customer & Property Details ---`,
    `Name: ${fullName}`,
    `Phone: ${input.phoneE164}`,
    `Email: ${input.email}`,
    `Postcode: ${input.postcode}`,
    `Activity: ${input.activity}`,
    `Current system: ${input.currentSystem}`,
    `Tenure: ${input.ownership}`,
    `Building > 2 years old: ${input.buildingOver2Years}`,
    `Work stage: ${input.workStarted} (product_bought=${input.productBought})`,
    `Notes: ${input.message || '(none)'}`,
    ``,
    `--- Express Prior Consent Record (VEU Code of Conduct) ---`,
    `Permitted contact channels ONLY: ${input.channels.join(', ')}`,
    `Consent Given (UTC): ${input.givenAtUtc}`,
    `Consent Expires (UTC): ${input.expiresAtUtc}`,
    `Consent Version: ${input.consentVersion}`,
    `Consent Text SHA-256: ${input.consentSha256}`,
    ``,
    `Exact Consent Snapshot Shown to Customer:`,
    input.consentSnapshot,
    ``,
    AGENOR_FOOTER_TEXT,
  ].join('\n');

  const html = `<h2>Consented VEU Quote Enquiry (${input.ref})</h2>
<p><strong>Recipient Installer:</strong> ${input.installerTradingName}<br/>
<strong>VEU Accredited Provider:</strong> ${input.accreditedProvider}</p>
<h3>Customer &amp; Property Details</h3>
<ul>
  <li><strong>Name:</strong> ${fullName}</li>
  <li><strong>Phone:</strong> ${input.phoneE164}</li>
  <li><strong>Email:</strong> ${input.email}</li>
  <li><strong>Postcode:</strong> ${input.postcode}</li>
  <li><strong>Activity:</strong> ${input.activity}</li>
  <li><strong>Current system:</strong> ${input.currentSystem}</li>
  <li><strong>Tenure:</strong> ${input.ownership}</li>
  <li><strong>Building &gt; 2 years old:</strong> ${input.buildingOver2Years}</li>
  <li><strong>Work stage:</strong> ${input.workStarted}</li>
  <li><strong>Notes:</strong> ${input.message || '(none)'}</li>
</ul>
<h3>Express Prior Consent Record (VEU Code of Conduct)</h3>
<p><strong>Permitted channels ONLY:</strong> ${input.channels.join(', ')}<br/>
<strong>Given (UTC):</strong> ${input.givenAtUtc}<br/>
<strong>Expires (UTC):</strong> ${input.expiresAtUtc}<br/>
<strong>Version:</strong> ${input.consentVersion}<br/>
<strong>SHA-256:</strong> <code>${input.consentSha256}</code></p>
<pre style="white-space:pre-wrap;background:#f2efe9;padding:12px;">${input.consentSnapshot}</pre>
<hr/>
<p><small>Household Rebates — Published by Agenor Services Pty Ltd (ABN 29 644 447 263), Melbourne VIC</small></p>`;

  return { subject, text, html };
}

export function buildWithdrawalNoticeEmail(input: {
  ref: string;
  installerTradingName: string;
  withdrawnAtUtc: string;
}): { subject: string; text: string; html: string } {
  const subject = `CONSENT WITHDRAWN — DO NOT CONTACT — ${input.ref}`;
  const text = [
    `URGENT: Express prior consent for enquiry ${input.ref} has been withdrawn at ${input.withdrawnAtUtc}.`,
    ``,
    `${input.installerTradingName} must immediately cease all phone, email, and site-visit contact for reference ${input.ref} under the VEU code of conduct.`,
    ``,
    AGENOR_FOOTER_TEXT,
  ].join('\n');

  const html = `<p><strong>URGENT:</strong> Express prior consent for enquiry <strong>${input.ref}</strong> was withdrawn at ${input.withdrawnAtUtc}.</p>
<p>${input.installerTradingName} must immediately cease all phone, email, and site-visit contact for reference <strong>${input.ref}</strong> under the VEU code of conduct.</p>
<hr/>
<p><small>Household Rebates — Agenor Services Pty Ltd (ABN 29 644 447 263), Melbourne VIC</small></p>`;

  return { subject, text, html };
}
