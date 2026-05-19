# prompt.md — BÉRARD (fictional fragrance house)

> Drafted by the `premium-web-design` skill before any JSX. All 15 items have concrete answers.

## 1. Field-first declaration
Field: **fragrance / parfumerie** — a real, plausible luxury industry. Product: a single
signature **extrait de parfum**, `CÈDRE 19`, sold by a small house under the founder's name.
The field is real on its own terms; it is not a dodge to justify an available 3D scene.

## 2. Scene / subject match
Intended subject: a **perfume flacon** (literal — it is the product).
Spline search ran 3 passes (slug, community-tag, production-harvest). Every candidate
(`community.spline.design/file/1d464394…`, guessed `my.spline.design/perfume*`) returned
**HTTP 403** and the skill forbids fabricating slugs. → Fallback hierarchy invoked:
deterministic **SVG/CSS flacon** as the centerpiece + **Three.js drifting scent-mist**
as atmosphere only. Theme harmony: drawn in-page over the bone ground (transparent
canvas), so no embedded-backdrop clash is possible.

## 3. Previous scenes used this session
None. First (and only) site this session. No reuse risk.

## 4. Structural DNA
**Index Manuscript** — "a perfumer's letter." The whole page is one continuous letter
from the (fictional) founder, one typographic rhythm top to bottom, no boxed sections.
Distinct from any prior site (none exist this session). Explicitly *not* the
hero→features→testimonials→CTA template.

## 5. Design reference pull (5)
- **Frédéric Malle** — the *publishing metaphor* (the perfumer credited like an author; "Editions").
- **Le Labo** — the *anti-marketing apothecary voice* + lab/ledger register typography.
- **Santa Maria Novella** — the *batch/registry* document treatment (apothecary provenance).
- **The Paris Review / Apartamento** — the *single-column literary manuscript rhythm* and folios.
- **Maison Francis Kurkdjian** — the *restraint discipline* (one accent, vast quiet).
Combined, not copied: a perfumer's *letter* (Malle voice) typeset as a *manuscript*
(literary refs) with an *apothecary register* (SMN/Le Labo) — a combination none of them is.

## 6. Palette (emotional roles)
- `--bone   #F4F1EA` — ground (warm, not yellow-cream → dodges the cliché)
- `--bone-2 #ECE7DB` — ground at scroll-depth (imperceptible deepening)
- `--ink    #15130F` — display ink (near-black, warm)
- `--ink-2  #2A2620` — body ink
- `--muted  #8A8275` — marginalia / metadata
- `--ox     #7A1B12` — oxblood accent, used **only** in the register + closing signature
- `--rule   #CFC8B8` — hairlines

## 7. Font stack
- Display + body: **Newsreader** (literary serif w/ optical sizing & true italic — the letter voice)
- Marginalia / ledger / folios: **JetBrains Mono**
- No blacklisted fonts. Deliberately **not** Fraunces/Cormorant (the skill's over-used default).

## 8. Nav pattern
**Left-vertical spine**, brand set bottom-to-top like a book spine, with a scroll-progress
hairline filling the spine + folio markers. **Not** the three-column top bar.

## 9. Brand voice
First-person, a perfumer writing a letter. Dry, exacting, unsentimental about craft and
contemptuous of marketing. Speaks in measured declaratives. Never says "luxury,"
"experience," "journey," "elevate," or "indulge." Admits process and doubt.

## 10. Structure — every movement (one manuscript, 6 movements, no cards)
1. Colophon spine + opening folio (fixed left spine; house mark; folio 01).
2. The Letter — opening: oversized first line, flacon rising at the right bleeding off the column.
3. The Letter — the making: continuous prose; gutter marginalia (batch, maceration weeks, initials).
4. The Olfactory Register: ledger table of notes (head/heart/base) as tabular rows, mono, not cards.
5. The Register of Batches: numbered-batch ledger w/ vat, yield, provenance; oxblood lot numbers.
6. Closing & Colophon: verbatim sign-off, then a quiet mono colophon. **Not** an enquiry-form+grid.

## 11. Copy hooks (verbatim)
- Opening: *"This is not a perfume. It is a letter I kept rewriting until it smelled like the thing I meant to say."*
- Mid pull: *"We macerate for nine weeks because the eighth is a liar."*
- Closing: *"Wear it on the days you intend to be remembered. — H.B."*

## 12. Technical hooks (luxury)
Batch register rows (`BÉRARD · CÈDRE 19 · Lot 0019/A · Vat III · 312 flacons · Grasse · MMXXIV`),
material provenance (Virginia cedar, Florentine orris, ambrette from the Loire),
edition statement ("Extrait de Parfum · 24% · Edition of 19 batches, then the formula is retired"),
folio numerals in mono.

## 13. Motion choreography
1. Hero entry: clip-path `inset()` ink-rise reveal of the opening line, words staggered, `cubic-bezier(0.16,1,0.3,1)`.
2. Scroll-driven: ground tint deepens bone→bone-2 + left-spine progress hairline fills with scroll.
3. Micro-interaction: olfactory-register row hover slides a hairline + reveals the facet in oxblood mono.

## 14. Critical rules / banned moves
No top three-column nav. No cream+brass+Fraunces default. No card grids / box-shadow rounded
rectangles. No purple/blue gradients. No AOS fade-up. No enquiry-form+colophon-grid closing.
Single serif rhythm throughout. Oxblood appears ≤ twice.

## 15. Render verification checkpoint
Vite + Playwright screenshot @ 1440×900, full page. Verify: (a) SVG flacon visible,
proportional, intact, bleeding off the column (not a sliver, not covering text);
(b) one continuous serif column with correct rhythm; (c) left spine + progress hairline render;
(d) oxblood only in register + signature; (e) no horizontal overflow / scrollbar.
