#!/usr/bin/env node
/**
 * commit-gate Plugin — Shim für Shinon Slicer.
 * Die eigentliche Prosa/Footer/Bullet/Datei-Nennung Prüfung läuft im commit-msg Hook.
 * Dieses Plugin läuft im pre-commit Slice und warnt nur wenn staged Files existieren aber
 * der commit-msg Hook später greifen würde. Immer grün hier, Fail passiert in commit-msg.
 */
console.log('✅ commit-gate ok — Detailprüfung läuft im commit-msg Hook (200 Wörter, Bullets, Footer, Datei-Nennung)')
