---
name: unslop
description: Cut AI tells from any writing.
---

# Unslop

Edit text to remove AI patterns. Scan for the patterns below, then rewrite. Preserve meaning and match the intended tone.

Rule numbers are stable ids that other skills cite. A removed rule leaves a gap.

3. No trailing "-ing" phrases that add no fact ("highlighting...", "ensuring...").
5. No vague attributions ("experts believe"). Name the source or delete.
7. No AI vocabulary: additionally, crucial, delve, enhance, foster, landscape, pivotal, showcase, testament, underscore, vibrant.
8. Say "is" or "has", not "serves as", "stands as", "boasts", "features".
9. No "not just X, but Y". State the point.
10. Don't force ideas into threes.
11. One name per thing. Repeat it.
12. No "from X to Y" unless X and Y sit on a real scale.
13. No em dashes, en dashes, or hyphens used as dashes, and no parentheses in their place. Use a period or a comma.
14. A colon goes before a list or an example, never mid-sentence as a connector.
15. Don't bold every proper noun or acronym.
16. No bold label and colon that restates its line ("**Performance:** Performance improved..."). A bold lead-in that ends in a period and adds new detail is fine.
17. Sentence case headings.
18. No decorative emojis.
19. Straight quotes.
20. No chatbot phrases ("I hope this helps!", "Let me know if...").
22. No praise or agreement openers. Respond directly.
23. Cut filler. "In order to" becomes "to". Delete "it is important to note that".
24. One hedge at most: "may".
25. No generic conclusions. State specific plans or facts.
26. No abstract metaphor nouns: substrate, wedge, vector, nexus, primitive, harness, surface, scaffolding, paradigm, ratchet, north star, flywheel. Use the concrete word.
27. Say what it does, not how it feels. Name the mechanism or the number. Cut a sentence that could appear unchanged in another project's docs.
28. One idea per sentence. Split a sentence the reader has to reread.
29. Active voice. Name the actor unless it is unknown or doesn't matter.
30. Cut adverbs or use a stronger verb. Give the number.
31. Use the plain word: "use", not "utilize" or "leverage".
32. No metaphor, aphorism, personified code, or figurative verb where a literal phrase exists.
33. Write whole sentences with their articles and verbs. Spell out arrows and abbreviations.

## Select language guidance

Keep this skill as the entry point for writing checks. Select guidance by the language of the text being written or edited, not the language of the conversation.

Look in the current session's skill catalog for an available `unslop-<language>` candidate. Read its description and instructions before selecting it. The name alone does not establish that it applies: both the language and the task must match its scope.

When a candidate applies, use its editing process and language rules for that text instead of the patterns above. Preserve user instructions and project writing requirements. For mixed-language text, apply each selected skill only to the relevant passages.

For example, an external `unslop-ko` limited to Korean document editing takes precedence for that editing task, but not for ordinary Korean conversation. This skill's always-apply rule does not expand another skill's scope.

If no candidate is available or applicable, use only the patterns above that fit the text's language. Do not apply English vocabulary or grammar checks mechanically to other languages.

Language-specific skills are optional external extensions, not bundled dependencies. Resolve them through the session's catalog without fixed installation paths. Do not install a missing skill or require it to continue. Keep existing numbered rules stable for callers that cite them.
