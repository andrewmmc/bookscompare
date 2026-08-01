import { probeKoboTw } from './kobo-tw';

const query = process.argv.slice(2).join(' ').trim();

if (!query) {
  console.error('Usage: npm run probe:kobo-tw -w @bookscompare/api -- <ISBN or title>');
  process.exitCode = 1;
} else {
  try {
    const result = await probeKoboTw(query);
    console.log(JSON.stringify(result, null, 2));
    if (result.challenged || result.status >= 400) process.exitCode = 2;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
