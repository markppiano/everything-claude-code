/**
 * Tests for scripts/bundle-marketing-skills.js
 *
 * Verifies the bundler picks the right entries from skills-lock.json and
 * produces a zip per selected skill containing SKILL.md at the archive root.
 *
 * Run with: node tests/scripts/bundle-marketing-skills.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  bundleMarketingSkills,
  selectSkills,
  readLockFile,
} = require('../../scripts/bundle-marketing-skills');

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

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-marketing-skills-'));
  const skillsRoot = path.join(root, '.agents', 'skills');
  fs.mkdirSync(skillsRoot, { recursive: true });

  function makeSkill(name, withReferences) {
    const dir = path.join(skillsRoot, name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\nname: ${name}\n---\n# ${name}\n`);
    if (withReferences) {
      fs.mkdirSync(path.join(dir, 'references'));
      fs.writeFileSync(path.join(dir, 'references', 'notes.md'), '# notes\n');
    }
    fs.mkdirSync(path.join(dir, 'evals'));
    fs.writeFileSync(path.join(dir, 'evals', 'evals.json'), '{}\n');
  }

  makeSkill('marketing-one', true);
  makeSkill('marketing-two', false);
  makeSkill('unrelated-skill', true);

  const lock = {
    version: 1,
    skills: {
      'marketing-one': {
        source: 'coreyhaines31/marketingskills',
        sourceType: 'github',
        skillPath: 'skills/marketing-one/SKILL.md',
        computedHash: 'a',
      },
      'marketing-two': {
        source: 'coreyhaines31/marketingskills',
        sourceType: 'github',
        skillPath: 'skills/marketing-two/SKILL.md',
        computedHash: 'b',
      },
      'unrelated-skill': {
        source: 'someone-else/otherpack',
        sourceType: 'github',
        skillPath: 'skills/unrelated-skill/SKILL.md',
        computedHash: 'c',
      },
    },
  };
  const lockPath = path.join(root, 'skills-lock.json');
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));

  return {
    root,
    lockPath,
    skillsRoot,
    outDir: path.join(root, 'dist', 'marketing-skill-zips'),
    cleanup: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

function listZipEntries(zipPath) {
  const result = spawnSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`unzip failed: ${result.stderr || result.status}`);
  }
  return result.stdout.split('\n').map(l => l.trim()).filter(Boolean);
}

function runTests() {
  console.log('\n=== Testing bundle-marketing-skills.js ===\n');

  let passed = 0;
  let failed = 0;
  const skipZipTests = os.platform() === 'win32' || !spawnSync('which', ['zip']).stdout;

  console.log('selectSkills():');

  if (test('returns only entries matching the requested source, sorted', () => {
    const skills = {
      gamma: { source: 'src-a' },
      alpha: { source: 'src-a' },
      beta: { source: 'src-b' },
    };
    assert.deepStrictEqual(selectSkills(skills, 'src-a'), ['alpha', 'gamma']);
  })) passed++; else failed++;

  if (test('returns empty array when no entries match', () => {
    const skills = { x: { source: 'a' } };
    assert.deepStrictEqual(selectSkills(skills, 'z'), []);
  })) passed++; else failed++;

  if (test('skips entries whose value is null/undefined', () => {
    const skills = { good: { source: 'src' }, bad: null };
    assert.deepStrictEqual(selectSkills(skills, 'src'), ['good']);
  })) passed++; else failed++;

  console.log('\nreadLockFile():');

  if (test('throws on a lock file missing the skills key', () => {
    const tmp = path.join(os.tmpdir(), `lock-${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify({ version: 1 }));
    try {
      assert.throws(() => readLockFile(tmp), /missing "skills" object/);
    } finally {
      fs.rmSync(tmp);
    }
  })) passed++; else failed++;

  if (test('parses a valid lock file and returns the skills object', () => {
    const tmp = path.join(os.tmpdir(), `lock-${Date.now()}-2.json`);
    fs.writeFileSync(tmp, JSON.stringify({ version: 1, skills: { a: { source: 's' } } }));
    try {
      const skills = readLockFile(tmp);
      assert.deepStrictEqual(skills, { a: { source: 's' } });
    } finally {
      fs.rmSync(tmp);
    }
  })) passed++; else failed++;

  console.log('\nbundleMarketingSkills() — integration:');

  if (skipZipTests) {
    console.log('  (skipped on this platform — zip/unzip not available)');
  } else {
    const fx = makeFixture();
    try {
      const result = bundleMarketingSkills({
        repoRoot: fx.root,
        lockPath: fx.lockPath,
        skillsRoot: fx.skillsRoot,
        outDir: fx.outDir,
      });

      if (test('selects only skills sourced from coreyhaines31/marketingskills', () => {
        assert.deepStrictEqual(result.selected, ['marketing-one', 'marketing-two']);
      })) passed++; else failed++;

      if (test('writes one zip per selected skill', () => {
        assert.strictEqual(result.created.length, 2);
        const names = fs.readdirSync(fx.outDir).sort();
        assert.deepStrictEqual(names, ['marketing-one.zip', 'marketing-two.zip']);
      })) passed++; else failed++;

      if (test('skips unrelated skills (no zip for unrelated-skill)', () => {
        assert.ok(!fs.existsSync(path.join(fx.outDir, 'unrelated-skill.zip')));
      })) passed++; else failed++;

      if (test('zip contains SKILL.md at archive root (no path prefix)', () => {
        const entries = listZipEntries(path.join(fx.outDir, 'marketing-one.zip'));
        assert.ok(entries.includes('SKILL.md'),
          `Expected SKILL.md at root, got entries: ${entries.join(', ')}`);
      })) passed++; else failed++;

      if (test('zip includes references/ when the skill has them', () => {
        const entries = listZipEntries(path.join(fx.outDir, 'marketing-one.zip'));
        assert.ok(entries.some(e => e.startsWith('references/')),
          `Expected references/ in archive, got: ${entries.join(', ')}`);
      })) passed++; else failed++;

      if (test('zip excludes evals/ (claude.ai does not need it)', () => {
        const entries = listZipEntries(path.join(fx.outDir, 'marketing-one.zip'));
        assert.ok(!entries.some(e => e.startsWith('evals/')),
          `Expected no evals/ in archive, got: ${entries.join(', ')}`);
      })) passed++; else failed++;

      if (test('handles a skill with no references/ folder gracefully', () => {
        const entries = listZipEntries(path.join(fx.outDir, 'marketing-two.zip'));
        assert.ok(entries.includes('SKILL.md'));
        assert.ok(!entries.some(e => e.startsWith('references/')),
          'marketing-two has no references; archive should not contain that dir');
      })) passed++; else failed++;

      if (test('reports missing skills when lock entry has no SKILL.md on disk', () => {
        const fx2 = makeFixture();
        try {
          fs.rmSync(path.join(fx2.skillsRoot, 'marketing-one'), { recursive: true });
          const r = bundleMarketingSkills({
            repoRoot: fx2.root,
            lockPath: fx2.lockPath,
            skillsRoot: fx2.skillsRoot,
            outDir: fx2.outDir,
          });
          assert.deepStrictEqual(r.missing, ['marketing-one']);
          assert.strictEqual(r.created.length, 1);
        } finally {
          fx2.cleanup();
        }
      })) passed++; else failed++;
    } finally {
      fx.cleanup();
    }
  }

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
