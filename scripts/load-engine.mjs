// Bundle the TypeScript sim engine to ESM with esbuild (a Vite dependency) and
// import it into Node so both the snapshot writer and the validator run the
// exact same code the browser bundle will.
import { build } from 'esbuild'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export async function loadEngine() {
  const result = await build({
    entryPoints: ['src/sim/engine.ts'],
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
  })
  const code = result.outputFiles[0].text
  const tmp = join(tmpdir(), `synch-pharma-engine-${process.pid}.mjs`)
  writeFileSync(tmp, code)
  return import(pathToFileURL(tmp).href)
}
