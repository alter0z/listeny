import http from 'http';
import { resolveAudioStreamUrl } from './src/lib/innertube.ts';

// Test Next.js route behavior simulated in node
async function test() {
  const { url, mimeType, contentLength } = await resolveAudioStreamUrl('u1CRhcHXJWA');
  console.log('Resolved format:', { mimeType, contentLength });
  
  // Test range request like browser audio player sends
  const upstreamRes = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Range': 'bytes=0-'
    }
  });
  console.log('Upstream Range 0- status:', upstreamRes.status);
  console.log('Upstream headers:');
  for (const [k, v] of upstreamRes.headers.entries()) {
    if (['content-type', 'content-range', 'content-length', 'accept-ranges'].includes(k)) {
      console.log(`  ${k}: ${v}`);
    }
  }
}

test();
