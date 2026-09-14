import { resolveAudioStreamUrl } from './src/lib/innertube.ts';
async function test() {
  const { url, contentLength } = await resolveAudioStreamUrl('u1CRhcHXJWA');
  console.log('Total content length:', contentLength);
  for (let kb of [512, 1024, 1200, 1500, 1800, 2048]) {
    const bytes = kb * 1024 - 1;
    const res = await fetch(url, { headers: { 'Range': `bytes=0-${bytes}` } });
    console.log(`${kb}KB => ${res.status}`);
  }
}
test();
