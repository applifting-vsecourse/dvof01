# Lajky: případy, které musí platit

Status: **Bez otevřených otázek.** Datový model viz [ADR 0002](docs/adr/0002-likes.md).

## Zadání od Product Ownera

> „Lidi chtějí dát najevo, že se jim quack líbí, aniž by museli odpovídat. Chci u každého quacku tlačítko na lajk a počet lajků. Každý může quack lajknout jen jednou a lajk zase vzít zpět.“

## Rozhodnutí k otázkám, které PO nezmínil

| Otázka                                   | Rozhodnutí                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Můžu lajknout vlastní quack?             | **Ano.** Lajk je „líbí se mi“, ne hlasování o cizím obsahu; zákaz by byl jen další pravidlo navíc.                                               |
| Dají se lajkovat odpovědi?               | **Ano.** Odpověď je taky quack (bonus z kurzu). Stejná pravidla, stejné API.                                                                     |
| Co když kliknu na lajk dvakrát?          | Druhý lajk nic nezmění — počet zůstane, odpověď je úspěch (idempotentní `PUT`). Stejně tak odebrání lajku, který nemám (idempotentní `DELETE`).  |
| Smazaný quack (tombstone, viz ADR 0001)? | Nejde lajkovat ani odlajkovat (404). Při smazání quacku zmizí i jeho lajky — obsah smazaného quacku z aplikace opravdu mizí, lajky k němu patří. |
| Nepřihlášený návštěvník?                 | 401, stejně jako zbytek API. Feed beztak vidí jen přihlášení.                                                                                    |
| Vidím, že jsem quack lajkl?              | **Ano.** Tlačítko je stisknuté (`aria-pressed="true"`, popisek „Unlike“), jinak „Like“. Počet vidí všichni.                                      |
| Kdo lajkl?                               | Mimo rozsah tohoto zadání (druhý bonus) — zatím jen počet.                                                                                       |
| Co když server lajk odmítne?             | Optimistická změna v UI se vrátí zpět a uživatel dostane toast s chybou (konvence z `CLAUDE.md`).                                                |
| Nekonzistence při souběžných kliknutích? | Jeden lajk na uživatele a quack hlídá **databáze** (unikátní index), ne jen kód. Dva souběžné lajky téhož uživatele = pořád 1 lajk, žádná 500.   |

## API

- `PUT /api/quacks/:id/like` → `200 { quackId, likeCount, likedByMe: true }`
- `DELETE /api/quacks/:id/like` → `200 { quackId, likeCount, likedByMe: false }`
- `GET /api/quacks` → každý quack i každá odpověď nese `likeCount: number` a `likedByMe: boolean`

---

## Pravidla (unit testy)

### Backend — `LikesService`

**L1 · Lajk patří přihlášenému uživateli**

- Given existující quack `q1`
- When uživatel `u1` (ze session) zavolá `like(u1, q1)`
- Then repozitář uloží lajk pro `(q1, u1)` a služba vrátí souhrn `{ quackId: q1, likeCount, likedByMe: true }`

**L2 · Odebrání lajku patří přihlášenému uživateli**

- Given existující quack `q1`
- When `u1` zavolá `unlike(u1, q1)`
- Then repozitář odebere lajk pro `(q1, u1)` a služba vrátí souhrn s `likedByMe: false`

**L3 · Neexistující quack**

- Given quack `missing` neexistuje
- When kdokoli zavolá `like` nebo `unlike`
- Then služba vyhodí `NotFoundException` („Quack not found“) a do repozitáře lajků nic nezapíše

**L4 · Smazaný quack (tombstone)**

- Given quack `q1` má `deletedAt`
- When kdokoli zavolá `like` nebo `unlike`
- Then služba vyhodí `NotFoundException` a do repozitáře lajků nic nezapíše

### Frontend

**F1 · Tlačítko ukazuje počet a můj stav**

- Given quack s `likeCount: 3`, `likedByMe: false`
- Then je vidět tlačítko „Like“ s `aria-pressed="false"` a počtem `3`
- Given `likedByMe: true` → tlačítko „Unlike“ s `aria-pressed="true"`

**F2 · Kliknutí přepne lajk**

- When kliknu na „Like“ → zavolá se `onToggle(true)`; na „Unlike“ → `onToggle(false)`

**F3 · Optimistická změna v cache**

- Given feed v cache, ve kterém je quack i odpověď
- When lajknu quack (nebo odpověď)
- Then `likedByMe` se přepne a `likeCount` se změní o ±1 právě u toho quacku (i když je zanořený jako odpověď); ostatní quacky zůstanou beze změny
- Given stav už odpovídá (lajknu už lajknuté) → cache se nezmění

**F4 · Selhání se vrátí a ohlásí**

- Given server lajk odmítne
- Then cache je zpět v původním stavu a uživatel vidí chybový toast

**F5 · Tombstone nemá tlačítko**

- Given smazaný quack (tombstone) ve feedu
- Then u něj není tlačítko Like; u běžného quacku je

---

## Chování API (integrační testy)

**A1 · Nepřihlášený** — `PUT` i `DELETE /api/quacks/:id/like` bez session → `401`

**A2 · Lajk** — Given quack s 0 lajky; When `PUT …/like`; Then `200`, `likeCount: 1`, `likedByMe: true`

**A3 · Lajk dvakrát** — Given už jsem lajkl; When znovu `PUT …/like`; Then `200`, `likeCount` zůstává `1`

**A4 · Souběžně** — When stejný uživatel pošle dva `PUT …/like` naráz; Then oba `200` a v databázi je právě 1 lajk

**A5 · Odebrání** — Given jsem lajkl; When `DELETE …/like`; Then `200`, `likeCount: 0`, `likedByMe: false`

**A6 · Odebrání bez lajku** — Given jsem nelajkl; When `DELETE …/like`; Then `200`, `likeCount: 0`

**A7 · Víc lidí** — Given A a B lajknou quack; Then `likeCount: 2`; When A odebere; Then `1` a lajk B zůstává

**A8 · Feed** — `GET /api/quacks` ukazuje u každého quacku `likeCount` a `likedByMe` z pohledu toho, kdo se ptá (A lajkl: A vidí `true`, B vidí `false`, oba vidí `1`); quack bez lajků má `0` / `false`

**A9 · Vlastní quack** — autor svůj quack lajknout smí → `200`, `likeCount: 1`

**A10 · Odpověď** — lajk na odpověď → `200`; ve feedu má odpověď `likeCount: 1` a rodič `0`

**A11 · Neexistující quack** — `PUT`/`DELETE …/like` na neznámé id → `404`

**A12 · Tombstone** — Given quack s odpovědí, který autor smazal; When `PUT …/like` → `404`; a lajky, které měl před smazáním, zmizí (tombstone ve feedu má `likeCount: 0`)

---

## End-to-end (Playwright)

**E1 · Lajk, reload, druhý uživatel, odlajk**

- Given přihlášený Caffeinated Duck napíše nový quack
- When klikne na „Like“
- Then tlačítko je „Unlike“ (stisknuté) a počet je `1`; po reloadu stránky to tak zůstává
- And Deep Duck Thoughts vidí u toho quacku počet `1` a tlačítko „Like“ (nestisknuté)
- When Caffeinated Duck klikne na „Unlike“
- Then počet je `0` a tlačítko je zase „Like“
