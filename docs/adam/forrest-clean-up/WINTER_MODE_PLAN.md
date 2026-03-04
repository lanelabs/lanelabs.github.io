# Forrest Clean Up Winter Mode Plan (Draft v0)

Last updated: 2026-03-04

## Goal

Add a selectable `Winter` game mode that loads a distinct winter map and mechanics, while keeping current forest mode intact.

## Phase 1 Scope (Requested)

1. Add a basic mode selector in the game menu.
2. Selecting `Winter` generates/loads a second map.
3. Winter visuals replace forest visuals appropriately.
4. Include one large frozen pond.
5. Disable planting + sapling mechanics in winter mode.
6. Shovel interaction on frozen pond:
   - each hit increases cracks at hit spot
   - at 10 hits, pond ice breaks at that spot (hole opens)
7. Shovel interaction on snowy ground creates snowballs.

## Out Of Scope (Phase 1)

1. Full seasonal progression system (spring/summer/fall transitions).
2. New win conditions specific to winter.
3. Advanced ice physics (sliding, cracking spread simulation).
4. Multiplayer/shared map state.

## Implementation Plan

### 1. Mode Architecture

1. Add `state.gameMode` with values: `forest` | `winter`.
2. Add menu control: `Mode: Forest / Winter`.
3. On mode change:
   - confirm reset/reload behavior (see questions)
   - regenerate world data for selected mode
   - refresh UI/messages/tooltips for mode
4. Save format:
   - include `gameMode` in save payload
   - support either one shared save or per-mode saves (decision needed)

### 2. World Generation Split

1. Refactor world generation into mode-specific entry points:
   - `generateForestWorld()`
   - `generateWinterWorld()`
2. Winter world baseline:
   - same world bounds
   - large central or semi-central frozen pond
   - reduced/disabled plant-specific entities
3. Keep shared systems where possible (camera, controls, rendering pipeline, save flow).

### 3. Winter Visual Pass

1. Ground palette -> snow/ice palette.
2. Trees/foliage -> winterized variants (desaturated, sparse leaves).
3. Water rendering:
   - frozen pond base texture + crack overlays
   - optional subtle snow drift details
4. HUD/tutorial copy updates for winter actions.

### 4. Disable Planting/Sapling In Winter

1. Disable sapling spot creation in winter.
2. Disable planting interactions and acorn-for-plant loop in winter.
3. Hide/replace planting guidance and quest references in winter.
4. Guard existing planting code paths with mode checks so winter cannot enter them accidentally.

### 5. Frozen Pond Crack Mechanic

1. Add `winterIceCells` or similar data model for breakable pond regions.
2. On shovel hit inside frozen pond:
   - increment local hit count at impacted ice cell
   - update crack stage visuals progressively
3. At hit count `>= 10`:
   - mark cell as broken/open water
   - render hole (no ice fill)
4. Persist crack/break state in save.

Suggested crack stages:
1. hits 1-2: hairline crack
2. hits 3-5: branching crack
3. hits 6-9: dense fracture
4. hit 10: break-through hole

### 6. Snowball Creation Mechanic

1. On shovel use over valid snowy ground (not pond/stream/invalid zones):
   - spawn snowball entity at/near hit point
2. Add limits:
   - max active snowballs
   - minimum spacing
3. Add simple snowball rendering.
4. Persist snowballs in save.

### 7. UX / Messaging

1. Add short winter tutorial message on mode start.
2. Update menu text to explain that winter is a separate map/mode.
3. Add feedback messages:
   - crack progress cues
   - ice break confirmation
   - snowball created

### 8. QA / Acceptance

Phase 1 is complete when:
1. User can switch to Winter from menu and get a distinct winter map.
2. Large frozen pond is present and visibly frozen.
3. Planting/sapling interactions do not work in winter.
4. Repeated shovel hits crack pond ice progressively and break at 10 hits.
5. Shovel on snowy ground creates snowballs.
6. Save/load preserves selected mode and winter world state.

## Proposed Build Order

1. Mode state + menu selector + save schema.
2. Mode-specific world generation (winter map skeleton).
3. Winter rendering pass.
4. Disable planting/sapling in winter.
5. Implement crackable pond cells + visual stages.
6. Implement snowball generation.
7. QA pass and bug fixes.

## Risks / Technical Notes

1. Current game is single-file (`index.html`), so feature isolation by mode guards is critical.
2. Existing quest/progression systems are plant-centric; winter mode needs temporary suppression or alternate text to avoid broken instructions.
3. Save migration must tolerate old saves without `gameMode`.
4. Input overlap is already sensitive; shovel interactions should use the same robust pointer handling as current tools.

## Decisions Log

1. Q1: Mode switch happens only when player clicks `Start` (not immediate on selector change).
2. Q2: Use one shared save slot across modes.
3. Q3: Preserve world progress per mode inside the shared save (no reset on mode switch).
4. Q4: Existing players default to `Forest` mode on first winter release.
5. Q5: `New Game` resets both modes.
6. Q6: Winter map uses the same world size (`1600x920`).
7. Q7: Large frozen pond placement is random.
8. Q8: Use two frozen ponds in winter phase 1.
9. Q9: No stream in winter mode.
10. Q10: Disable litter spawns in winter; allow acorn spawns.
11. Q11: Winter daytime palette should be fully cold blue-gray.
12. Q12: Winter night darkness should stay similar to current mode for now.
13. Q13: Snow palette uses blue-gray base with clean white highlights (and cool-blue shadows).
14. Q14: Keep evergreen trees prominent, mixed with some bare trees.
15. Q15: Include falling snow particles in phase 1.
16. Q16: Hide all planting-related mechanics and UI in winter mode.
17. Q17: Winter uses separate map/entities; no carryover of planted forest trees.
18. Q18: Watering mechanic is fully disabled in winter mode.
19. Q19: Acorns can spawn and remain collectible in winter mode.
20. Q20: Ice hit counts only from click/tap on ice while shovel is equipped.
21. Q21: Crack progress is localized per impact spot/cell (not pond-wide shared).
22. Q22: After a hole forms, additional hits do not expand it; play a tiny splash animation.
23. Q23: Broken ice holes refreeze after 10 in-game clock minutes.
24. Q24: No cap on simultaneous broken holes in phase 1.
25. Q25: No gameplay consequence for stepping onto broken holes in phase 1.
26. Q26: Every valid shovel hit on snowy ground creates a snowball.
27. Q27: Snowballs use a rolling cap of 30 (newest spawns, oldest removed).
28. Q28: Snowballs are decorative only in phase 1.
29. Q29: Snowballs do not melt/despawn by timer; they persist until replaced by rolling cap.
30. Q30: Allow snowballs near pond edges on snowy ground, disallow on ice, and always block UI zones.
31. Q31: Auto-equip shovel when entering winter mode.
32. Q32: Keep current tap-to-toggle tool behavior for now.
33. Q33: Winter shovel actions (ice crack/snowball) work anywhere clicked for now (no proximity requirement).
34. Q34: Hide quest widget/list entirely in winter phase 1.
35. Q35: Hide eco score in winter mode (phase 1).
36. Q36: Winter mode is sandbox-only in phase 1 (no win state).
37. Q37: Add distinct small visual feedback for shovel-on-ice vs shovel-on-snow in phase 1.
38. Q38: Add stronger visual feedback on hit 10 ice break (burst-style animation).
39. Q39: Deliver desktop and mobile support in phase 1.
40. Q40: Phase 2 should include both winter-specific quests and expanded winter interactions/systems.

## Follow-Up Questions (Need Decisions)

### Mode + Save Behavior

1. Should mode switch happen immediately, or only after pressing a `Start/Apply` button?  
   Answer: Only after pressing `Start`.
2. Should each mode have its own save slot (`forest-save` + `forest-save-winter`)?
   Answer: One shared save slot.
3. If using one save slot, should switching mode reset world progress each time?
   Answer: Preserve progress per mode within shared save.
4. On first release, should existing players default to `forest` mode automatically?
   Answer: Yes, default to `Forest`.
5. Should `New Game` reset only current mode or both modes?
   Answer: Reset both modes.

### Winter Map Layout

6. Should winter map keep same world size (`1600x920`)?
   Answer: Yes, keep `1600x920`.
7. Where should the large frozen pond be placed: center, upper area, lower area, or random?
   Answer: Random.
8. Should there be only one frozen pond in winter phase 1?
   Answer: No, use two frozen ponds.
9. Keep stream visible in winter, or fully frozen/removed?
   Answer: No stream in winter (removed).
10. Keep acorns/litter spawns in winter, or modify/remove some?
   Answer: Keep acorns; disable litter in winter.

### Visual Direction

11. Do you want daytime sky still green/blue-ish or fully cold blue-gray?
   Answer: Fully cold blue-gray.
12. Should night be darker than current mode or similar brightness?
   Answer: Similar darkness for now.
13. Should snow be clean white or slightly blue/gray for contrast?
   Answer: Slightly blue/gray base with clean white highlights.
14. Should trees be mostly bare, or keep some evergreens prominent?
   Answer: Keep evergreens prominent, with some bare trees mixed in.
15. Want falling snow particles in phase 1, or static winter visuals only?
   Answer: Falling snow particles in phase 1.

### Planting Removal Details

16. Remove only planting actions, or also hide all planting UI counters/goals?
   Answer: Hide all planting-related things.
17. Should existing planted trees from forest mode ever appear in winter mode? (if shared save)
   Answer: No; separate map/entities for now.
18. Should watering mechanic be fully disabled in winter?
   Answer: Yes, fully disabled in winter.
19. Should acorns still be collectible in winter?
   Answer: Yes, acorns can spawn and be collectible in winter.

### Ice Crack Mechanic

20. Define a “hit”: one shovel click/tap only, or also keyboard interact near pond?
   Answer: Click/tap on ice only, with shovel equipped.
21. Should crack count be per exact spot/cell (localized), or shared across whole pond?
   Answer: Localized per spot/cell.
22. After ice breaks at a spot, can player keep hitting same hole (no effect) or should it expand?
   Answer: No expansion after break; show a small splash animation on further hits.
23. Should broken ice holes be permanent for that run/save?
   Answer: No. Holes refreeze after 10 in-game clock minutes.
24. Should there be a max number of breakable holes?
   Answer: No cap for phase 1.
25. Any danger/consequence for stepping onto broken holes (phase 1 likely none)?
   Answer: No consequence in phase 1.

### Snowball Mechanic

26. Should every valid shovel hit on snow create a snowball, or chance-based?
   Answer: Every valid hit on snowy ground.
27. Max snowballs allowed at once?
   Answer: Rolling cap of 30; creating a new one removes the oldest.
28. Should snowballs be purely decorative in phase 1, or interactable/pushable?
   Answer: Decorative only for now.
29. Should snowballs melt/despawn over time?
   Answer: Stay (no timed despawn).
30. Can snowballs be created near pond edges and UI-blocked zones?
   Answer: Allow near pond edges if snowy ground; disallow on ice; always block UI zones.

### Tool + Input

31. Should shovel auto-equip when entering winter mode?
   Answer: Yes.
32. Keep current tap-to-toggle tool behavior, or restore explicit tool dropdown?
   Answer: Keep tap-to-toggle for now.
33. Should crack/snowball action require being within player range, or anywhere clicked?
   Answer: Anywhere clicked for now.

### Gameplay + Goals

34. Keep existing quest list in winter for now, or hide quest widget entirely in winter phase 1?
   Answer: Hide in winter for now.
35. Should eco score still run in winter mode?
   Answer: Hidden in winter mode.
36. Should winter mode have a win state in phase 1, or sandbox only?
   Answer: Sandbox only.

### Audio / Feedback (If Any)

37. Add distinct shovel-on-ice vs shovel-on-snow messages now, or later?
   Answer: Yes now, with small visual feedback.
38. Want stronger visual feedback at hit 10 (small burst/animation)?
   Answer: Yes.

### Delivery

39. Should phase 1 target desktop first, then mobile adjustments?
   Answer: Both in phase 1.
40. After phase 1, should phase 2 focus on winter-specific quests or additional winter interactions?
   Answer: Both.
