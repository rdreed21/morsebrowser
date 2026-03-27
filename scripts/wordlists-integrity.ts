/**
 * Validates that wordlists.json references real files under src/wordfiles/
 * and that every wordfile is listed (mirrors checklessons.js for CI in Vitest).
 */
import * as fs from 'fs'
import * as path from 'path'

export type WordlistsIntegrityResult = {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export function runWordlistsIntegrityCheck (rootDir: string = path.join(__dirname, '..')): WordlistsIntegrityResult {
  const errors: string[] = []
  const warnings: string[] = []

  const src = path.join(rootDir, 'src')
  const wordfilesconfigs = path.join(src, 'wordfilesconfigs')
  const wordFilesDir = path.join(src, 'wordfiles')
  const wordlistsjsonfile = path.join(wordfilesconfigs, 'wordlists.json')

  if (!fs.existsSync(wordlistsjsonfile)) {
    errors.push(`Missing wordlists.json at ${wordlistsjsonfile}`)
    return { ok: false, errors, warnings }
  }

  const wordlistsjson = JSON.parse(fs.readFileSync(wordlistsjsonfile, 'utf8')) as { fileOptions: Array<{ fileName: string, sort: number }> }

  if (!Array.isArray(wordlistsjson.fileOptions)) {
    errors.push('wordlists.json must have a fileOptions array')
    return { ok: false, errors, warnings }
  }

  const extensionOk = (s: string) => s.toUpperCase().endsWith('.TXT') || s.toUpperCase().endsWith('.JSON')

  const contents = fs.readdirSync(wordFilesDir, { withFileTypes: true })

  wordlistsjson.fileOptions.forEach((fileOption) => {
    if (!extensionOk(fileOption.fileName)) {
      warnings.push(`extension must be .json or .txt: sort:${fileOption.sort} fileName:${fileOption.fileName}`)
    }
    const targetExists = contents.find((x) => x.name === fileOption.fileName)
    if (!targetExists) {
      errors.push(`no match in wordfiles directory: sort:${fileOption.sort} fileName:${fileOption.fileName}`)
    }
  })

  contents.forEach((file) => {
    if (!extensionOk(file.name)) {
      warnings.push(`extension must be .json or .txt: /wordfiles/${file.name}`)
    }
    const targetInOptions = wordlistsjson.fileOptions.find((x) => x.fileName === file.name)
    if (!targetInOptions) {
      warnings.push(`nothing in wordlists.json references wordfiles/${file.name}`)
    }
  })

  const uniqueErrors = [...new Set(errors)]
  return { ok: uniqueErrors.length === 0, errors: uniqueErrors, warnings }
}
