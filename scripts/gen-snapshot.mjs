// Regenerate the determinism fixture. Run this ONLY when you intentionally
// change the simulation's generation order, and commit the result in the same
// change. `npm run snapshot`.
import { mkdirSync, writeFileSync } from 'node:fs'
import { loadEngine } from './load-engine.mjs'

const { runSim } = await loadEngine()
const events = runSim(42, 20)
mkdirSync('test', { recursive: true })
const payload = { seed: 42, steps: 20, events }
writeFileSync('test/sim-snapshot.json', JSON.stringify(payload, null, 2) + '\n')
console.log(`wrote test/sim-snapshot.json (${events.length} events, seed 42)`)
