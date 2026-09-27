#!/usr/bin/env node
/** Gemeinsame Source-Erkennung und LOC-Zählung für Shinon-Gates. */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { POLICY } from '../policy.mjs'

export const SOURCE_EXTS = new Set(POLICY.source.extensions)
export const IGNORE_DIRS = new Set(POLICY.source.ignoreDirectories)

/**
 * Sammelt rekursiv alle Dateien der konfigurierten Endungen.
 * @param {string[]} roots
 * @param {{ extensions?: Set<string>, ignore?: Set<string> }} [options]
 * @returns {string[]}
 */
export function collectSourceFiles(roots, options = {}) {
  const extensions = options.extensions || SOURCE_EXTS
  const ignored = options.ignore || IGNORE_DIRS
  /** @type {string[]} */
  const files = []
  /** @param {string} dir */
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

/**
 * @param {string} root
 * @param {string} file
 * @returns {string}
 */
export function relativePath(root, file) {
  return path.relative(root, file).replaceAll(path.sep, '/')
}

/**
 * Ersetzt Kommentare durch Leerzeichen; Zeilen und Spalten bleiben stehen.
 * @param {string} content
 * @returns {string}
 */
export function stripComments(content) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    content,
  )
  /** @type {number[]} */
  const substitutionBraces = []
  let stripped = ''
  let cursor = 0
  let token = scanner.scan()
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const text = content.slice(cursor, scanner.getTextPos())
    cursor = scanner.getTextPos()
    stripped +=
      token === ts.SyntaxKind.SingleLineCommentTrivia ||
      token === ts.SyntaxKind.MultiLineCommentTrivia
        ? text.replaceAll(/[^\n]/g, ' ')
        : text
    if (token === ts.SyntaxKind.TemplateHead) {
      substitutionBraces.push(0)
    } else if (token === ts.SyntaxKind.TemplateMiddle) {
      substitutionBraces[substitutionBraces.length - 1] = 0
    } else if (token === ts.SyntaxKind.TemplateTail) {
      substitutionBraces.pop()
    } else if (
      token === ts.SyntaxKind.OpenBraceToken &&
      substitutionBraces.length
    ) {
      substitutionBraces[substitutionBraces.length - 1] += 1
    } else if (
      token === ts.SyntaxKind.CloseBraceToken &&
      substitutionBraces.length
    ) {
      const top = substitutionBraces.length - 1
      if (substitutionBraces[top] > 0) substitutionBraces[top] -= 1
      else {
        // Ohne diesen Rescan hält der Scanner den Rest der Datei für
        // Template-Text und erkennt darin keinen Kommentar mehr.
        token = scanner.reScanTemplateToken(false)
        continue
      }
    }
    token = scanner.scan()
  }
  return stripped + content.slice(cursor)
}

/**
 * @param {string} content
 * @returns {number}
 */
export function countCodeLines(content) {
  return stripComments(content)
    .split('\n')
    .filter((line) => line.trim().length > 0).length
}
