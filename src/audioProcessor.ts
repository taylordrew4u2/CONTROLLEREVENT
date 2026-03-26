/**
 * Audio fade processor using Web Audio API OfflineAudioContext.
 * Bakes smooth fade-in and fade-out directly into the audio data
 * so playback always includes fades with zero runtime overhead.
 */

export interface FadeSettings {
  fadeInDuration: number; // seconds
  fadeOutDuration: number; // seconds
}

const DEFAULT_FADE: FadeSettings = { fadeInDuration: 2, fadeOutDuration: 3 };

/** Read fade settings from localStorage, falling back to defaults. */
export function getFadeSettings(): FadeSettings {
  const raw = localStorage.getItem("appSettings");
  if (raw) {
    try {
      const s = JSON.parse(raw);
      return {
        fadeInDuration: s.audioFadeInDuration ?? DEFAULT_FADE.fadeInDuration,
        fadeOutDuration: s.audioFadeOutDuration ?? DEFAULT_FADE.fadeOutDuration,
      };
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_FADE;
}

/**
 * Process an audio File to bake in fade-in and fade-out.
 * Returns a new WAV Blob with the fades applied.
 */
export async function processAudioWithFades(
  file: File,
  settings?: FadeSettings,
): Promise<Blob> {
  const fade = settings ?? getFadeSettings();
  const arrayBuffer = await file.arrayBuffer();

  const audioCtx = new OfflineAudioContext(2, 1, 44100); // temp context for decoding
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);

  const sampleRate = decoded.sampleRate;
  const numChannels = decoded.numberOfChannels;
  const totalSamples = decoded.length;

  // Clamp fade durations so they don't exceed half the track
  const maxFade = totalSamples / sampleRate / 2;
  const fadeInSec = Math.min(fade.fadeInDuration, maxFade);
  const fadeOutSec = Math.min(fade.fadeOutDuration, maxFade);

  const fadeInSamples = Math.floor(fadeInSec * sampleRate);
  const fadeOutSamples = Math.floor(fadeOutSec * sampleRate);
  const fadeOutStart = totalSamples - fadeOutSamples;

  // Copy channel data and apply fades in place
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    const data = new Float32Array(decoded.getChannelData(ch));
    channels.push(data);
  }

  for (let ch = 0; ch < numChannels; ch++) {
    const data = channels[ch];

    // Fade-in: equal-power curve (square root) for smoothness
    for (let i = 0; i < fadeInSamples; i++) {
      const t = i / fadeInSamples;
      data[i] *= Math.sqrt(t);
    }

    // Fade-out: equal-power curve
    for (let i = 0; i < fadeOutSamples; i++) {
      const idx = fadeOutStart + i;
      const t = 1 - i / fadeOutSamples;
      data[idx] *= Math.sqrt(t);
    }
  }

  // Encode to WAV
  return encodeWAV(channels, sampleRate, numChannels);
}

/** Encode Float32Array channels into a WAV Blob. */
function encodeWAV(
  channels: Float32Array[],
  sampleRate: number,
  numChannels: number,
): Blob {
  const totalSamples = channels[0].length;

  // Interleave channels
  const interleaved = new Float32Array(totalSamples * numChannels);
  for (let i = 0; i < totalSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      interleaved[i * numChannels + ch] = channels[ch][i];
    }
  }

  // Convert to 16-bit PCM
  const pcm = new Int16Array(interleaved.length);
  for (let i = 0; i < interleaved.length; i++) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = pcm.length * 2;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // PCM samples
  const pcmBytes = new Uint8Array(buffer, headerSize);
  const pcmView = new Uint8Array(pcm.buffer);
  pcmBytes.set(pcmView);

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
