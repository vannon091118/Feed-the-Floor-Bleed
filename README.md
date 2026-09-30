<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

<picture>
  <img src="./docs/assets/cover-banner.svg" alt="Feed the Floor - Zwei Welten, ein Spiel" width="100%">
</picture>

<br/>

**Oben bist du der freundliche Bürgermeister.**
**Unten bist du der Dungeon Master.**
**Du bist beides. Gleichzeitig. Und niemand weiß davon.**

<br/>

[![Shinon Gate](https://img.shields.io/github/actions/workflow/status/vannon091118/Feed-the-Floor-Bleed/shinon.yml?label=Shinon%20Gate&style=for-the-badge&color=ff0055&logo=githubactions&logoColor=white)](https://github.com/vannon091118/Feed-the-Floor-Bleed/actions/workflows/shinon.yml)
![Pre-Alpha](https://img.shields.io/badge/Status-PRE--ALPHA-cf5fff?style=for-the-badge)
![Deterministic](https://img.shields.io/badge/Core-100%25_Deterministic-8a2be2?style=for-the-badge)
![No Pay-to-Win](https://img.shields.io/badge/Pay--to--Win-NEVER-ff3864?style=for-the-badge)
![License](https://img.shields.io/badge/License-none%20yet-lightgrey?style=for-the-badge)

</div>

---

> *„Du schließt die Augen, um schlafen zu gehen. Du träumst von einem Dorf. Im Traum verteilst du Brot, die Arbeiter kommen, die Gilde wächst. Alles ist warm und du bist ein guter Mensch."*
>
> *Dann machst du die Augen auf.*
>
> *Und du stehst in deinem eigenen Dungeon. Dein Boss hat Kratzer. Irgendein Held hat letzte Nacht versucht, deine dritte Etage zu räumen. Er hat versagt, aber dein Wandmimic hat dabei ein Level aufgestiegen. Danke dafür, Fremder.*

---

## 💀 Was ist Feed the Floor?

**Feed the Floor** ist das Spiel, das ich bauen wollte, seit ich das erste Mal in einem Tower Defense dachte: *„Warum kann ich nicht auf der anderen Seite stehen?"*

Stell dir vor: **Dungeon Keeper** trifft **Idle RPG** trifft **Push-your-luck Raids** — aber asynchron, persistent und deterministisch bis auf den letzten Bit. Kein Echtzeit-MMO. Keine Energie-Balken. Kein Timer, der dir sagt, wann du spielen darfst. Kein Battle-Pass, der dich bestraft, weil du ein Leben hast.

Nur du. Dein Dorf. Dein Dungeon. Und die Frage, wie tief du bereit bist zu graben.

> 🎲 *Fun Fact: Der Kampf-Core rechnet in Fixed-Point-Ganzzahlen statt Floats. Weil ich paranoid bin. Weil `0.1 + 0.2 !== 0.3` in JavaScript. Und weil ein Replay, das beim zweiten Mal anders ausgeht, kein Replay ist, sondern eine Lüge.*

---

<div align="center">
  <img src="./docs/assets/banner-erwartung.svg" alt="Was dich erwartet" width="100%">
</div>

<br/>

### ☀️ Am Tag bist du der Bürgermeister

Du lächelst. Du verteilst Brot. Du versprichst Arbeit, Schutz und einen bescheidenen Lohn.

Dein Dorf startet auf einem 10×10-Raster und wächst horizontal — per Landkauf, mit echten Ressourcen. Du baust Gebäude. Du lockst Arbeiter an. Deine Gilde rekrutiert und rüstet deine Helden aus, mit denen du fremde Dungeons überfällst. Die Wirtschaft brummt. Alles sieht idyllisch aus.

Aber du weißt, wofür du die Arbeiter wirklich brauchst.

> 🏘️ *Dein Dorf ist keine Dekoration. Es ist deine Versorgungskette. Ohne Arbeiter keine Monster. Ohne Attraktivität keine Arbeiter. Ohne Gebäude keine Attraktivität. Du bist Bürgermeister, Wirtschaftsminister und Sklaventreiber in einer Person.*

### 🌙 In der Nacht bist du der Dungeon Master

Wenn du den Tag/Nacht-Knopf drückst — ja, **du** drückst ihn, kein Server entscheidet deinen Feierabend — wechselt die Welt.

Jetzt bist du unten. Im Dungeon. **Deinem** Dungeon.

Jede Etage ist ein 64×64-Logikraster. Du gräbst frei. Du setzt Wände. Du legst Fallen. Du platzierst deinen Boss. Du züchtest Monster und verteilst sie auf die Etagen. Du baust Umwege, Sackgassen und tödliche Korridore.

Aber: Es muss **immer** eine Route vom Eingang zum Boss frei sein. Sonst → **Hard-Block**. Du kannst nicht mogeln. Die Helden, die dich angreifen, nehmen sowieso den kürzesten Weg (Breitensuche, deterministisch, kein Zufall). Aber den *kürzesten* Weg bestimmst du.

> 🕳️ *Du baust keinen Dungeon, um fair zu sein. Du baust einen Dungeon, um die Illusion von Fairness aufrechtzuerhalten, während du jeden einzelnen Tile so platzierst, dass der Held genau dort stirbt, wo dein stärkstes Monster wartet.*

### ⚔️ Der Raid — Angriff und Verteidigung

Hier wird es ernst. Der Raid hat **zwei Seiten**, und du spielst beide:

**🗡️ Du greifst an:**
Du stellst deine Heldengruppe zusammen (maximal 5). Du drückst auf Angriff. Das Spiel sucht dir einen fremden Dungeon auf deiner Stärke (MMR-Matching). Und dann kämpfen deine Helden **vollautomatisch**. Du steuerst sie nicht. Du guckst zu. Ziel: den Boss des Gegners besiegen.

Gewinnen deine Helden? Du bekommst eine **Phantom-Kopie** der Beute. Der Verteidiger verliert nichts von seinen echten Ressourcen. *(Ja, das ist Absicht. Wir sind grausam, aber fair.)*

**🛡️ Du verteidigst:**
Während du irgendwo anders jemanden überfällst, stellt dein Dungeon sich automatisch in den globalen Pool. Andere Spieler schicken ihre Helden zu dir. Deine Monster kämpfen automatisch. Du bist nicht da. Du kannst nichts tun. Du hast vorher gebaut, gezüchtet, platziert — und jetzt zeigt sich, ob es reicht.

> 💀 *Der Moment, wenn du morgens aufwachst und siehst, dass jemand deinen Boss in der Nacht besiegt hat. Er hat dabei drei Monster gelevelt. Deine Monster. Die werden stärker, wenn sie verlieren. Das ist kein Bug. Das ist Design.*

**Und nach dem Raid?**

- Besiegte Monster **sterben nicht**. Sie verlieren Moral und werden inaktiv.
- Aber sie **leveln bei jedem Kampf** — auch bei dem, den sie verlieren.
- Reaktivierung per Gold oder Beurlaubung.
- Ein abgebrochener Raid zählt trotzdem. Der Angreifer wird für diesen Verteidiger lokal gesperrt. Kein Rage-Retry.

> 🧬 *Stell dir Zucht vor wie Pokémon, aber mit Konsequenzen. Du kombinierst zwei Monster, verbrauchst deren XP, und das neue Monster startet auf Level 1. Die Generation bestimmt das Level-Cap. Und wenn du etwas züchtest, das niemand braucht — zerlegst du es für Monster-Seelen, die du brauchst, um neue Slots auf tieferen Etagen freizuschalten.*

---

<div align="center">
  <img src="./docs/assets/banner-core.svg" alt="Unter der Haube" width="100%">
</div>

<br/>

### 🎮 Die Schleife — so fühlt sich ein Tag an

```
☀️ Tag    →  Dorf:   Brot verteilen, Arbeiter anlocken, Gold verwalten,
                      Beute der letzten Nacht verkaufen, Gebäude errichten
                      (du drückst den Knopf — kein Timer entscheidet das)
      ↓
🌙 Nacht  →  Floor:  Monster züchten, Etagen graben, Wände setzen,
                      Fallen legen, Boss platzieren, Dungeon perfektionieren
      ↓
⚔️ Raid   →  Angriff: Deine Helden gegen einen fremden Floor.
                       Läuft automatisch. Ziel: den Boss besiegen.
             Gleichzeitig: Dein Floor steht im Pool.
                       Fremde Helden greifen dich an.
      ↓
📊 Lernen →  Besiegte Monster verlieren Moral — leveln aber trotzdem.
             Beute auswerten. Züchten. Optimieren.
      ↺     zurück zum Tag
```

### 🧠 Die Philosophie — warum so und nicht anders

Ich habe zu viele Spiele gesehen, die mich für meine Zeit bestrafen. Die mir sagen, wann ich spielen darf. Die mir Fortschritt verkaufen, statt ihn mich verdienen zu lassen.

**Feed the Floor** macht das nicht.

- 🚫 **Kein Energy-Timer.** Du spielst, wann du willst. So lange du willst.
- 🚫 **Kein Battle-Pass.** Dein Fortschritt gehört dir, nicht einem Quartalsbericht.
- 🚫 **Kein Pay-to-Win.** Später vielleicht Kosmetik. Vielleicht Status-Rerolls. Aber niemals: *Kauf dir einen stärkeren Boss.*
- 🚫 **Kein Handel beim Launch.** Keine Inflation durch Systemessenzen.
- ✅ **Asynchron.** Du musst nicht gleichzeitig online sein wie dein Gegner.
- ✅ **Persistent.** Dein Dungeon bleibt. Dein Dorf bleibt. Deine Monster wachsen.
- ✅ **Deterministisch.** Gleicher Seed, gleiches Ergebnis. Immer. Auf jedem Gerät. Für immer.

> 🎯 *Wenn ich irgendwann ein Spiel abliefere, in dem du für \$4.99 einen goldenen Schlüssel kaufen kannst, der deinen Raid-Timer überspringt — dann hat jemand meinen Account gehackt. Oder ich bin tot. Beides wäre gleich schlimm.*

---

### 🗺️ Was heute existiert — und was noch nicht

Ich belüge dich nicht. Das Repo behauptet nie, geplante Systeme seien schon da.

<details open>
<summary><b>✅ Das steht. Das läuft. Das ist getestet.</b></summary>

- **Deterministischer Kampf-Core** — Fixed-Point statt Float. Seed-PRNG (Mulberry32). Breitensuche über ein Raster mit gleich teuren Zellen. Combat-Ticks. Kanonischer Log-Hash. Trail-Hash über den *kompletten* Pfad.
- **Wire-Vertrag** — Zod-Schemas, `sim_version`, Ergebnislog, Auftragsautomaten und TTL kommen aus `packages/contracts`; die laufende Fassung steht in `@floor/contracts`, nicht hier. Der Code erfindet nichts.
- **Replay-Validierung** — Der Log wird nachgerechnet. Inklusive Trail-Prüfung. Wer schummelt, fliegt auf.
- **Sichtbare Referenzszene** — PixiJS 8, Kamera, Ebenen, Depth, Occlusion, Actors, FX; DOM-basierter Dungeon-Editor; Preact-Fenster-Runtime. Der Client rendert — er entscheidet nie.
- **Tag/Nacht/Raid-Schleife** — Funktioniert als lokaler Fixture-Loop. Browser-abgenommen.
- **Raid-Playback** — Timeline-Modell, Routen-/Kampf-/Ergebnis-Zerlegung, visuelles Scrubbing.
- **Shinon Gate-Engine** — 12 automatische Gates, die bei jedem Commit die Integrität prüfen.

</details>

<details>
<summary><b>🚧 Das kommt — ist aber noch nicht da</b></summary>

Alles hier steht in `docs/ROADMAP.md` und ist **noch nicht benutzbar**.

- **Dorf-Ökonomie** — Arbeiter, Attraktivität, Materialbedarf, Landkauf, Beute-Verkauf.
- **Inventar & Ausrüstung** — 9 Slots, 5 Seltenheitsstufen, Zerlegen, Phantom-Beute.
- **Zucht-UI** — Generationen, Mutationen, Stammbäume, Monster-Seelen, Slot-Kauf.
- **Echter Async-Multiplayer** — HTTP, Auth, Queue, D1-Jobstore, MMR-Matching, Ghost-Fallback.
- **PWA & Deployment** — Offline-Editor, produktionsfähige Config.

</details>

---

<div align="center">
  <img src="./docs/assets/banner-gov.svg" alt="Governance" width="100%">
</div>

<br/>

### 🏗️ Unter der Haube — für die, die es wissen wollen

<details>
<summary><b>Architektur — vier Schichten, eine Wahrheit</b></summary>

```mermaid
flowchart LR
  C["contracts\nZod-Wire-Form"] --> S["sim-core\npure Funktionen"]
  S --> CL["client\nrendert"]
  S --> SV["server\nD1-Jobstore"]
  CL -->|Upload| SV
  SV -->|validiertes Ergebnis| CL
```

- `contracts` — besitzt die Protokoll-Form. Keine Logik.
- `sim-core` — besitzt die Berechnung. Kein I/O, keine Uhr, kein Zufall von außen.
- `client` — Preact + Signals, PixiJS 8. Rendert. Entscheidet nie.
- `server` — Cloudflare D1 + Queues. Setzt den Contract durch. Erfindet nichts.

</details>

<details>
<summary><b>Der Stack</b></summary>

| Bereich | Werkzeug |
|---|---|
| Sprache | TypeScript 6.0, strikt |
| Pakete | pnpm 9.12.3 Monorepo |
| UI | Preact + Signals |
| Rendering | PixiJS 8 |
| Schemas | Zod |
| Server | Cloudflare D1 + Queues |
| Tests | Vitest |
| Lint | Biome |
| Gates | Shinon |

</details>

<details>
<summary><b>Determinismus — das ist hier kein Feature, das ist Religion</b></summary>

In `sim-core` und `contracts` sind verboten: `Math.random`, `crypto.randomUUID`, `Date.now`, `new Date()`, `Math.sin/cos/tan/sqrt/pow`, `parseFloat`. Ein Gate prüft das bei jedem Commit.

> 🧠 *Wer `Date.now()` in den Core schmuggelt, bekommt ein rotes Gate und keine Ausrede.*

</details>

### 🔧 Rein in den Wahnsinn

```bash
pnpm install --frozen-lockfile   # Abhängigkeiten (nur pnpm, kein npm)
pnpm dev                         # Client-Devserver (Vite)
pnpm run -s check                # Vollabnahme: typecheck + LOC + Hygiene + alle Gates
```

Node ≥ 22. Nur pnpm. Alles andere ist Ketzerei.

---

### 📚 Doku — die README ist Werbung, `docs/` ist Wahrheit

| Datei | Worum es geht |
|---|---|
| [`Agents.md`](Agents.md) | **Das Gesetz.** Sprache, Grenzen, Gates. |
| [`docs/CONCEPT_REVIEW.md`](docs/CONCEPT_REVIEW.md) | **Die Spielregeln.** `[N]` fix, `[K]` Vorschlag, `[O]` offen. |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Die einzige aktive Reihenfolge. |
| [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) | Schichten, Datenfluss, Owner-Grenzen. |

> 📌 *Diese README ist die Verkaufsbühne. Die Technik lebt in `docs/`. Wer eine Spielregel ändern will, ändert `docs/CONCEPT_REVIEW.md` — nicht diese Datei.*

---

### ⚖️ Status & Lizenz

- **Status:** Pre-Alpha. Der deterministische Core steht. Die Schleife läuft. Der Multiplayer-Stack kommt als Nächstes.
- **Lizenz:** Noch keine vergeben — proprietär bis auf Weiteres.
- **Mitmachen:** Issues willkommen. Contributions nach den Regeln in [`Agents.md`](Agents.md).

---

<div align="center">

<br/>

> *Werde Bürgermeister. Bau ein Dorf, das deine Helden versorgt und rüstet.*
> *Bau einen Dungeon, der fremde Helden gnadenlos zermalmt.*
> *Schick deine eigene Heldengruppe los, um fremde Floors zu plündern.*
> *Füttere den Floor.*

<br/>

![Lint: Biome](https://img.shields.io/badge/Lint-Biome-60a5fa?style=for-the-badge&logo=biome&logoColor=white)
![Made With Determinism](https://img.shields.io/badge/Made_With-Determinism-ff69b4?style=for-the-badge)
![No Seed Cheating](https://img.shields.io/badge/No_Seed-Cheating-ff3864?style=for-the-badge)
![Node](https://img.shields.io/badge/Node-22%2B-4169e1?style=for-the-badge&logo=node.js&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-9.12.3-f69220?style=for-the-badge&logo=pnpm&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)

<sub>

*created by* **VANNON** — *Volatile Agent Needing No Other Nonsense*

</sub>

</div>
