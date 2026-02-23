// Cache: cacheKey -> Float32Array of normalized RMS values (0..1)
const waveformCache = new Map<string, Float32Array>();
// In-flight requests: avoid duplicate fetches for the same audio
const waveformPending = new Map<string, Promise<Float32Array>>();

/**
 * Extract waveform amplitude data from an audio source.
 * Returns a Float32Array of `samplesCount` normalized RMS values (0..1).
 * Results are cached by src + samplesCount.
 */
export function extractWaveform(src: string, samplesCount: number): Promise<Float32Array> {
  const cacheKey = `${src}:${samplesCount}`;

  const cached = waveformCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  const pending = waveformPending.get(cacheKey);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();

      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContext.close();

      // Mix all channels to mono
      const length = audioBuffer.length;
      const mono = new Float32Array(length);
      const numChannels = audioBuffer.numberOfChannels;
      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = audioBuffer.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          mono[i] += channelData[i] / numChannels;
        }
      }

      // Downsample to RMS values
      const samplesPerBucket = Math.floor(length / samplesCount);
      if (samplesPerBucket < 1) {
        const result = new Float32Array(samplesCount);
        waveformCache.set(cacheKey, result);
        return result;
      }

      const result = new Float32Array(samplesCount);
      let maxRms = 0;

      for (let i = 0; i < samplesCount; i++) {
        const start = i * samplesPerBucket;
        const end = Math.min(start + samplesPerBucket, length);
        let sumSquares = 0;
        for (let j = start; j < end; j++) {
          sumSquares += mono[j] * mono[j];
        }
        const rms = Math.sqrt(sumSquares / (end - start));
        result[i] = rms;
        if (rms > maxRms) maxRms = rms;
      }

      // Normalize to 0..1
      if (maxRms > 0) {
        for (let i = 0; i < samplesCount; i++) {
          result[i] /= maxRms;
        }
      }

      waveformCache.set(cacheKey, result);
      return result;
    } finally {
      waveformPending.delete(cacheKey);
    }
  })();

  waveformPending.set(cacheKey, promise);
  return promise;
}
