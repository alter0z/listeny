import { resolveAudioStreamUrl } from './src/lib/innertube.ts';

const CHUNK_SIZE = 1024 * 1024; // 1MB

async function test() {
  const { url, contentLength } = await resolveAudioStreamUrl('u1CRhcHXJWA');
  const totalLength = contentLength || 3579004;
  console.log('Total length:', totalLength);

  let downloadedBytes = 0;
  let chunkIndex = 0;

  while (downloadedBytes < totalLength) {
    const start = downloadedBytes;
    const end = Math.min(start + CHUNK_SIZE - 1, totalLength - 1);
    const range = `bytes=${start}-${end}`;
    
    console.log(`Fetching chunk ${chunkIndex}: ${range} (${end - start + 1} bytes)`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Range': range,
      }
    });

    if (res.status !== 206 && res.status !== 200) {
      console.error(`Chunk ${chunkIndex} failed with status: ${res.status}`);
      break;
    }

    const buf = await res.arrayBuffer();
    downloadedBytes += buf.byteLength;
    console.log(`Chunk ${chunkIndex} received: ${buf.byteLength} bytes (total: ${downloadedBytes}/${totalLength})`);
    chunkIndex++;
  }

  console.log(`Done! Total downloaded: ${downloadedBytes} bytes`);
}

test();
