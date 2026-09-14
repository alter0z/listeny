import { Innertube, UniversalCache, ClientType } from 'youtubei.js';

async function testClients() {
  const clients = [
    { name: 'DEFAULT (WEB)', opts: {} },
    { name: 'IOS', opts: { client_type: ClientType.IOS } },
    { name: 'ANDROID', opts: { client_type: ClientType.ANDROID } },
    { name: 'TV', opts: { client_type: ClientType.TV } },
  ];

  for (const client of clients) {
    console.log(`\n--- Testing ${client.name} ---`);
    try {
      const yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
        ...client.opts,
      });

      const info = await yt.getInfo('u1CRhcHXJWA');
      const format = info.chooseFormat({ type: 'audio', quality: 'best' });
      if (!format) {
        console.log('No format found');
        continue;
      }

      console.log('Format:', {
        itag: format.itag,
        mime_type: format.mime_type,
        content_length: format.content_length,
        has_url: !!format.url,
      });

      const url = format.url || await format.decipher(yt.session.player);
      console.log('Deciphered URL host:', new URL(url).hostname);

      // Test Range 0-100k
      const res1 = await fetch(url, { headers: { Range: 'bytes=0-100000' } });
      console.log('Range 0-100k status:', res1.status);

      // Test Range 1.5M - 1.6M
      const res2 = await fetch(url, { headers: { Range: 'bytes=1500000-1600000' } });
      console.log('Range 1.5M-1.6M status:', res2.status);

      // Test Range 0- (open ended)
      const res3 = await fetch(url, { headers: { Range: 'bytes=0-' } });
      console.log('Range 0- (open) status:', res3.status);

      // Test no Range
      const res4 = await fetch(url);
      console.log('No Range status:', res4.status);

    } catch (err) {
      console.error(`Error in ${client.name}:`, err.message);
    }
  }
}

testClients();
