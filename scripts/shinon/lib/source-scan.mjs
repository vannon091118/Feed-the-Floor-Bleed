#!/usr/bin/env node
/** Gemeinsame Source-Erkennung und LOC-Zählung für Shinon-Gates. */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { POLICY } from '../policy.mjs'

export const SOURCE_EXTS = new Set(POLICY.source.extensions)
export const IGNORE_DIRS = new Set(POLICY.source.ignoreDirectories)

export function collectSourceFiles(roots, options = {}) {
  const extensions = options.extensions || SOURCE_EXTS
  const ignored = options.ignore || IGNORE_DIRS
  const files = []
  function visit(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) visit(full)
      else if (entry.isFile() && extensions.has(path.extname(entry.name)))
        files.push(full)
    }
  }
  for (const root of roots) visit(path.resolve(root))
  return files
}

export function relativePath(root, file) {
  return path.relative(root, file).replaceAll(path.sep, '/')
}

export function stripComments(content) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    content,
  )
  let stripped = ''
  let token = scanner.scan()
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const text = content.slice(scanner.getTokenPos(), scanner.getTextPos())
    stripped +=
      token === ts.SyntaxKind.SingleLineCommentTrivia ||
      token === ts.SyntaxKind.MultiLineCommentTrivia
        ? text.replaceAll(/[^\n]/g, ' ')
        : text
    token = scanner.scan()
  }
  return stripped
}

export function countCodeLines(content) {
  return stripComments(content)
    .split('\n')
    .filter((line) => line.trim().length > 0).length
}
