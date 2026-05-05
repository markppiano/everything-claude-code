#!/usr/bin/env node
/**
 * Bundle marketing skills into per-skill zips for upload to claude.ai.
 *
 * Reads skills-lock.json, picks skills sourced from
 * coreyhaines31/marketingskills, and writes one zip per skill to
 * dist/marketing-skill-zips/. Each zip contains SKILL.md and references/
 * at the archive root (the format claude.ai's Skills uploader expects).
 *
 * Usage: node scripts/bundle-marketing-skills.js
 *        npm run bundle:marketing-skills
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');

const DEFAULT_SOURCE = 'coreyhaines31/marketingskills';

function readLockFile(lockPath) {
  const raw = fs.readFileSync(lockPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed.skills !== 'object') {
    throw new Error(`Invalid skills-lock.json at ${lockPath}: missing "skills" object`);
  }
  return parsed.skills;
}

function selectSkills(lockSkills, source) {
  return Object.entries(lockSkills)
    .filter(([, entry]) => entry && entry.source === source)
    .map(([name]) => name)
    .sort();
}

function zipSkillUnix(skillDir, outZip) {
  const result = spawnSync(
    'zip',
    ['-r', '-q', outZip, 'SKILL.md', 'references'],
    { cwd: skillDir, stdio: ['ignore', 'pipe', 'pipe'] }
  );
  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString() : '';
    throw new Error(`zip failed for ${skillDir}: ${stderr.trim() || result.status}`);
  }
}

function zipSkillWindows(skillDir, outZip) {
  const items = ['SKILL.md', 'references']
    .filter(rel => fs.existsSync(path.join(skillDir, rel)))
    .map(rel => `'${path.join(skillDir, rel).replace(/'/g, "''")}'`)
    .join(',');
  const cmd = `Compress-Archive -Path ${items} -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
  const result = spawnSync('powershell', ['-NoProfile', '-Command', cmd], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString() : '';
    throw new Error(`Compress-Archive failed for ${skillDir}: ${stderr.trim() || result.status}`);
  }
}

function zipSkill(skillDir, outZip) {
  if (fs.existsSync(outZip)) fs.rmSync(outZip);
  if (os.platform() === 'win32') {
    zipSkillWindows(skillDir, outZip);
  } else {
    zipSkillUnix(skillDir, outZip);
  }
}

function bundleMarketingSkills(options = {}) {
  const repoRoot = options.repoRoot || path.resolve(__dirname, '..');
  const lockPath = options.lockPath || path.join(repoRoot, 'skills-lock.json');
  const skillsRoot = options.skillsRoot || path.join(repoRoot, '.agents', 'skills');
  const outDir = options.outDir || path.join(repoRoot, 'dist', 'marketing-skill-zips');
  const source = options.source || DEFAULT_SOURCE;

  const lockSkills = readLockFile(lockPath);
  const selected = selectSkills(lockSkills, source);

  fs.mkdirSync(outDir, { recursive: true });

  const created = [];
  const missing = [];
  for (const name of selected) {
    const skillDir = path.join(skillsRoot, name);
    if (!fs.existsSync(path.join(skillDir, 'SKILL.md'))) {
      missing.push(name);
      continue;
    }
    const outZip = path.join(outDir, `${name}.zip`);
    zipSkill(skillDir, outZip);
    created.push(outZip);
  }

  return { created, missing, source, outDir, selected };
}

function main() {
  let result;
  try {
    result = bundleMarketingSkills();
  } catch (err) {
    console.error(`[bundle-marketing-skills] ${err.message}`);
    process.exit(1);
  }

  const { created, missing, source, outDir, selected } = result;
  console.log(`[bundle-marketing-skills] source: ${source}`);
  console.log(`[bundle-marketing-skills] selected ${selected.length} skills, wrote ${created.length} zips`);
  console.log(`[bundle-marketing-skills] output: ${outDir}`);
  if (missing.length) {
    console.warn(`[bundle-marketing-skills] missing SKILL.md for: ${missing.join(', ')}`);
  }
  console.log('');
  console.log('Next: upload each zip to claude.ai → Settings → Capabilities → Skills.');
}

module.exports = { bundleMarketingSkills, selectSkills, readLockFile };

if (require.main === module) {
  main();
}
