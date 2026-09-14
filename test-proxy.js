import http from 'http';
import { resolveAudioStreamUrl } from './src/lib/innertube.ts';

const CHUNK_SIZE = 1024 * 1024; // 1MB

async function handleRequest(req, res) {
  try {
    const { url, mimeType, contentLength } = await resolveAudioStreamUrl('u1CRhcHXJWA');
    const totalLength = contentLength || 3579004;

    const rangeHeader = req.headers['range'];
    console.log('Incoming request range:', rangeHeader);

    let start = 0;
    let end = totalLength - 1;

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
      if (match) {
        start = parseInt(match[1], 10);
        if (match[2]) {
          end = parseInt(match[2], 10);
        }
      }
    }

    // Clamp chunk size to googlevideo limit
    const chunkEnd = Math.min(start + CHUNK_SIZE - 1, end, totalLength - 1);
    const upstreamRange = `bytes=${start}-${chunkEnd}`;
    console.log('Upstream range requested:', upstreamRange);

    const upstreamRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Range': upstreamRange,
      }
    });

    console.log('Upstream status:', upstreamRes.status);
    console.log('Upstream headers:', Object.fromEntries(upstreamRes.headers.entries()));

    const chunkLength = chunkEnd - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${chunkEnd}/${totalLength}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkLength,
      'Content-Type': mimeType || 'audio/mp4',
      'Access-Control-Allow-Origin': '*',
    });

    const reader = upstreamRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err) {
    console.error('Error:', err);
    res.writeHead(500);
    res.end(err.message);
  }
}

const server = http.createServer(handleRequest);
server.listen(4001, () => {
  console.log('Test proxy running on http://localhost:4001');
});
