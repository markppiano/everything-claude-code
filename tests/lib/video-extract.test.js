/**
 * Tests for scripts/lib/video-extract.js
 *
 * Run with: node tests/lib/video-extract.test.js
 */

const assert = require('assert');
const lib = require('../../scripts/lib/video-extract');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

function runTests() {
  console.log('\n=== Testing video-extract.js ===\n');

  let passed = 0;
  let failed = 0;
  const ok = (n, f) => { if (test(n, f)) passed++; else failed++; };

  console.log('computeFrameTimestamps:');

  ok('returns midpoint for single frame', () => {
    assert.deepStrictEqual(lib.computeFrameTimestamps(10, 1), [5]);
  });

  ok('returns evenly-spaced midpoints for multiple frames', () => {
    const ts = lib.computeFrameTimestamps(10, 4);
    assert.deepStrictEqual(ts, [1.25, 3.75, 6.25, 8.75]);
  });

  ok('first timestamp is never 0', () => {
    const ts = lib.computeFrameTimestamps(60, 16);
    assert.ok(ts[0] > 0);
  });

  ok('last timestamp is strictly less than duration', () => {
    const duration = 60;
    const ts = lib.computeFrameTimestamps(duration, 16);
    assert.ok(ts[ts.length - 1] < duration);
  });

  ok('rejects zero duration', () => {
    assert.throws(() => lib.computeFrameTimestamps(0, 4), /Invalid duration/);
  });

  ok('rejects negative duration', () => {
    assert.throws(() => lib.computeFrameTimestamps(-1, 4), /Invalid duration/);
  });

  ok('rejects non-integer frame count', () => {
    assert.throws(() => lib.computeFrameTimestamps(10, 1.5), /frameCount/);
  });

  ok('rejects zero frame count', () => {
    assert.throws(() => lib.computeFrameTimestamps(10, 0), /frameCount/);
  });

  console.log('\nformatTimestamp:');

  ok('formats zero seconds', () => {
    assert.strictEqual(lib.formatTimestamp(0), '00:00:00.000');
  });

  ok('formats sub-minute', () => {
    assert.strictEqual(lib.formatTimestamp(1.5), '00:00:01.500');
  });

  ok('formats minute boundary', () => {
    assert.strictEqual(lib.formatTimestamp(60), '00:01:00.000');
  });

  ok('formats hour boundary', () => {
    assert.strictEqual(lib.formatTimestamp(3661.5), '01:01:01.500');
  });

  ok('rejects negative input', () => {
    assert.throws(() => lib.formatTimestamp(-1), /Invalid seconds/);
  });

  console.log('\nparseFfprobeDuration:');

  ok('parses bare number with newline', () => {
    assert.strictEqual(lib.parseFfprobeDuration('5.123\n'), 5.123);
  });

  ok('parses with surrounding whitespace', () => {
    assert.strictEqual(lib.parseFfprobeDuration('  10.0  '), 10);
  });

  ok('rejects non-string input', () => {
    assert.throws(() => lib.parseFfprobeDuration(5), /must be a string/);
  });

  ok('rejects empty string', () => {
    assert.throws(() => lib.parseFfprobeDuration(''), /Could not parse/);
  });

  ok('rejects non-numeric string', () => {
    assert.throws(() => lib.parseFfprobeDuration('N/A'), /Could not parse/);
  });

  ok('rejects zero duration', () => {
    assert.throws(() => lib.parseFfprobeDuration('0'), /Could not parse/);
  });

  console.log('\nvalidateOptions:');

  ok('applies default frame count', () => {
    const opts = lib.validateOptions({});
    assert.strictEqual(opts.frames, lib.DEFAULT_FRAME_COUNT);
  });

  ok('preserves valid frame count', () => {
    const opts = lib.validateOptions({ frames: 8 });
    assert.strictEqual(opts.frames, 8);
  });

  ok('coerces transcribe to boolean', () => {
    const opts = lib.validateOptions({ transcribe: 1 });
    assert.strictEqual(opts.transcribe, true);
  });

  ok('rejects frames below minimum', () => {
    assert.throws(() => lib.validateOptions({ frames: 0 }), /--frames/);
  });

  ok('rejects frames above maximum', () => {
    assert.throws(() => lib.validateOptions({ frames: 1000 }), /--frames/);
  });

  ok('rejects non-string question', () => {
    assert.throws(() => lib.validateOptions({ question: 123 }), /--question/);
  });

  console.log('\nbuildManifest:');

  ok('produces expected schema and shape', () => {
    const manifest = lib.buildManifest({
      videoPath: '/tmp/foo.mp4',
      durationSec: 10,
      frames: [
        { index: 1, timestampSec: 2.5, path: '/tmp/out/frame-1.jpg' },
        { index: 2, timestampSec: 7.5, path: '/tmp/out/frame-2.jpg' }
      ],
      transcriptPath: null,
      question: 'what happens',
      generatedAt: '2024-01-01T00:00:00.000Z'
    });
    assert.strictEqual(manifest.schema, 'ecc.video-analysis/1');
    assert.strictEqual(manifest.video.basename, 'foo.mp4');
    assert.strictEqual(manifest.video.durationSec, 10);
    assert.strictEqual(manifest.frames.length, 2);
    assert.strictEqual(manifest.frames[0].timestamp, '00:00:02.500');
    assert.strictEqual(manifest.transcriptPath, null);
    assert.strictEqual(manifest.question, 'what happens');
  });

  ok('requires videoPath', () => {
    assert.throws(() => lib.buildManifest({ durationSec: 10, frames: [] }), /videoPath/);
  });

  ok('requires positive duration', () => {
    assert.throws(
      () => lib.buildManifest({ videoPath: '/x.mp4', durationSec: 0, frames: [] }),
      /durationSec/
    );
  });

  ok('requires frames array', () => {
    assert.throws(
      () => lib.buildManifest({ videoPath: '/x.mp4', durationSec: 10, frames: 'nope' }),
      /frames must be an array/
    );
  });

  console.log('\n--------------------------------');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) process.exit(1);
}

runTests();
