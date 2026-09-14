import { resolveAudioStreamUrl } from './src/lib/innertube.ts';
async function test() {
  const { url } = await resolveAudioStreamUrl('u1CRhcHXJWA');
  const res = await fetch(url, { headers: { 'Range': 'bytes=0-10000000' } });
  console.log('Range 0-10,000,000 status:', res.status);
  
  const res2 = await fetch(url, { headers: { 'Range': 'bytes=0-9999999' } });
  console.log('Range 0-9,999,999 status:', res2.status);
}
test();
