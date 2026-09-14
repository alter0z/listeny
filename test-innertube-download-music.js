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

  const info = await yt.music.getInfo('u1CRhcHXJWA');
  const format = info.chooseFormat({ type: 'audio', quality: 'best' });
  console.log('Music format:', format.itag, format.mime_type, format.content_length);

  try {
    const stream = await format.download();
    console.log('Got download stream from format.download()!');
    let totalBytes = 0;
    for await (const chunk of stream) {
      totalBytes += chunk.length;
    }
    console.log('Total bytes downloaded via format.download():', totalBytes);
  } catch (e) {
    console.error('format.download() error:', e);
  }
}

test();
