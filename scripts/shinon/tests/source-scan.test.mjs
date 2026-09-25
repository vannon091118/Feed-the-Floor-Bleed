import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  collectSourceFiles,
  countCodeLines,
  stripComments,
} from '../lib/source-scan.mjs'

const temporaryRoots = []

afterEach(() => {
  for (const root of temporaryRoots.splice(0))
    fs.rmSync(root, { recursive: true, force: true })
})

function makeRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shinon-source-'))
  temporaryRoots.push(root)
  return root
}

function write(root, relativePath, content = '') {
  const file = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content, 'utf8')
  return file
}

describe('source-scan', () => {
  it('sammelt nur die konfigurierten Source-Extensions rekursiv', () => {
    const root = makeRoot()
    write(root, 'src/keep.ts', 'export const keep = 1')
    write(root, 'src/nested/also.ts', 'export const also = 1')
    write(root, 'src/skip.tsx', 'export const skip = 1')
    write(root, 'src/notes.md', '# not source')

    const files = collectSourceFiles([root], { extensions: new Set(['.ts']) })
    expect(
      files
        .map((file) => path.relative(root, file).replaceAll(path.sep, '/'))
        .sort(),
    ).toEqual(['src/keep.ts', 'src/nested/also.ts'])
  })

  it('ignoriert die zentral konfigurierten Verzeichnisse', () => {
    const root = makeRoot()
    write(root, 'src/visible.ts', 'export const visible = 1')
    write(root, 'node_modules/hidden.ts', 'export const hidden = 1')
    write(root, 'dist/hidden.ts', 'export const hidden = 1')
    write(root, 'historisch/old.ts', 'export const old = 1')

    const files = collectSourceFiles([root])
    expect(files.map((file) => path.relative(root, file))).toEqual([
      path.join('src', 'visible.ts'),
    ])
  })

  it('zählt Codezeilen ohne Kommentare und Leerzeilen', () => {
    const content = [
      'const before = 1',
      '// Kommentar',
      '/* Block',
      ' * Kommentar',
      ' */',
      'const after = 2',
      '/* Einzeiler */',
      'const final = 3',
      '',
    ].join('\n')
    expect(countCodeLines(content)).toBe(3)
  })

  it('zählt Code nach einem einzeiligen Blockkommentar und schützt Strings', () => {
    const content = [
      '/* prefix */ const first = 1',
      'const url = "https://example.invalid/a"',
      'const second = 2 // suffix',
    ].join('\n')
    expect(countCodeLines(content)).toBe(3)
    expect(stripComments(content)).toContain('https://example.invalid/a')
  })
})
