import { resolveAudioStreamUrl } from './src/lib/innertube.js';
console.log('Testing...');
try {
  const result = await resolveAudioStreamUrl('jNQXAC9IVRw'); // Me at the zoo (short video)
  console.log(result);
} catch (e) {
  console.error('Error:', e);
}
