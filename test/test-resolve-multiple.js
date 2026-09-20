import { resolveAudioStreamUrl } from './src/lib/innertube.ts';

const testIds = [
  'u1CRhcHXJWA', // Test song from previous runs
  'kJQP7kiw5Fk', // Despacito
  'fJ9rUzIMcZQ', // Queen - Bohemian Rhapsody
  'dQw4w9WgXcQ', // Rick Astley
];

async function test() {
  for (const id of testIds) {
    console.log(`\nTesting ID: ${id}`);
    try {
      const result = await resolveAudioStreamUrl(id);
      console.log(`  MimeType: ${result.mimeType}`);
      console.log(`  ContentLength: ${result.contentLength}`);
      console.log(`  URL starts with: ${result.url.substring(0, 40)}...`);
      
      // Test full fetch status
      const resFull = await fetch(result.url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      console.log(`  Full fetch status: ${resFull.status}, Content-Length: ${resFull.headers.get('content-length')}`);
      
      // Test range request at > 1MB offset
      const resRange = await fetch(result.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Range': 'bytes=1048576-2097151'
        }
      });
      console.log(`  Range 1MB-2MB status: ${resRange.status}, Content-Length: ${resRange.headers.get('content-length')}`);
    } catch (err) {
      console.error(`  Error for ${id}:`, err.message);
    }
  }
}

test();
