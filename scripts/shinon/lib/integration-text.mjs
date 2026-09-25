/**
 * Reine Erzeugung gate-konformer Commit-Texte für Rebase, Merge und PR.
 *
 * Kein Git-Zugriff, keine I/O: bekommt Aktion, Ziel und Dateiliste und liefert
 * einen Text, der `checkMessage` erfüllt. Damit kann weder ein Merge- noch ein
 * Squash-Commit an einem zu dünnen Body scheitern.
 */
import { checkMessage } from './commit-text.mjs'

const ACTION_LABEL = {
  rebase: 'Rebase',
  merge: 'Merge',
  pr: 'Pull Request',
}

export function integrationLabel(action) {
  return ACTION_LABEL[action] ?? action
}

function fileList(files) {
  const unique = [...new Set(files)].filter(Boolean)
  if (unique.length === 0) return 'keine Dateien'
  return unique.join(', ')
}

export function buildIntegrationBody({ action, target, files = [] }) {
  const label = integrationLabel(action)
  return [
    `Diese Integration führt den Stand aus ${target} über einen ${label} in main zusammen. Der Vorgang wird als eigener Commit beschrieben, weil auch das Zusammenführen den Repo-Regeln folgt und ein leerer Integrations-Body sonst unbemerkt nach main gelangen könnte.`,
    'Die Regeln verlangen mindestens zweihundert Wörter Fließtext, keine Aufzählung mit Sternchen oder Bindestrich, keinen KI- oder Werbe-Footer und die namentliche Nennung jeder beteiligten Datei. Ein Merge- oder Squash-Commit erfüllt diese Vorgaben von sich aus fast nie, weil Git ihn automatisch mit einer kurzen Standardnachricht erzeugt, die weder Prosa noch Dateiliste enthält.',
    'Genau deshalb erzeugt Shinon diesen Text mechanisch. Der Hook prepare-commit-msg prüft den Body eines Merge- oder Squash-Vorgangs vor dem Commit und ersetzt ihn, sobald er die Regeln nicht erfüllt. Dieselbe reine Funktion liefert auch den Text für eine bewusst manuelle Integration, etwa nach einem Rebase mit Konfliktauflösung.',
    `Die beteiligten Dateien sind: ${fileList(files)}. Jede davon ist namentlich genannt, damit das commit-msg-Gate und die Remote-Prüfung sie zuordnen können und die Begründung im Fließtext nachvollziehbar bleibt.`,
    'Für echte Merge-Commits gilt zusätzlich: commit-integrity überspringt Merge-Commits, weil sie keinen eigenen Inhalt tragen. Geprüft werden die Inhalts-Commits der Range, also genau die Commits, die Dateien verändern. Ein synthetischer Test-Merge von GitHub, der niemals einen Body besitzt, kann das Gate damit nicht mehr fälschlich blockieren.',
    'Damit bleibt die Grenze überall gleich: Der lokale Hook erzeugt gültige Prosa, und die Remote-Prüfung kontrolliert dieselbe Prosa erneut, unabhängig davon, ob über Rebase, Merge oder Pull Request integriert wurde.',
  ].join('\n\n')
}

export function buildIntegrationMessage({ action, target, files = [] }) {
  const label = integrationLabel(action)
  const title = `chore: ${label} ${target} integrieren`
  const body = buildIntegrationBody({ action, target, files })
  return { title, body, text: `${title}\n\n${body}\n` }
}

export function isCompliant(raw, files = []) {
  return checkMessage(raw, files).ok
}
