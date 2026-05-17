import { createInterface } from 'node:readline'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const rl = createInterface({ input: process.stdin, output: process.stdout })

rl.question('¿Nombre del proyecto? ', (name) => {
  name = name.trim()

  if (!name) {
    console.error('❌  El nombre no puede estar vacío.')
    process.exit(1)
  }

  // package.json
  const pkgPath = resolve(root, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  pkg.name = name
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`✓  package.json  →  name: "${name}"`)

  // index.html
  const htmlPath = resolve(root, 'index.html')
  const html = readFileSync(htmlPath, 'utf-8')
  const updated = html.replace(/<title>.*?<\/title>/, `<title>${name}</title>`)
  writeFileSync(htmlPath, updated)
  console.log(`✓  index.html    →  <title>${name}</title>`)

  console.log('\n¡Listo! Ya puedes correr npm run dev 🚀')
  rl.close()
})
