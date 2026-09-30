# docs/LORE.md — Der Boden, der frisst

> **Was das hier ist.** Kein Fanon-Wiki. Die Spielwelt in ein paar Sätzen, damit
> ein Begriff wie „Moral" oder „Escrow" irgendwo im Kopf einen Ort hat, an dem er
> klebt. Alles hier ist mit der Mechanik in `docs/CONCEPT_REVIEW.md` verbunden —
> diese Datei erfindet keine Regel, sie erklärt die, die es gibt.
>
> **Was hier ausdrücklich nicht steht.** Keine Namen von Figuren, die jemand
> anderen etwas bedeuten könnten. Keine Geschichte, die ein Feature verspricht,
> das es nicht gibt. Der Ton ist der des Spiels: trocken, warm, etwas sadistisch.

## Der Ort

Es gibt unten eine Tiefe. Sie hat kein Ende, das jemand vermessen hätte, und sie
verlangt zwei Dinge von jedem, der sich an ihre Kante stellt: etwas zu essen und
etwas zu verlieren. Die Leute oben nennen es den *Boden*. Sie sagen es nicht
freundlich.

Oben gibt es ein Dorf. Es gibt Brot, es gibt Arbeiter, es gibt eine Gilde mit
Helden, die gegen Bezahlung in die Tiefe gehen. Das Dorf ist klein und funktioniert.
Das ist keine Ironie, das ist der Plan.

## Die einen und die anderen

Wer unten ist, ist ein **Wächter**. Man gräbt Etagen, man setzt Wände, man
züchtet Wesen, man stellt sie auf. Man baut Umwege, weil ein Held, der sich
verirrt, ein umsonst gebauter Raum ist.

Wer angreift, ist ein **Fremder**. Man stellt fünf Helden auf, man drückt auf
Angriff, und das Spiel sucht irgendwo auf der Welt ein Dungeon, das ungefähr
passt. Man sieht den Weg. Nur den Weg. Wie viele Wesen oben auf den Feldern stehen,
darüber erfährt man nichts — bis man dort ist.

Diese Trennung ist der Kern, und sie ist nicht erzählt, sondern gebaut: der
Angreifer bekommt eine reduzierte Sicht (`RaidPublicView`), der Verteidiger die
volle. Was du nicht siehst, kannst du nicht gegen dich verwenden. Das ist keine
Einstellung, das ist Architektur.

## Der Boss

An der letzten Etage steht ein Wesen, das keine Genetik hat.

Es ist **kein Monster**, und das ist der ganze Unterschied. Die Wächter züchten
Wesen aus Wesen — zwei Eltern, verbrauchtes Erbgut, ein Nachkomme auf Stufe 1. Ein
Boss entsteht so nicht. Er entsteht gar nicht. Er steht einfach da, seit jemand
ihn hingestellt hat, und er ist so alt wie die Etage, auf der er steht.

Und deshalb ist er schwer zu töten. Er ist nicht gepanzert, er ist groß. Seine
Bedrohung kommt aus der Lebensleiste und nicht aus der Rüstung. Wer ihn fallen
sieht, hat ihn über einen langen Kampf hinweg ausgeblutet, nicht durch einen
schweren Treffer.

> Der Boss ist der Satz, den die ganze Kampfbalance am 2026-09-29 gesagt hat:
> **Dreierteam gegen ihn allein, ohne einen einzigen Platzmonster — vorher
> unmöglich, seitdem 88 Prozent.** Wer das im Log nachlesen will, findet ihn im
> Golden-Pin, der zum ersten Mal auf `heroes-win` gekippt ist.

## Die Wesen

Zwanzig Basisarten. Jede hat drei Elemente, jedes Element ist eine Zahl, und die
drei Zahlen zusammen ergeben die **Stärke** — eine Stufe von null bis fünf.

Diese Stärke ist keine Kosmetik. Sie ist dieselbe Zahl, aus der die Beute rechnet.
Ein Wesen, das oben in der Beute teuer ist, ist auch im Kampf zäh. Das ist
Absicht: der Wächter, der züchtet, züchtet auf einen Wert hin, den er später
beute-seitig wiederfindet.

Die Wesen werden nicht getötet, wenn sie verlieren. Sie verlieren **Moral** und
werden inaktiv — und sie **leveln trotzdem**, auch im verlorenen Kampf. Das ist der
unangenehmste Teil des Spiels aus Wächtersicht, und er ist der Grund, warum ein
scheiternder Angriff teuer ist: Er kostet nicht nur Beute, er macht die Verteidiger
stärker.

## Zucht

Zwei Wesen, ein Erbgut, ein Nachkomb. Das Ergebnis beginnt bei Stufe 1 und erbt
nicht die Stärke der Eltern, sondern ihre Elemente — verändert, verschoben,
manchmal besser, manchmal nicht.

Und wenn der Wächter etwas züchtet, das niemand braucht, dann zerlegt er es. Der
Zweck der Überreste sind **Seelen**, und Seelen kaufen Monsterplätze auf tieferen
Etagen. Der Floor ernährt sich also nicht nur von Heldenausrüstung, sondern von
seinen eigenen Fehlentscheidungen.

> *Ein Wächter, der zu lange züchtet, baut sich eine zweite Wirtschaft auf. Das ist
> keine Nebenbeschäftigung. Das ist der eigentliche Grund, warum man unten bleibt.*

## Die Moral

Wird sie vollständig aufgebraucht, greift ein globaler Schutz. Das ist die einzige
Stelle im Spiel, an der das System dem Wächter **nicht** nachgibt — und sie ist
absichtlich hart, weil Schonung an dieser Stelle bedeutet, dass niemand je
verliert und damit auch niemand je spielt.

## Der Traum

Anfang, im Kopf, bevor man die Augen aufmacht:

> *Du schließt die Augen, um schlafen zu gehen. Du träumst von einem Dorf. Im Traum
> verteilst du Brot, die Arbeiter kommen, die Gilde wächst. Alles ist warm und du
> bist ein guter Mensch.*
>
> *Dann machst du die Augen auf.*
>
> *Und du stehst in deinem eigenen Dungeon. Dein Boss hat Kratzer. Irgendein Held hat
> letzte Nacht versucht, deine dritte Etage zu räumen. Er hat versagt, aber dein
> Wandmimic hat dabei ein Level aufgestiegen. Danke dafür, Fremder.*

Das ist die ganzen Figuren in diesem Spiel: ein Mensch, der nachts den Wächter
spielt. Die Gäste kommen und gehen, und der Wächter weiß nie, wann es passiert —
er sieht es erst, wenn er morgens in die Ecke schaut, in der seine Verluste liegen.

## Der Satz, um den es geht

Der Boden frisst. Er frisst Wächter, er frisst Fremde, und wenn er niemanden
frisst, dann frisst er das, was der Wächter selbst gebaut hat, Stück für Stück.
Du bist Bürgermeister oben und Dungeon Master unten, und beide arbeiten für
dieselbe Sache.

**Füttere den Floor.**
