import vm from 'node:vm';
import { Innertube, UniversalCache, Platform, ClientType } from 'youtubei.js';

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

const videoId = 'u1CRhcHXJWA';

async function testClient(clientType, name) {
  console.log(`\n=== Testing Client: ${name} ===`);
  try {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      client_type: clientType,
    });

    // Try getBasicInfo or getInfo
    let info;
    try {
      info = await yt.getBasicInfo(videoId);
      console.log(`getBasicInfo succeeded`);
    } catch (e) {
      console.log(`getBasicInfo failed: ${e.message}`);
    }

    if (info) {
      const formats = info.streaming_data?.adaptive_formats || [];
      const audioFormats = formats.filter(f => f.mime_type?.includes('audio'));
      console.log(`Audio formats found: ${audioFormats.length}`);
      
      for (const f of audioFormats) {
        console.log(`- itag: ${f.itag}, mime: ${f.mime_type}, bitrate: ${f.bitrate}, contentLength: ${f.content_length}, hasUrl: ${!!f.url}, hasSignature: ${!!f.signature_cipher || !!f.cipher}`);
        
        // Try to get deciphered/direct url
        let streamUrl = f.url;
        if (!streamUrl) {
          try {
            streamUrl = await f.decipher(yt.session.player);
          } catch (err) {
            console.log(`  Decipher error: ${err.message}`);
          }
        }
        
        if (streamUrl) {
          // Test fetching full audio or offset > 1MB
          try {
            const resFull = await fetch(streamUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            console.log(`  Fetch without Range header: ${resFull.status}, contentLength: ${resFull.headers.get('content-length')}`);
            
            const resRange = await fetch(streamUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=1500000-1600000' }
            });
            console.log(`  Fetch Range 1.5MB-1.6MB: ${resRange.status}, contentLength: ${resRange.headers.get('content-length')}`);
          } catch (fetchErr) {
            console.log(`  Fetch error: ${fetchErr.message}`);
          }
        }
      }
    }
  } catch (err) {
    console.error(`Client ${name} initialization/test failed:`, err.message);
  }
}

async function main() {
  await testClient(ClientType.IOS, 'IOS');
  await testClient(ClientType.ANDROID, 'ANDROID');
  await testClient(ClientType.TV, 'TV');
  await testClient(ClientType.TV_EMBEDDED, 'TV_EMBEDDED');
  await testClient(ClientType.WEB, 'WEB');
  await testClient(ClientType.WEB_EMBEDDED, 'WEB_EMBEDDED');
}

main();
