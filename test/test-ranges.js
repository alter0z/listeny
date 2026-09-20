import { resolveAudioStreamUrl } from './src/lib/innertube.ts';

async function test() {
  const { url, contentLength } = await resolveAudioStreamUrl('u1CRhcHXJWA');
  console.log('Total:', contentLength);
  
  const end = contentLength - 1;
  const res = await fetch(url, { headers: { 'Range': `bytes=0-${end}` } });
  console.log(`Range: bytes=0-${end} => Status:`, res.status, 'Len:', res.headers.get('content-length'));
}
test();
