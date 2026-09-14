import { resolveAudioStreamUrl } from './src/lib/innertube.ts';

async function test() {
  const { url } = await resolveAudioStreamUrl('u1CRhcHXJWA');
  const res = await fetch(url, {
    method: 'HEAD',
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  console.log('HEAD status:', res.status);
  for (const [k, v] of res.headers.entries()) {
    console.log(`  ${k}: ${v}`);
  }
}

test();
