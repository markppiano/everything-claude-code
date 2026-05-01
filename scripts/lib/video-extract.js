/**
 * Pure helpers for the video-analysis CLI.
 *
 * Frame timestamp math, manifest construction, option validation.
 * No I/O, no child processes — keep this file testable.
 */

const path = require('path');

const DEFAULT_FRAME_COUNT = 16;
const MIN_FRAMES = 1;
const MAX_FRAMES = 256;

function computeFrameTimestamps(durationSec, frameCount) {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new Error(`Invalid duration: ${durationSec}`);
  }
  if (!Number.isInteger(frameCount) || frameCount < MIN_FRAMES) {
    throw new Error(`frameCount must be an integer >= ${MIN_FRAMES}`);
  }

  if (frameCount === 1) {
    return [durationSec / 2];
  }

  // Sample at the midpoint of each evenly-sized segment so we never grab
  // exact 0 (often a black/title frame) or exact end (codec EOF issues).
  const step = durationSec / frameCount;
  const timestamps = [];
  for (let i = 0; i < frameCount; i++) {
    timestamps.push(step * (i + 0.5));
  }
  return timestamps;
}

function formatTimestamp(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error(`Invalid seconds: ${seconds}`);
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds - h * 3600 - m * 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`;
}

function parseFfprobeDuration(ffprobeStdout) {
  if (typeof ffprobeStdout !== 'string') {
    throw new Error('ffprobe output must be a string');
  }
  const trimmed = ffprobeStdout.trim();
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`Could not parse duration from ffprobe output: ${JSON.stringify(trimmed)}`);
  }
  return num;
}

function validateOptions(opts = {}) {
  const out = { ...opts };
  if (out.frames === undefined || out.frames === null) {
    out.frames = DEFAULT_FRAME_COUNT;
  }
  if (!Number.isInteger(out.frames) || out.frames < MIN_FRAMES || out.frames > MAX_FRAMES) {
    throw new Error(`--frames must be an integer between ${MIN_FRAMES} and ${MAX_FRAMES}`);
  }
  out.transcribe = !!out.transcribe;
  if (out.question !== undefined && out.question !== null && typeof out.question !== 'string') {
    throw new Error('--question must be a string');
  }
  return out;
}

function buildManifest({ videoPath, durationSec, frames, transcriptPath, question, generatedAt }) {
  if (!videoPath) throw new Error('videoPath is required');
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new Error('durationSec must be a positive number');
  }
  if (!Array.isArray(frames)) throw new Error('frames must be an array');

  return {
    schema: 'ecc.video-analysis/1',
    video: {
      path: videoPath,
      basename: path.basename(videoPath),
      durationSec
    },
    frames: frames.map(f => ({
      index: f.index,
      timestampSec: f.timestampSec,
      timestamp: formatTimestamp(f.timestampSec),
      path: f.path
    })),
    transcriptPath: transcriptPath || null,
    question: question || null,
    generatedAt: generatedAt || new Date().toISOString()
  };
}

module.exports = {
  DEFAULT_FRAME_COUNT,
  MIN_FRAMES,
  MAX_FRAMES,
  computeFrameTimestamps,
  formatTimestamp,
  parseFfprobeDuration,
  validateOptions,
  buildManifest
};
