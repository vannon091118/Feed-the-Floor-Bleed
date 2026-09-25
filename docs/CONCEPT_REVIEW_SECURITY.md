# Konzeptreview — Sicherheitsprüfmarke

> Diese Datei besitzt ausschließlich die Semantik der manuellen Prüfmarke `Invalid request /purge account`.
> Allgemeine Sync-, Snapshot-, Matching-, Refund-/Verlust-, XP- und Pathfinding-Regeln besitzt ausschließlich `CONCEPT_REVIEW.md`.
> Diese Datei autorisiert keine Implementierung und führt keinen Account-Befehl aus.

## 1. BESTÄTIGT

- Ein ungültiger Request kann für einen manuellen Check markiert werden.
- Das Flag ist ein Prüfhinweis und kein automatischer Lösch- oder Sperrbefehl.
- Ein gewöhnlicher Disconnect, ein erneuter Login oder ein unterbrochener Download ist allein kein Purge-Auslöser.
- Gameplay-Regeln für Abbruch, Zeitlimit, Verlust, Sperre und Jobstatus stehen ausschließlich in `CONCEPT_REVIEW.md`.

## 2. Prüfzweck und Auslöser — EMPFEHLUNG

Eine interne Markierung darf vorgeschlagen werden bei autoritativen Hinweisen wie:

- Schema- oder Protokollfehler,
- unbekanntem Endpunkt oder unzulässiger Methode,
- Authentifizierungs-/Autorisierungsfehler,
- ungültigem oder wiederverwendetem Token,
- inkompatibler `sim_version`,
- nicht passender Snapshot-/Job-Referenz,
- wiederholtem Hash-Mismatch oder Replay-Widerspruch,
- auffälliger Request-Häufigkeit oder Payload-Mustern.

Trigger-Liste, Schwellenwerte und Wiederholungsgrenzen sind **offen**. Ein einzelner Fehler ist kein Beweis für Manipulationsabsicht.

## 3. Autoritative Prüfung — EMPFEHLUNG

Die Prüfung verwendet ausschließlich Serverdaten:

1. Fall-/Request-ID, pseudonymisierte Konto-/Session-ID und Serverzeit sichern.
2. Protokollversion, Methode, Endpoint, Payload-Größe und Schema-Hash prüfen.
3. Authentifizierung, Autorisierung, Tokenstatus sowie Rate-Limit-/Missbrauchsprotokoll prüfen.
4. Job-, Snapshot-, Versions- und Seed-Referenz mit dem serverseitigen Zustand abgleichen.
5. Client-Hash, serverseitigen Replay-Hash, Statusübergänge, Retry-Historie und Ergebnisjournal vergleichen.
6. Nur mit übereinstimmender serverseitiger Evidenz über Sperrung oder Löschung entscheiden.

Browsertext, Client-Hash oder manueller Verdacht allein sind kein ausreichender Nachweis. Die konkreten Schemata, Endpunkte und Logs existieren im aktuellen Projekt noch nicht.

## 4. Beweissicherung — EMPFEHLUNG

- Fall mit technischen Korrelationsschlüsseln und Zeitstempeln eröffnen.
- Relevante Logs und Metadaten append-only sowie gegen spätere Änderung erkennbar sichern.
- Prüfbericht und Account-Datensatz revisionssicher über die Fall-ID verknüpfen.
- Tokens, Credentials, Schlüssel und unnötige personenbezogene Inhalte nicht kopieren.
- Eine Prüfmarke darf keine Gameplay-Restore-Funktion auslösen; die Restore-/Verlustrede steht nur in `CONCEPT_REVIEW.md`.

## 5. Sperr-/Wiederherstellungsentscheidung — EMPFEHLUNG

- `REJECTED`: Fehler abgelehnt, kein nachgewiesener Schaden; keine Sperrung oder Löschung.
- `QUARANTINED`: laufende Prüfung; betroffene Prüfvorgänge pausieren.
- `SUSPENDED`: begründete, befristete Sicherheitssperre.
- `RESTORED`: Fehlalarm widerlegt; Status mit Begründung und Audit-Eintrag wiederherstellen.
- `PURGE_APPROVED`: ausschließlich separate manuelle Freigabe eines irreversiblen Löschverfahrens; niemals automatisch aus dem Flag.

Freigabestufe, Sperrdauer, Wiederherstellungsfrist und die Bedeutung von `purge` als dauerhafte Löschung oder interne Sperre sind offen.

## 6. Anti-Missbrauch — EMPFEHLUNG

- Das Flag selbst gewährt keine Lösch- oder Sperrberechtigung.
- Wiederholte Fehler deduplizieren und als Muster statt als Schuldbeweis aggregieren.
- Ein einzelner Hash-Mismatch ist kein Manipulationsbeweis.
- Prüfung, Beweissicherung, Sperrung und Wiederherstellung revisionssicher protokollieren.
- Vor irreversiblen Entscheidungen mindestens explizite zweite Bestätigung und Sicherung verlangen. Für den Solo-Betrieb ist offen, wie diese Bestätigung organisatorisch erfolgt.

## 7. Abgrenzung und Abnahmegrenze

- Die Dateien `CONCEPT_REVIEW.md` und diese Datei besitzen keine gemeinsamen allgemeinen Spielregeln.
- Hier bestätigt sind nur die manuelle Markierung, ihre Nicht-Automatizität und die Abgrenzung vom allgemeinen Gameplay-Sync.
- Trigger, Statusautomaten, Sperrdauer, Wiederherstellung und Löschverfahren bleiben Vorschläge bis zur ausdrücklichen Abnahme.
- Es gibt keine implementierte Prüffunktion und keinen ausgeführten Account-Lösch- oder Sperrbefehl.
