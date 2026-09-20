import vm from 'node:vm';
import { Innertube, UniversalCache, Platform } from 'youtubei.js';

Platform.shim.eval = async (data, env = {}) => {
  const code = typeof data === 'string' ? data : data?.output || '';
  const context = { ...env, console, URL, URLSearchParams };
  return vm.runInNewContext(`(function() { ${code} })()`, context);
};

async function test() {
  const yt = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true,
  });
  
  const info = await yt.music.getInfo('u1CRhcHXJWA');
  
  // Try download with type: 'video+audio' to get itag 18
  console.log('Trying info.download with video+audio...');
  try {
    const stream = await info.download({ type: 'video+audio', quality: 'best' });
    let totalBytes = 0;
    for await (const chunk of stream) {
      totalBytes += chunk.length;
      if (totalBytes > 100000) {
        console.log('Got', totalBytes, 'bytes from download stream, looks good!');
        break;
      }
    }
  } catch (e) {
    console.log('Download video+audio error:', e.message);
  }
  
  // Also try audio only download to see actual error
  console.log('\nTrying info.download with audio...');
  try {
    const stream = await info.download({ type: 'audio', quality: 'best' });
    let totalBytes = 0;
    for await (const chunk of stream) {
      totalBytes += chunk.length;
      if (totalBytes > 100000) {
        console.log('Got', totalBytes, 'bytes from audio download stream');
        break;
      }  
    }
    console.log('Audio download total:', totalBytes);
  } catch (e) {
    console.log('Download audio error:', e.message);
  }
}

test();
