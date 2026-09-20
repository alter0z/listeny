import { resolveAudioStreamUrl } from './src/lib/innertube.ts';

async function test() {
  const { url } = await resolveAudioStreamUrl('u1CRhcHXJWA');

  const offsets = [
    [0, 100000],
    [500000, 600000],
    [1000000, 1048575],
    [1048576, 1148576],
    [1048576, 2097151],
    [2000000, 2100000],
  ];

  for (const [s, e] of offsets) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Range': `bytes=${s}-${e}`,
      }
    });
    console.log(`bytes=${s}-${e} => status ${res.status}`);
  }
}

test();
