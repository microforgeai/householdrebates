import { loadConfig } from '../../config.js';
import { openDatabase } from '../../db.js';
import { loadAlertsConfig } from '../config.js';
import { openAlertsDatabase } from '../db.js';

export function runAllMigrations(env: NodeJS.ProcessEnv = process.env): {
  leadsDbPath: string;
  alertsDbPath: string;
} {
  const baseCfg = loadConfig(env);
  const alertsCfg = loadAlertsConfig(env, baseCfg);

  const leadsDb = openDatabase(baseCfg.dbPath);
  leadsDb.close();

  const alertsDb = openAlertsDatabase(alertsCfg.alertsDbPath);
  alertsDb.close();

  return {
    leadsDbPath: baseCfg.dbPath,
    alertsDbPath: alertsCfg.alertsDbPath,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const res = runAllMigrations();
  console.log(
    `Migrations applied (leads=${res.leadsDbPath}, alerts=${res.alertsDbPath}).`,
  );
}
