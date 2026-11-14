import { loadConfig } from '../../config.js';
import { createAlertsMailDriver, loadAlertsConfig } from '../config.js';
import { openAlertsDatabase } from '../db.js';
import { AlertsRepository } from '../repository.js';
import { sendAlertDraft } from '../send.js';
import { getArgValue } from './args.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const draftPath = getArgValue(args, '--draft');
  const confirmSha256 = getArgValue(args, '--confirm');
  if (!draftPath) {
    console.error(
      'Usage: npm run -w api alerts:send -- --draft <file> [--confirm <sha256>]',
    );
    process.exit(1);
  }

  const baseCfg = loadConfig();
  const alertsCfg = loadAlertsConfig(process.env, baseCfg);
  const alertsDb = openAlertsDatabase(alertsCfg.alertsDbPath);
  const repo = new AlertsRepository(alertsDb, alertsCfg.alertsHashSecret);
  const mail = createAlertsMailDriver(alertsCfg, baseCfg);

  sendAlertDraft({
    draftPath,
    confirmSha256,
    alertsConfig: alertsCfg,
    siteOrigin: baseCfg.siteOrigin,
    repo,
    mail,
  })
    .then((res) => {
      alertsDb.close();
      console.log(JSON.stringify(res, null, 2));
    })
    .catch((err) => {
      alertsDb.close();
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
