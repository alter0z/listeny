import { resolveAudioStreamUrl } from './src/lib/innertube.ts';

async function test() {
  // Get two fresh URLs
  const result1 = await resolveAudioStreamUrl('u1CRhcHXJWA');
  console.log('URL 1 resolved');
  
  // First chunk from URL 1
  const res1 = await fetch(result1.url, {
    headers: { 
      'User-Agent': 'Mozilla/5.0',
      'Range': 'bytes=0-1048575' 
    }
  });
  console.log('URL1, chunk 0-1M:', res1.status);
  
  // Second chunk from same URL 1
  const res2 = await fetch(result1.url, {
    headers: { 
      'User-Agent': 'Mozilla/5.0',
      'Range': 'bytes=1048576-2097151' 
    }
  });
  console.log('URL1, chunk 1M-2M:', res2.status);
  
  // Second chunk from a FRESH URL 2
  const result2 = await resolveAudioStreamUrl('u1CRhcHXJWA');
  console.log('URL 2 resolved');
  const res3 = await fetch(result2.url, {
    headers: { 
      'User-Agent': 'Mozilla/5.0',
      'Range': 'bytes=1048576-2097151' 
    }
  });
  console.log('URL2, chunk 1M-2M:', res3.status);
}

test();
