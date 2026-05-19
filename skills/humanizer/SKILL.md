---
name: humanizer
description: >-
  Remove signs of AI-generated writing from text so it sounds natural and
  human-written. Use when editing or reviewing prose to strip AI tells —
  inflated symbolism, promotional language, superficial -ing analyses, vague
  attributions, em dash overuse, rule of three, AI vocabulary, negative
  parallelisms, and excessive conjunctive phrases — and to inject real voice.
  TRIGGER when the user says "humanize this", "make this sound less like AI",
  "remove AI tells", "de-slop", "make this sound human", or asks to edit text
  for a more natural voice. DO NOT TRIGGER for code refactoring or
  performance work.
origin: community
metadata:
  author: blader
  source: https://github.com/blader/humanizer
  version: "2.1.1"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---

# Humanizer: Remove AI Writing Patterns

Based on Wikipedia's "Signs of AI writing" guide, maintained by WikiProject AI
Cleanup. Detects and fixes the statistical patterns that mark text as
machine-generated, then adds the voice that makes writing feel human.

## When to Use

Use this skill when the user wants existing text edited to sound less like an
LLM and more like a person: blog drafts, docs, emails, marketing copy, READMEs,
release notes, social posts. It edits text — it does not generate new topics.

## Your Task

When given text to humanize:

1. **Identify AI patterns** — scan for the patterns listed below.
2. **Rewrite problematic sections** — replace AI-isms with natural alternatives.
3. **Preserve meaning** — keep the core message intact.
4. **Maintain voice** — match the intended tone (formal, casual, technical).
5. **Add soul** — don't just remove bad patterns; inject actual personality.

## Personality and Soul

Avoiding AI patterns is only half the job. Sterile, voiceless writing is just
as obvious as slop. Good writing has a human behind it.

**Signs of soulless writing (even if technically "clean"):**

- Every sentence is the same length and structure
- No opinions, just neutral reporting
- No acknowledgment of uncertainty or mixed feelings
- No first-person perspective when appropriate
- No humor, no edge, no personality
- Reads like a Wikipedia article or press release

**How to add voice:**

- **Have opinions.** Don't just report facts — react to them. "I genuinely
  don't know how to feel about this" is more human than neutrally listing pros
  and cons.
- **Vary your rhythm.** Short punchy sentences. Then longer ones that take their
  time getting where they're going. Mix it up.
- **Acknowledge complexity.** Real humans have mixed feelings. "This is
  impressive but also kind of unsettling" beats "This is impressive."
- **Use "I" when it fits.** First person isn't unprofessional — it's honest.
  "I keep coming back to..." signals a real person.
- **Let some mess in.** Perfect structure feels algorithmic. Tangents, asides,
  and half-formed thoughts are human.
- **Be specific about feelings.** Not "this is concerning" but "there's
  something unsettling about agents churning away at 3am while nobody's
  watching."

## Content Patterns

1. **Undue emphasis on significance, legacy, and broader trends** — inflated
   language like "pivotal moment," "marks a shift," "broader movement." Cut it
   or replace with the concrete thing that happened.
2. **Undue emphasis on notability and media coverage** — listing sources
   without context or emphasizing social media presence. State the fact, not
   that it was widely reported.
3. **Superficial analyses with -ing endings** — present-participle tails tacked
   on for fake depth ("...ensuring users can...", "...highlighting the role
   of..."). Delete the tail or make it a real, separate claim.
4. **Promotional / advertisement-like language** — "vibrant," "stunning,"
   "nestled," "breathtaking," "seamless." Replace with neutral, specific
   description.
5. **Vague attributions and weasel words** — "experts argue," "industry
   reports," "studies show" with no source. Name the source or drop the claim.
6. **Outline-like "Challenges and Future Prospects" sections** — formulaic
   "Despite its challenges..." wrap-ups. Remove or replace with specifics.

## Language and Grammar Patterns

7. **Overused AI vocabulary** — additionally, align with, crucial, delve,
   emphasizing, enduring, enhance, fostering, garner, highlight, interplay,
   intricate, key, landscape, leverage, pivotal, realm, robust, showcase,
   tapestry, testament, underscore, valuable, vibrant. Swap for plain words.
8. **Copula avoidance** — "serves as," "stands as," "marks," "represents,"
   "boasts," "features" used to dodge "is/are." Just use "is" / "are" / "has."
9. **Negative parallelisms** — "Not only... but...", "It's not just X, it's Y."
   Rewrite as a direct statement.
10. **Rule of three overuse** — forcing ideas into artificial triplets. Use one
    strong item or an honest list of whatever length the content needs.
11. **Elegant variation (synonym cycling)** — swapping synonyms to avoid
    repeating a word. Repeat the plain word; clarity beats variety.
12. **False ranges** — "from X to Y" where the endpoints aren't comparable.
    Name the actual items.

## Style Patterns

13. **Em dash overuse** — em dashes (—) used more often than natural writing.
    Prefer commas, periods, or parentheses; keep em dashes rare.
14. **Overuse of boldface** — mechanically bolding phrases for emphasis. Bold
    sparingly, only where it earns attention.
15. **Inline-header vertical lists** — bolded mini-headers followed by a colon
    in every list item. Use prose or a plain list instead.
16. **Title Case in headings** — capitalizing every main word. Use sentence
    case unless a style guide says otherwise.
17. **Emojis** — decorative emoji on headings/bullets. Remove unless the
    audience and tone genuinely call for them.
18. **Curly quotation marks** — smart/curly quotes where straight quotes are
    expected. Normalize to straight quotes for technical and code contexts.

## Communication Patterns

19. **Collaborative communication artifacts** — "I hope this helps," "Let me
    know if you need anything else," "Certainly!" Strip chatbot scaffolding.
20. **Knowledge-cutoff disclaimers** — "As of [date]," "Up to my last training
    update." Remove; state the fact plainly.
21. **Sycophantic / servile tone** — over-positive, people-pleasing phrasing.
    Make it direct and neutral.

## Filler and Hedging

22. **Filler phrases** — "in order to" → "to"; "due to the fact that" →
    "because"; "at this point in time" → "now."
23. **Excessive hedging** — "could potentially possibly." Commit, or state the
    real uncertainty once.
24. **Generic positive conclusions** — vague upbeat endings with no substance.
    End on a specific point or don't add a conclusion at all.

## Process

1. Read the input text carefully.
2. Identify all instances of the patterns above.
3. Rewrite each problematic section.
4. Ensure the revised text:
   - Sounds natural when read aloud
   - Varies sentence structure naturally
   - Uses specific details over vague claims
   - Maintains appropriate tone for context
   - Uses simple constructions (is/are/has) where appropriate
5. Present the humanized version.

## Output Format

Provide:

1. The rewritten text.
2. A brief summary of changes made (optional, if helpful).

## Full Example

**Before (AI-sounding):**

> The new software update serves as a testament to the company's commitment to
> innovation. Moreover, it provides a seamless, intuitive, and powerful user
> experience—ensuring that users can accomplish their goals efficiently. It's
> not just an update, it's a revolution in how we think about productivity.
> Industry experts believe this will have a lasting impact on the entire
> sector, highlighting the company's pivotal role in the evolving technological
> landscape.

**After (humanized):**

> The software update adds batch processing, keyboard shortcuts, and offline
> mode. Early feedback from beta testers has been positive, with most reporting
> faster task completion.

**Changes made:**

- Removed "serves as a testament" (inflated symbolism)
- Removed "Moreover" (AI vocabulary)
- Removed "seamless, intuitive, and powerful" (rule of three + promotional)
- Removed em dash and "-ensuring" phrase (superficial analysis)
- Removed "It's not just... it's..." (negative parallelism)
- Removed "Industry experts believe" (vague attribution)
- Removed "pivotal role" and "evolving landscape" (AI vocabulary)
- Added specific features and concrete feedback

## Reference

This skill is based on Wikipedia:Signs of AI writing, maintained by WikiProject
AI Cleanup. The patterns documented there come from observations of thousands
of instances of AI-generated text on Wikipedia.

> Key insight: "LLMs use statistical algorithms to guess what should come next.
> The result tends toward the most statistically likely result that applies to
> the widest variety of cases."

Original skill by **@blader** — <https://github.com/blader/humanizer>
