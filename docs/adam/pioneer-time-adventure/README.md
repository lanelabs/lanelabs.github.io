# Pioneer Time Adventure

A story-driven, choice-based learning game for early readers. Join Addie and Caleb as they explore pioneer life, collect Field Notes, and make decisions that affect the journey.

## Play Locally

1. Open `/home/alane1/learning-game/index.html` in a browser.
2. Start playing immediately (no install required).

Optional local server:

```bash
cd /home/alane1/learning-game
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

---

## Snapshot (What We Built)
- **Format:** Choice-based, story-driven learning game in a single `index.html`.
- **Audience:** Early elementary reader (age 6+), Magic Tree House vibe, adventurous tone.
- **Theme:** Early America pioneers.
- **Core Loop:** Read scene → choose → see outcome → gain facts/items/stats → continue.
- **Collectibles:** Field Notes (Fact Cards) with icons.
- **Inventory:** `rope`, `water`, `blanket`.
- **Stats:** Coins, Morale, Supplies (icons only).
- **Economy:** Coins earned before store; store allows multiple purchases; trading requires items.
- **Progress:** Journey Map shows visited scenes and current location.
- **Art:** Inline SVG illustrations and icons (no external assets).
- **Persistence:** `localStorage` (saves progress on this device/browser).

## Scene Flow (Current)
Order shown by Journey Map:
1. Camp
2. Prairie
3. Storm
4. Trail Day
5. Creek
6. Wildlife
7. Ridge
8. Town
9. Market
10. Work Stop
11. Store
12. Repair
13. River
14. Trading
15. Homestead
16. Campfire
17. Night
18. Dawn
19. Portal

## Mechanics Tied To Choices
- Early items unlock later choices and improved outcomes.
- Coins are earned before the store; store loops until you leave.
- Trading post options only appear if you have the relevant items.
- Stats impact options (e.g., snack/breakfast require Supplies).

## What’s Working Well
- Clear, kid-friendly loop with low friction.
- Meaningful but simple systems (items, coins, morale, supplies).
- Story matches the Magic Tree House vibe.
- No setup; single file works offline.

## Risks / Watchouts
- Story length is now ~19 scenes; may feel long for short sessions.
- Repeated stats/choices could feel samey without more unique outcomes.
- Items are permanent (no “consume”), so inventory can feel static after store.
- Only one major branch at a time; most scenes funnel to the same next scene.

## Design Goals (Draft)
- Keep choices meaningful without punishing mistakes.
- Encourage curiosity and rereading.
- Short enough for a session, but with plenty to explore.
- Collectibles should feel like a “storybook journal.”

## Ideas To Explore Next
- Add 1–3 optional scenes that trigger from stats (e.g., morale high/low).
- “Use item” choices that consume inventory for bigger payoff.
- More varied mini-objectives (find, trade, repair, help).
- New time periods as future story packs.
- Clickable vocabulary words with simple definitions.

## TODO
- Allow inventory items to be removed when traded away (consumption).

## Sharing Options (Early Thoughts)
- **Local share:** Copy the project folder and open `index.html` in a browser.
- **Zip file:** Bundle `learning-game/` and send via email or message.
- **Static hosting:** GitHub Pages, Netlify, or Vercel for a shareable URL.
- **Offline app:** Wrap in a tiny desktop app (Electron/Tauri) if needed later.

## Open Questions
- Preferred session length (time per playthrough)?
- Should the game allow multiple “chapters” per time period?
- Should items be consumed when used?
- How much branching is enough vs. too much?
