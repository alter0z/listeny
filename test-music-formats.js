import vm from 'node:vm';
import { Innertube, UniversalCache, Platform } from 'youtubei.js';

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
  console.log('All formats:');
  const formats = [...(info.streaming_data?.formats || []), ...(info.streaming_data?.adaptive_formats || [])];
  
  for (const f of formats) {
    console.log(`itag: ${f.itag}, mime: ${f.mime_type}, quality: ${f.quality || f.audio_quality}, approxDurationMs: ${f.approx_duration_ms}`);
    let url = f.url;
    if (!url) {
      url = await f.decipher(yt.session.player);
    }
    
    // Let's test headers when fetching from googlevideo!
    // What if we pass the right User-Agent or Referer or origin?
    console.log('Testing format', f.itag, '...');
    
    // Test 1: plain fetch
    const r1 = await fetch(url);
    console.log('  Plain fetch status:', r1.status);
    
    // Test 2: with headers
    const r2 = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Referer': 'https://music.youtube.com/',
        'Origin': 'https://music.youtube.com'
      }
    });
    console.log('  With YTM headers status:', r2.status);
  }
}

test();
