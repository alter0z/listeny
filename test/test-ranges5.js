import { resolveAudioStreamUrl } from './src/lib/innertube.ts';
async function test() {
  const { url } = await resolveAudioStreamUrl('u1CRhcHXJWA');
  for (let kb of [1024, 2048, 5120, 10240, 10485]) { // up to 10MB
    const bytes = kb * 1024 - 1;
    const res = await fetch(url, { headers: { 'Range': `bytes=0-${bytes}` } });
    if (res.status === 206) {
      console.log(`${kb}KB => 206`);
    } else {
      console.log(`${kb}KB => ${res.status}`);
    }
  }
}
test();
