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
  const allFormats = [...(info.streaming_data?.formats || []), ...(info.streaming_data?.adaptive_formats || [])];
  
  // Get itag 18 (muxed)
  const itag18 = allFormats.find(f => f.itag === 18);
  if (!itag18) {
    console.log('itag 18 not found');
    return;
  }
  
  let url = itag18.url;
  if (!url) url = await itag18.decipher(yt.session.player);
  
  console.log('itag 18 url length:', url.length);
  console.log('Content-Length:', itag18.content_length);
  console.log('Mime:', itag18.mime_type);
  
  // Test: full fetch
  const r1 = await fetch(url);
  console.log('\nFull fetch:', r1.status, 'CL:', r1.headers.get('content-length'));
  
  // Test: Range 0-1MB
  const r2 = await fetch(url, { headers: { 'Range': 'bytes=0-1048575' }});
  console.log('Range 0-1MB:', r2.status, 'CL:', r2.headers.get('content-length'));
  
  // Test: Range 1MB-2MB
  const r3 = await fetch(url, { headers: { 'Range': 'bytes=1048576-2097151' }});
  console.log('Range 1MB-2MB:', r3.status, 'CL:', r3.headers.get('content-length'));
  
  // Test: Range 5MB-6MB
  const r4 = await fetch(url, { headers: { 'Range': 'bytes=5242880-6291455' }});
  console.log('Range 5MB-6MB:', r4.status, 'CL:', r4.headers.get('content-length'));
  
  // Now test the audio-only itag 140 to understand the difference
  const itag140 = allFormats.find(f => f.itag === 140);
  let url140 = itag140.url;
  if (!url140) url140 = await itag140.decipher(yt.session.player);
  
  console.log('\n--- itag 140 URL comparison ---');
  const u18 = new URL(url);
  const u140 = new URL(url140);
  
  // Compare important params
  const paramsToCheck = ['n', 'c', 'ump', 'rqh', 'source', 'itag', 'requiressl', 'gcr'];
  for (const p of paramsToCheck) {
    console.log(`${p}: itag18=${u18.searchParams.get(p)} | itag140=${u140.searchParams.get(p)}`);
  }
  
  // Check all params that differ
  const allParams = new Set([...u18.searchParams.keys(), ...u140.searchParams.keys()]);
  console.log('\nDifferent params:');
  for (const p of allParams) {
    if (u18.searchParams.get(p) !== u140.searchParams.get(p)) {
      console.log(`  ${p}: itag18=${u18.searchParams.get(p)?.substring(0,50)} | itag140=${u140.searchParams.get(p)?.substring(0,50)}`);
    }
  }
}

test();
