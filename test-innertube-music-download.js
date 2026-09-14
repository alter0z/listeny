import { Innertube, UniversalCache, Platform } from 'youtubei.js';
import vm from 'node:vm';

Platform.shim.eval = async (data, env = {}) => {
  const code = typeof data === 'string' ? data : data?.output || '';
  const context = {
    ...env,
    console,
    URL,
    URLSearchParams,
  };
  return vm.runInNewContext(`(function() { ${code} })()`, context);
};

async function test() {
  const yt = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true,
  });

  console.log('Testing info.download() via music.getInfo...');
  const info = await yt.music.getInfo('u1CRhcHXJWA');
  
  try {
    const stream = await info.download({ type: 'audio', quality: 'best' });
    console.log('Got download stream from info.download()!');
    let totalBytes = 0;
    for await (const chunk of stream) {
      totalBytes += chunk.length;
      if (totalBytes % (500 * 1024) < 65536) {
        console.log(`  Downloaded ${Math.round(totalBytes / 1024)} KB`);
      }
    }
    console.log('Total bytes downloaded:', totalBytes);
  } catch (e) {
    console.error('info.download() error:', e);
  }
}

test();
