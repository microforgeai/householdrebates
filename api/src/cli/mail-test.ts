import { loadConfig } from '../config.js';
import { createMailDriver } from '../mail/index.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const cfg = loadConfig();
  const mail = createMailDriver(cfg);

  mail
    .verify()
    .then(() =>
      mail.send({
        to: cfg.leadsNotifyTo,
        subject: 'Household Rebates mail transport self-test',
        text: `Mail transport (${cfg.mailTransport}) verified at ${new Date().toISOString()}.\nAgenor Services Pty Ltd (ABN 29 644 447 263)`,
        html: `<p>Mail transport (<strong>${cfg.mailTransport}</strong>) verified at ${new Date().toISOString()}.</p><p><small>Agenor Services Pty Ltd (ABN 29 644 447 263)</small></p>`,
      }),
    )
    .then((res) => {
      console.log(`Mail test succeeded (${res.messageId}).`);
    })
    .catch((err) => {
      console.error('Mail test failed:', err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
