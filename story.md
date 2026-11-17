# Replies: odpovědi na quacky a zachování konverzace při smazání

Status: **Připraveno k implementaci, bez otevřených rozhodnutí.** Navazuje na story „Delete + Mine“ a „Moderace“.

## Zadání od Product Ownera

> „Lidi pod quackem diskutují tak, že napíšou nový quack, který začíná ‚@jméno…‘, a nikdo pak neví, kdo na co reaguje. Chci, aby šlo na quack odpovědět a aby byly odpovědi vidět pod ním. Odpovědi patří lidem, kteří je napsali: když autor smaže quack, na který už někdo odpověděl, odpovědi s ním nesmí zmizet. Zároveň když někdo svůj quack smaže, jeho obsah musí z aplikace opravdu zmizet.“

---

## Příběh

**Jako** uživatel Quackeru  
**chci** moci odpovědět přímo na konkrétní quack a vidět strom/seznam odpovědí pod ním  
**abych** mohl smysluplně diskutovat a všichni věděli, kdo na co reaguje.

**Jako** autor quacku nebo moderátor  
**chci** mít možnost smazat svůj quack i v případě, že už na něj někdo odpověděl  
**přičemž** můj text a obsah musí z aplikace i vyhledávání kompletně zmizet, ale odpovědi ostatních uživatelů zůstanou zachovány.

---

## Co uživatel vidí a dělá (UX / UI)

1. **Zobrazení odpovědí**:
   - Každý hlavní quack ve feedu zobrazuje tlačítko pro odpověď (s počtem odpovědí).
   - Odpovědi jsou vizuálně zobrazeny přímo pod daným quackem s odsazením a jemnou linkou (dle `DESIGN.md`: žádné vnořené karty, pouze spacing a hairline divider).
   - Odpověď má autora, uživatelské jméno, čas vytvoření, text a možnost smazání (pokud je uživatel jejím autorem nebo adminem).
2. **Přidání odpovědi**:
   - Uživatel klikne na „Reply“ u quacku.
   - Otevře se jednoduchý formulář pro odpověď s polem pro text a tlačítky „Reply“ a „Cancel“.
   - Po odeslání se odpověď okamžitě zařadí pod daný quack.
3. **Smazání quacku s odpověďmi**:
   - Pokud autor nebo admin smaže quack, který **má odpovědi**, quack se promění v tzv. tombstone („[This quack has been deleted]“):
     - Původní text je z databáze kompletně vymazán (GDPR compliance / right to be forgotten).
     - Ve feedu a vyhledávání se původní text quacku již nikdy neobjeví.
     - Ve vlákně zůstává neutrální zástupný text, pod kterým jsou odpovědi ostatních uživatelů nadále čitelné a kontext diskuse zůstává zachován.
   - Pokud autor nebo admin smaže quack, který **nemá žádné odpovědi**, quack se kompletně fyzicky smaže z databáze (hard delete).
   - Odpovědi lze také mazat; pokud se smaže poslední odpověď pod smazaným quackem (tombstonem), může být uklizen i samotný prázdný tombstone.

---

## Akceptační kritéria

1. **Vytvoření odpovědi**:
   - Přihlášený uživatel může poslat odpověď na libovolný quack (`POST /api/quacks` s `replyToId`).
   - Odpověď je uložena s vazbou na rodičovský quack (`replyToId`) a autora ze session.
   - Nepřihlášený uživatel dostane `401 Unauthorized`.
   - Odpověď na neexistující quack vrátí `404 Not Found`.

2. **Zobrazení ve feedu a vláknech**:
   - Hlavní feed zobrazuje hlavní quacky (`replyToId: null`) seřazené od nejnovějších.
   - Pod každým quackem jsou načteny a zobrazeny jeho odpovědi (seřazené chronologicky od nejstarších).
   - Každý quack ukazuje počet odpovědí a tlačítko na odpověď.

3. **Smazání a soukromí**:
   - Smazání quacku **bez odpovědí**: fyzické smazání řádku z databáze (Hard Delete).
   - Smazání quacku **s odpověďmi**:
     - Nastaví se `deletedAt = now()`.
     - Text quacku se v databázi nahradí prázdným řetězcem / vymaže, mood se nastaví na `null`, případná anketa se smaže.
     - Původní text se nezobrazuje v hlavním feedu, ve vlákně ani ve výsledcích vyhledávání.
     - Vlákno odpovědí zůstává zachováno pod zástupným textem `[This quack has been deleted]`.
   - Oprávnění: Quack nebo odpověď smí smazat pouze její autor nebo uživatel s rolí `admin` (`QuacksService.deleteQuack`). Cizí uživatel dostane `403 Forbidden`.

4. **Vyhledávání**:
   - Vyhledávání (`GET /api/quacks?q=...`) ignoruje smazané quacky (`deletedAt IS NULL`) a smazaný text v něm nelze vyhledat.

---

## Rozhodnutí (Decisions)

| Rozhodnutí                                    | Možnosti a proč jsme vybrali danou možnost                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Kdo rozhodl |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **1. Datový model odpovědí**                  | **Vybráno: Self-referencing vztah na modelu `Quack` (`replyToId Quack?`)**.<br>• _Alternativa A (samostatná tabulka `Reply`)_: Odmítnuto — duplikuje kód, logiku pro autora, timestampy, text i mazání; neumožňuje snadno odpovědět na odpověď bez dalšího rozšiřování.<br>• _Alternativa B (`replyToId` na `Quack`)_: Zvoleno — odpověď je plnohodnotný Quack. Znovupoužívá existující typy, schémata, validace a přirozeně podporuje odpověď na odpověď.                                                                                                                                         | Tým         |
| **2. Způsob mazání quacku s odpověďmi (ADR)** | **Vybráno: Tombstone s vymazáním textu (Redaction)**.<br>• _Alternativa A (Hard delete `CASCADE`)_: Odmítnuto — smazalo by všechny odpovědi ostatních lidí, což přímo odporuje zadání PO.<br>• _Alternativa B (Hard delete `SET NULL`)_: Odmítnuto — odpovědi by ztratily kontext a staly se z nich osiřelé hlavní quacky plnící hlavní feed.<br>• _Alternativa C (Tombstone + scrub textu)_: Zvoleno — chrání práva autorů odpovědí, nemaže jejich práci, ale zároveň 100% naplňuje požadavek na zmizení obsahu původního autora (text je v DB smazán, nezobrazuje se ve feedu ani ve fulltextu). | Tým / PO    |
| **3. Zobrazení v UI**                         | **Vybráno: Vnořený seznam přímo pod quackem ve feedu**.<br>• Dodržuje `DESIGN.md`: žádné vnořené karty, jemný odsazený sloupec s hairline borderem (`border-l`), jednoduché tlačítko „Reply“.                                                                                                                                                                                                                                                                                                                                                                                                      | Tým         |

---

## Návrh schématu (`schema.prisma`)

```prisma
model Quack {
  id        String    @id @default(cuid())
  text      String    @db.Text
  mood      String?   @db.VarChar(20)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  poll      Poll?
  replyToId String?
  replyTo   Quack?    @relation("QuackReplies", fields: [replyToId], references: [id], onDelete: SetNull)
  replies   Quack[]   @relation("QuackReplies")
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @default(now()) @updatedAt

  @@index([userId])
  @@index([replyToId])
  @@map("quack")
}
```

---

## Odpovědi na 4 kontrolní otázky k datovému modelu

### 1. Can everything the user sees be read from this model with simple queries?

Ano.

- **Feed s odpověďmi**:
  ```ts
  prisma.quack.findMany({
    where: {
      replyToId: null,
      OR: [{ deletedAt: null }, { replies: { some: {} } }],
    },
    include: {
      user: true,
      poll: { include: { options: true, votes: true } },
      replies: {
        include: {
          user: true,
          poll: true,
          replies: { include: { user: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  ```
- **Vyhledávání**:
  ```ts
  prisma.quack.findMany({
    where: {
      deletedAt: null,
      OR: [
        { text: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { username: { contains: q, mode: 'insensitive' } } },
      ],
    },
  });
  ```

### 2. Is anything stored twice?

Ne. Počet odpovědí je odvozený z relace (`replies.length` nebo `_count.replies`). Žádná denormalizovaná počítadla se neukládají, nevzniká riziko desynchronizace dat.

### 3. What happens to related rows when a quack is deleted?

- Pokud quack **nemá odpovědi**: řádek v tabulce `quack` je fyzicky smazán (`prisma.quack.delete`), kaskádově se smaže případná anketa a hlasy.
- Pokud quack **má odpovědi**: je označen jako smazaný (`deletedAt = now()`), jeho text je vymazán (`text = ''`), mood nastaven na `null` a anketa smazána. Vazby potomků (`replyToId`) zůstávají intaktní, takže diskusní vlákno zůstává zachováno s neutrálním zástupným symbolem.
- Pokud je smazán uživatel (`User`): kaskádou se smažou jeho sezení a quacky, a díky `onDelete: SetNull` na cizích odpovědích nedojde k porušení integrity.

### 4. Will the migration run on a production database that already has data?

Ano. Sloupce `replyToId` a `deletedAt` jsou oba volitelné (`NULL` povolen). Existující řádky v produkční databázi dostanou hodnotu `NULL`, což představuje původní stav (top-level quack, nesmazaný). Žádná data se neztratí a tabulka nevyžaduje náročný přepis.
