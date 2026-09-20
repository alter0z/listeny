import vm from 'node:vm';
import { Innertube, UniversalCache, Platform, ClientType } from 'youtubei.js';

Platform.shim.eval = async (data, env = {}) => {
  const code = typeof data === 'string' ? data : data?.output || '';
  const context = { ...env, console, URL, URLSearchParams };
  return vm.runInNewContext(`(function() { ${code} })()`, context);
};

async function test() {
  // Test WEB_REMIX client  
  const yt = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true,
  });

  const info = await yt.music.getInfo('u1CRhcHXJWA');
  
  // chooseFormat with type: 'video+audio' should pick a muxed format
  try {
    const muxedFormat = info.chooseFormat({ type: 'video+audio', quality: 'best' });
    console.log('Muxed format:', muxedFormat.itag, muxedFormat.mime_type, muxedFormat.quality_label);
    
    let url = muxedFormat.url || await muxedFormat.decipher(yt.session.player);
    console.log('URL resolved:', !!url);
    
    const r1 = await fetch(url);
    console.log('Full fetch:', r1.status, 'CL:', r1.headers.get('content-length'));
    
    const r2 = await fetch(url, { headers: { Range: 'bytes=1500000-1600000' }});
    console.log('Range 1.5MB:', r2.status, 'CL:', r2.headers.get('content-length'));
  } catch (e) {
    console.log('Muxed format error:', e.message);
  }
  
  // Try IOS client - it has direct URLs
  const ytIos = await Innertube.create({
    cache: new UniversalCache(false),
    generate_session_locally: true,
    client_type: ClientType.IOS,
  });
  
  const iosInfo = await ytIos.getBasicInfo('u1CRhcHXJWA');
  const iosFormats = [...(iosInfo.streaming_data?.formats || [])];
  console.log('\n--- IOS muxed formats ---');
  for (const f of iosFormats) {
    console.log(`itag: ${f.itag}, mime: ${f.mime_type}, quality: ${f.quality_label}, hasUrl: ${!!f.url}, cl: ${f.content_length}`);
    if (f.url) {
      const r = await fetch(f.url);
      console.log(`  fetch: ${r.status}, CL: ${r.headers.get('content-length')}`);
      const r2 = await fetch(f.url, { headers: { Range: 'bytes=1500000-1600000' }});
      console.log(`  range 1.5M: ${r2.status}, CL: ${r2.headers.get('content-length')}`);
    }
  }

  // Also check IOS adaptive audio
  const iosAdaptive = (iosInfo.streaming_data?.adaptive_formats || []).filter(f => f.mime_type?.includes('audio'));
  console.log('\n--- IOS adaptive audio ---');
  for (const f of iosAdaptive) {
    console.log(`itag: ${f.itag}, mime: ${f.mime_type}, hasUrl: ${!!f.url}, cl: ${f.content_length}`);
    if (f.url) {
      const r = await fetch(f.url);
      console.log(`  fetch: ${r.status}, CL: ${r.headers.get('content-length')}`);
    }
  }
}

test();
