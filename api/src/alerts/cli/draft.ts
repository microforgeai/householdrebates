import { loadConfig } from '../../config.js';
import { loadAlertsConfig } from '../config.js';
import { writeAlertDraft } from '../drafts.js';
import { getArgValue } from './args.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const topic = getArgValue(args, '--topic');
  const page = getArgValue(args, '--page');
  if (!topic || !page) {
    console.error(
      'Usage: npm run -w api alerts:draft -- --topic <id> --page <url>',
    );
    process.exit(1);
  }

  const baseCfg = loadConfig();
  const alertsCfg = loadAlertsConfig(process.env, baseCfg);
  const res = writeAlertDraft({
    topic,
    page,
    siteOrigin: baseCfg.siteOrigin,
    draftsDir: alertsCfg.alertsDraftsDir,
  });

  console.log(`Draft written: ${res.filePath}`);
  console.log(`SHA-256: ${res.sha256}`);
}
