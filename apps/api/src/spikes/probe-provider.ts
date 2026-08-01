import { isProbeProviderId, probeProvider, PROBE_PROVIDER_IDS } from './provider-probe';

const [providerId = '', ...queryParts] = process.argv.slice(2);
const query = queryParts.join(' ').trim();

if (!isProbeProviderId(providerId) || !query) {
  console.error(
    `Usage: npm run probe:provider -w @bookscompare/api -- <provider> <ISBN or title>\nProviders: ${PROBE_PROVIDER_IDS.join(', ')}`
  );
  process.exitCode = 1;
} else {
  const result = await probeProvider(providerId, query);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 2;
}
