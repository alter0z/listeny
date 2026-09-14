import { Innertube, UniversalCache } from 'youtubei.js';

async function test() {
  const yt = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true,
  });

  console.log('Testing yt.download...');
  try {
    const stream = await yt.download('u1CRhcHXJWA', {
      type: 'audio',
      quality: 'best',
    });

    console.log('Got download stream!', typeof stream);
    let totalBytes = 0;
    const reader = stream.getReader ? stream.getReader() : null;
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.length;
        if (totalBytes % (500 * 1024) < 100000) {
          console.log(`Downloaded ${Math.round(totalBytes / 1024)} KB`);
        }
      }
    } else {
      for await (const chunk of stream) {
        totalBytes += chunk.length;
        if (totalBytes % (500 * 1024) < 100000) {
          console.log(`Downloaded ${Math.round(totalBytes / 1024)} KB`);
        }
      }
    }

    console.log('Total downloaded via yt.download:', totalBytes);
  } catch (e) {
    console.error('yt.download error:', e);
  }
}

test();
