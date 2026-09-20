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
  
  const itag140 = allFormats.find(f => f.itag === 140);
  let url140 = itag140.url || await itag140.decipher(yt.session.player);
  
  // Test 1: Add ratebypass=yes
  const urlObj = new URL(url140);
  urlObj.searchParams.set('ratebypass', 'yes');
  const modifiedUrl1 = urlObj.toString();
  
  const r1 = await fetch(modifiedUrl1);
  console.log('itag140 + ratebypass=yes:', r1.status, 'CL:', r1.headers.get('content-length'));
  
  // Test 2: Remove gir and clen params
  const urlObj2 = new URL(url140);
  urlObj2.searchParams.delete('gir');
  urlObj2.searchParams.delete('clen');
  urlObj2.searchParams.set('ratebypass', 'yes');
  const modifiedUrl2 = urlObj2.toString();
  
  const r2 = await fetch(modifiedUrl2);
  console.log('itag140 + ratebypass, -gir -clen:', r2.status, 'CL:', r2.headers.get('content-length'));
  
  // Test 3: Just remove gir
  const urlObj3 = new URL(url140);
  urlObj3.searchParams.delete('gir');
  const modifiedUrl3 = urlObj3.toString();
  
  const r3 = await fetch(modifiedUrl3);
  console.log('itag140 - gir:', r3.status, 'CL:', r3.headers.get('content-length'));
  
  // Test 4: Add cnr=14 (like itag 18 has)
  const urlObj4 = new URL(url140);
  urlObj4.searchParams.set('cnr', '14');
  urlObj4.searchParams.set('ratebypass', 'yes');
  const modifiedUrl4 = urlObj4.toString();
  
  const r4 = await fetch(modifiedUrl4);
  console.log('itag140 + cnr=14 + ratebypass:', r4.status, 'CL:', r4.headers.get('content-length'));
  
  // Test 5: Keep original URL, just use Range: bytes=0- (open-ended)
  const r5 = await fetch(url140, { headers: { Range: 'bytes=0-' }});
  console.log('itag140 Range bytes=0-:', r5.status, 'CL:', r5.headers.get('content-length'));
  
  // Test 6: Original URL + &range=0-3579003 (whole file as URL param)
  const urlObj6 = new URL(url140);
  urlObj6.searchParams.set('range', '0-3579003');
  const r6 = await fetch(urlObj6.toString());
  console.log('itag140 &range=0-3579003:', r6.status, 'CL:', r6.headers.get('content-length'));
  
  // Test 7: Original URL + Range: bytes=0-3579003 header
  const r7 = await fetch(url140, { headers: { Range: 'bytes=0-3579003' }});
  console.log('itag140 Range bytes=0-3579003:', r7.status, 'CL:', r7.headers.get('content-length'));
}

test();
