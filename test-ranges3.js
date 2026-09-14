import { getInnertubeIos } from './src/lib/innertube.ts';
async function test() {
  const yt = await getInnertubeIos();
  const info = await yt.getBasicInfo('u1CRhcHXJWA');
  const fmt = info.chooseFormat({ type: 'audio', quality: 'best' });
  const url = fmt.url || await fmt.decipher(yt.session.player);
  console.log('Got iOS URL');
  for (let mb = 1; mb <= 4; mb++) {
    const bytes = mb * 1024 * 1024 - 1;
    const res = await fetch(url + `&rn=${Math.random()}`, { headers: { 'Range': `bytes=0-${bytes}` } });
    console.log(`Range: 0-${bytes} (${mb}MB) => Status:`, res.status);
  }
}
test();
