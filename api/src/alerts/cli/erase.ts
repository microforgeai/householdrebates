import { loadConfig } from '../../config.js';
import { loadAlertsConfig } from '../config.js';
import { openAlertsDatabase } from '../db.js';
import { AlertsRepository } from '../repository.js';
import { getArgValue } from './args.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const email = getArgValue(args, '--email');
  if (!email) {
    console.error('Usage: npm run -w api alerts:erase -- --email user@example.com');
    process.exit(1);
  }

  const baseCfg = loadConfig();
  const alertsCfg = loadAlertsConfig(process.env, baseCfg);
  const alertsDb = openAlertsDatabase(alertsCfg.alertsDbPath);
  const repo = new AlertsRepository(alertsDb, alertsCfg.alertsHashSecret);
  const res = repo.erasePersonalData(email);
  alertsDb.close();
  console.log(
    `Erased personal fields for ${res.erasedCount} alert subscriber(s); hash retained in suppression.`,
  );
}
