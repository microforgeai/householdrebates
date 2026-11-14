import { loadConfig } from '../../config.js';
import { loadAlertsConfig } from '../config.js';
import { openAlertsDatabase } from '../db.js';
import { AlertsRepository } from '../repository.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseCfg = loadConfig();
  const alertsCfg = loadAlertsConfig(process.env, baseCfg);
  const alertsDb = openAlertsDatabase(alertsCfg.alertsDbPath);
  const repo = new AlertsRepository(alertsDb, alertsCfg.alertsHashSecret);
  const stats = repo.getStats();
  alertsDb.close();
  console.log(JSON.stringify(stats, null, 2));
}
