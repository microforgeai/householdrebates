import { loadConfig } from '../../config.js';
import { loadAlertsConfig } from '../config.js';
import { openAlertsDatabase } from '../db.js';
import { AlertsRepository } from '../repository.js';
import { getArgValue } from './args.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const email = getArgValue(args, '--email');
  const methodArg = getArgValue(args, '--method');
  const method = methodArg === 'reply' ? 'reply' : 'cli';

  if (!email) {
    console.error(
      'Usage: npm run -w api alerts:unsubscribe -- --email user@example.com [--method cli|reply]',
    );
    process.exit(1);
  }

  const baseCfg = loadConfig();
  const alertsCfg = loadAlertsConfig(process.env, baseCfg);
  const alertsDb = openAlertsDatabase(alertsCfg.alertsDbPath);
  const repo = new AlertsRepository(alertsDb, alertsCfg.alertsHashSecret);
  const res = repo.unsubscribeByEmail(email, method);
  alertsDb.close();
  console.log(
    `Unsubscribed and suppressed address (method=${method}, subscriberUpdated=${res.subscriberUpdated}).`,
  );
}
