#!/usr/bin/env node
/**
 * Extract frames + optional transcript from a video so Claude Code can "watch" it.
 *
 * Usage:
 *   node scripts/video-analysis/extract.js <video> [--frames N] [--out DIR]
 *                                          [--transcribe] [--question "..."]
 *
 * Requires: ffmpeg, ffprobe.  Optional: whisper (for --transcribe).
 *
 * Output: <out>/manifest.json + <out>/frame-NN.jpg.  Read these with the
 * Claude Code Read tool to "watch" the video.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const lib = require('../lib/video-extract');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--frames') args.frames = parseInt(argv[++i], 10);
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--transcribe') args.transcribe = true;
    else if (a === '--question') args.question = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
    else args._.push(a);
  }
  return args;
}

function printHelp() {
  console.log(`Usage: extract.js <video> [--frames N] [--out DIR] [--transcribe] [--question "..."]

Options:
  --frames N        Number of frames to sample (default ${lib.DEFAULT_FRAME_COUNT}, max ${lib.MAX_FRAMES})
  --out DIR         Output directory (default .video-analysis/<basename>)
  --transcribe      Also transcribe audio with whisper if available
  --question "..."  Question to embed in manifest (Claude reads this)
  -h, --help        Show this help

Requires ffmpeg + ffprobe on PATH.`);
}

function which(cmd) {
  const finder = process.platform === 'win32' ? 'where' : 'which';
  const r = spawnSync(finder, [cmd], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  const line = (r.stdout || '').trim().split(/\r?\n/)[0];
  return line || null;
}

function probeDuration(videoPath) {
  const out = execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1',
    videoPath
  ], { encoding: 'utf8' });
  return lib.parseFfprobeDuration(out);
}

function extractFrame(videoPath, timestampSec, outPath) {
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-ss', String(timestampSec),
    '-i', videoPath,
    '-frames:v', '1',
    '-q:v', '3',
    outPath
  ]);
}

function transcribe(videoPath, outDir) {
  if (!which('whisper')) return null;
  const r = spawnSync('whisper', [
    videoPath,
    '--output_dir', outDir,
    '--output_format', 'txt'
  ], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  const base = path.basename(videoPath, path.extname(videoPath));
  const guess = path.join(outDir, `${base}.txt`);
  return fs.existsSync(guess) ? guess : null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (args._.length === 0) {
    printHelp();
    process.exit(1);
  }

  const videoPath = path.resolve(args._[0]);
  if (!fs.existsSync(videoPath)) {
    console.error(`[video-analysis] Video not found: ${videoPath}`);
    process.exit(2);
  }

  if (!which('ffmpeg') || !which('ffprobe')) {
    console.error('[video-analysis] ffmpeg and ffprobe are required on PATH. Install ffmpeg.');
    process.exit(3);
  }

  const opts = lib.validateOptions({
    frames: args.frames,
    transcribe: !!args.transcribe,
    question: args.question
  });

  const baseName = path.basename(videoPath, path.extname(videoPath));
  const outDir = path.resolve(args.out || path.join('.video-analysis', baseName));
  fs.mkdirSync(outDir, { recursive: true });

  const durationSec = probeDuration(videoPath);
  const timestamps = lib.computeFrameTimestamps(durationSec, opts.frames);

  const frames = [];
  const pad = String(timestamps.length).length;
  timestamps.forEach((ts, i) => {
    const frameName = `frame-${String(i + 1).padStart(pad, '0')}.jpg`;
    const framePath = path.join(outDir, frameName);
    extractFrame(videoPath, ts, framePath);
    frames.push({ index: i + 1, timestampSec: ts, path: framePath });
    process.stderr.write(`  extracted ${frameName} @ ${lib.formatTimestamp(ts)}\n`);
  });

  let transcriptPath = null;
  if (opts.transcribe) {
    transcriptPath = transcribe(videoPath, outDir);
    if (!transcriptPath) {
      process.stderr.write('  transcription requested but whisper not found or failed; skipping\n');
    }
  }

  const manifest = lib.buildManifest({
    videoPath,
    durationSec,
    frames,
    transcriptPath,
    question: opts.question
  });

  const manifestPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(JSON.stringify({
    ok: true,
    manifest: manifestPath,
    framesDir: outDir,
    frameCount: frames.length,
    durationSec,
    transcriptPath
  }, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`[video-analysis] ${err.message}`);
    process.exit(1);
  }
}

module.exports = { parseArgs };
