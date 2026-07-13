// Deterministic gate for the SynchPharma build. Exits nonzero unless ALL hold:
//   1. `npm run build` succeeds (tsc typecheck + vite bundle).
//   2. index.html contains all five act ids: hero, problem, spine, partners, proof.
//   3. runSim(42, 20) matches the committed test/sim-snapshot.json byte-for-byte.
//   5. Built HTML contains all five agent capability-card role lines.
//
// This is the whole point of the cheap-tier routing: procedural work is safe
// because this script — not a human — is the arbiter of "done".
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { loadEngine } from './load-engine.mjs'

const failures = []
const ok = (msg) => console.log(`  ok   ${msg}`)
const bad = (msg) => {
  console.log(`  FAIL ${msg}`)
  failures.push(msg)
}

// ---- 1. build succeeds -----------------------------------------------------
console.log('[1/5] build')
try {
  execSync('npm run build', { stdio: 'pipe' })
  ok('npm run build')
} catch (err) {
  const out = (err.stdout?.toString() || '') + (err.stderr?.toString() || '')
  bad('npm run build failed:\n' + out.split('\n').slice(-25).join('\n'))
}

// ---- 2. all five act ids present in index.html -----------------------------
console.log('[2/5] act ids in index.html')
const ACT_IDS = ['hero', 'problem', 'spine', 'partners', 'proof']
let indexHtml = ''
try {
  indexHtml = readFileSync('index.html', 'utf8')
} catch {
  bad('could not read index.html')
}
for (const id of ACT_IDS) {
  if (indexHtml.includes(`data-act="${id}"`)) ok(`act "${id}" present`)
  else bad(`act "${id}" missing from index.html`)
}

// ---- 3. sim snapshot determinism ------------------------------------------
console.log('[3/5] sim determinism (seed 42, first 20 events)')
try {
  const { runSim } = await loadEngine()
  const snapshot = JSON.parse(readFileSync('test/sim-snapshot.json', 'utf8'))
  const fresh = runSim(snapshot.seed ?? 42, snapshot.steps ?? 20)
  const a = JSON.stringify(fresh)
  const b = JSON.stringify(snapshot.events)
  if (a === b) ok(`${fresh.length} ledger events match snapshot`)
  else {
    bad('sim output does NOT match test/sim-snapshot.json')
    const fa = fresh
    const fb = snapshot.events
    for (let i = 0; i < Math.max(fa.length, fb.length); i++) {
      if (JSON.stringify(fa[i]) !== JSON.stringify(fb[i])) {
        console.log(`       first divergence at seq ${i}:`)
        console.log(`         got      ${JSON.stringify(fa[i])}`)
        console.log(`         expected ${JSON.stringify(fb[i])}`)
        break
      }
    }
  }
} catch (err) {
  bad('sim determinism check errored: ' + err.message)
}

// ---- 4. no platform RNG under src/sim/ ------------------------------------
console.log('[4/5] no platform RNG in src/sim/')
function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}
let simClean = true
for (const file of walk('src/sim')) {
  const raw = readFileSync(file, 'utf8')
  // Strip block and line comments so a warning comment mentioning the banned
  // token by name does not itself trip the check — we forbid *use*, not mention.
  const code = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
  if (/Math\s*\.\s*random/.test(code)) {
    bad(`platform RNG (Math.random) found in ${file}`)
    simClean = false
  }
}
if (simClean) ok('src/sim/ is free of the platform RNG')

// ---- 5. capability-card role lines in built output -------------------------
console.log('[5/5] capability role lines in dist/')
const ROLE_LINES = [
  'routes work, owns the ledger view',
  'writes claims with provenance; rejects unverifiable facts',
  'handoffs to and from site & vendor systems',
  'reconciles, flags stale/colliding, quarantines',
  'reads only verified state; computes sponsor-of-choice metrics',
]
function distFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...distFiles(p))
    else if (/\.(html|js|css)$/.test(name)) out.push(p)
  }
  return out
}
let distBlob = ''
try {
  distBlob = distFiles('dist').map((f) => readFileSync(f, 'utf8')).join('\n')
  for (const line of ROLE_LINES) {
    if (distBlob.includes(line)) ok(`role line present: "${line.slice(0, 40)}…"`)
    else bad(`role line missing from dist output: "${line}"`)
  }
} catch {
  bad('could not read dist/ (build may have failed)')
}

// ---- verdict ---------------------------------------------------------------
console.log('')
if (failures.length === 0) {
  console.log('VALIDATOR: PASS')
  process.exit(0)
} else {
  console.log(`VALIDATOR: FAIL (${failures.length} problem${failures.length === 1 ? '' : 's'})`)
  process.exit(1)
}
