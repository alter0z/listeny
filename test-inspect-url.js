import { resolveAudioStreamUrl } from './src/lib/innertube.ts';

async function test() {
  const { url, mimeType, contentLength } = await resolveAudioStreamUrl('u1CRhcHXJWA');
  console.log('MimeType:', mimeType);
  console.log('ContentLength:', contentLength);
  console.log('URL:', url);
  const parsed = new URL(url);
  console.log('Hostname:', parsed.hostname);
  console.log('Pathname:', parsed.pathname);
  console.log('Params:', Object.fromEntries(parsed.searchParams.entries()));
}

test();
