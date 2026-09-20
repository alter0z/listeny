import { resolveAudioStreamUrl } from './src/lib/innertube.ts';

async function test() {
  const { url } = await resolveAudioStreamUrl('u1CRhcHXJWA');
  
  // Try adding &range= as a query parameter instead of Range header
  const urlWithRange1 = `${url}&range=0-1048575`;
  const res1 = await fetch(urlWithRange1, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  console.log('URL param range=0-1048575:', res1.status, 'cl:', res1.headers.get('content-length'));
  
  const urlWithRange2 = `${url}&range=1048576-2097151`;
  const res2 = await fetch(urlWithRange2, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  console.log('URL param range=1048576-2097151:', res2.status, 'cl:', res2.headers.get('content-length'));
  
  const urlWithRange3 = `${url}&range=2097152-3145727`;
  const res3 = await fetch(urlWithRange3, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  console.log('URL param range=2097152-3145727:', res3.status, 'cl:', res3.headers.get('content-length'));
  
  const urlWithRange4 = `${url}&range=3145728-3579003`;
  const res4 = await fetch(urlWithRange4, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  console.log('URL param range=3145728-3579003:', res4.status, 'cl:', res4.headers.get('content-length'));
}

test();
