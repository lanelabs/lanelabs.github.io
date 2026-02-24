# Forrest Clean Up

A kid-friendly browser game focused on restoring a forest through cleanup and planting.

## Play Locally

1. Open `/home/alane1/forrest-clean-up/index.html` in a browser.
2. Start playing immediately (no install required).

Optional local server:

```bash
cd /home/alane1/forrest-clean-up
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Controls

- Move: `WASD` or arrow keys (desktop) or on-screen joystick (mobile)
- Interact: `Space` (desktop) or `Interact` button (mobile)
- Tap/click interaction: acorns, litter spots, plant spots, ponds, animals, and trees
- Inspect mode: click animals or planted trees to view name/type/fact in sidebar
- Hover feedback: interactive objects glow and show pointer cursor
- Systems & Debug: open live panel for formulas, queue, counters, and current state
- Restart: `New Game` button
- Easier difficulty: `Toggle Easy Mode`

## Restoration Loop

- Clean litter spots to start flower growth.
- Cleaned zones spread a couple tiny flower patches nearby after about 1-2 minutes.
- Gather acorns and plant saplings.
- Planted saplings grow into larger trees over time.
- Mature trees drop an acorn once they fully grow.
- Surprise chains trigger later effects from your choices (e.g., cleanup -> fish return -> birds).
- As Eco Health rises, more wildlife appears.
- Day/night cycle runs on a 5-minute loop: 3 minutes day, 2 minutes night.
- Owls are visible only at night.
- Fireflies appear at night once restoration is high enough.

## Win State

You reach a “Forest Thriving” state when you hit restoration goals:

- 12 saplings planted
- 12 litter spots cleaned
- 90% Eco Health

After that, the game keeps running so you can continue restoring.

## Notes

- Best score is saved in browser local storage.
- The game is dependency-free (single HTML file), so it is easy to extend.
