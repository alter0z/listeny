import { resolveAudioStreamUrl } from './src/lib/innertube.ts';
async function test() {
  const { url } = await resolveAudioStreamUrl('u1CRhcHXJWA');
  for (let mb = 1; mb <= 10; mb++) {
    const bytes = mb * 1024 * 1024 - 1;
    const res = await fetch(url, { headers: { 'Range': `bytes=0-${bytes}` } });
    console.log(`Range: 0-${bytes} (${mb}MB) => Status:`, res.status);
  }
}
test();
