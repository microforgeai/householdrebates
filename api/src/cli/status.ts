import { loadConfig } from '../config.js';
import { openDatabase } from '../db.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const cfg = loadConfig();
  const db = openDatabase(cfg.dbPath);

  const byStatus = db
    .prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status')
    .all();
  const byActivity = db
    .prepare('SELECT activity, COUNT(*) as count FROM leads GROUP BY activity')
    .all();
  const byHowHeard = db
    .prepare('SELECT COALESCE(how_heard, "unspecified") as how_heard, COUNT(*) as count FROM leads GROUP BY how_heard')
    .all();
  const deliveries = db
    .prepare('SELECT COALESCE(outcome, "pending") as outcome, COUNT(*) as count FROM deliveries GROUP BY outcome')
    .all();

  console.log(
    JSON.stringify(
      {
        leadsEnabled: cfg.leadsEnabled,
        byStatus,
        byActivity,
        byHowHeard,
        deliveries,
      },
      null,
      2,
    ),
  );
}
