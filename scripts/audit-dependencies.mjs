import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const exceptions = JSON.parse(
  readFileSync(new URL('./dependency-audit-exceptions.json', import.meta.url), 'utf8')
);
const audit = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  cwd: new URL('..', import.meta.url),
  encoding: 'utf8',
});

if (!audit.stdout) {
  process.stderr.write(audit.stderr || 'npm audit produced no report.\n');
  process.exit(1);
}

const report = JSON.parse(audit.stdout);
const allowed = new Set(exceptions.advisoryIds);
const observed = new Set();

for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
  for (const advisory of vulnerability.via ?? []) {
    if (typeof advisory === 'object' && typeof advisory.source === 'number') {
      observed.add(advisory.source);
    }
  }
}

const unexpected = [...observed].filter((id) => !allowed.has(id));
const expired = Date.now() > Date.parse(`${exceptions.reviewBy}T23:59:59Z`);

if (unexpected.length > 0 || expired) {
  if (unexpected.length > 0) {
    console.error(`Unexpected npm advisories: ${unexpected.join(', ')}`);
  }
  if (expired) {
    console.error(`Dependency audit exceptions expired on ${exceptions.reviewBy}.`);
  }
  process.exit(1);
}

console.log(
  `Dependency audit contains only ${observed.size} reviewed upstream advisories; review by ${exceptions.reviewBy}.`
);
