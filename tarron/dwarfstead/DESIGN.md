# Dwarfstead — Game Design Document

> *A cozy dwarf homesteading roguelite where you dig deep, build clever, and bring glory back to the mountain.*

## Elevator Pitch

You are a dwarven expedition leader sent from your mountain home to establish outposts in uncharted underground sites. Dig downward through layered terrain, discover buried ruins and caverns, build functional bases, and return home with resources and knowledge to unlock new capabilities. Each expedition is a fresh site with procedurally generated terrain, but your mountain home grows stronger between runs.

**Genre:** 2D Side-scrolling Roguelite / Base-builder / Colony-lite
**Tone:** Cozy craft — warm, cheerful, family-friendly. Dwarves are jolly craftfolk. Threats are "pesky" not terrifying.
**Platform:** Web (GitHub Pages, single-page app)
**Tech:** Vite + Phaser.js, minimal pixel art (8-16px sprites)

---

## Core Pillars

1. **Dig to Discover** — The earth holds secrets. Every block broken could reveal ore, a ruin, or a cavern full of surprises.
2. **Move the Mountain** — Nothing teleports into your inventory. Every block you carve must be pushed, hauled, hoisted, and stacked. Your tunnel network is a logistics system, not just a path.
3. **Build with Purpose** — Structures aren't decorative. Each building produces resources or grants bonuses that shape your strategy.
4. **Lead Your Kin** — You're not alone. Manage your Band of followers and station Stewards at key posts.
5. **Respect the Water** — The seasonal water table is the heartbeat of every expedition. Dig deep in dry season, retreat and fortify in wet season.
6. **Grow the Mountain** — Every expedition enriches your homeland. Unlock new tools, buildings, and dwarf specialties.

---

## The Expedition Map

The game's hub screen is a **top-down hex map** centered on your Mountain Home. This is where you pick missions, revisit cleared sites, and access your upgrades.

### Layout
- **Center hex:** Your Mountain Home (click to enter upgrade/tech tree view)
- **Surrounding hexes:** Expedition sites radiating outward in concentric rings
- Each hex has a **terrain type** that determines the biome and mission flavor:

| Terrain | Visual | Mission Flavor |
|---------|--------|----------------|
| Mountain | Snow-capped peaks | Rocky, ore-rich, vertical shafts |
| Forest | Dense canopy | Root networks, mushroom grottos, wood resources |
| Plains | Rolling grass | Shallow digs, wide sites, easy logistics |
| Desert | Sandy dunes | Sandstone layers, hidden oases, heat hazards |
| Swamp | Murky wetland | Aggressive water table, rare herbs, soggy terrain |
| River | Winding blue | Flooding risk, clay deposits, underground springs |
| Ocean Coast | Rocky shore | Coral caverns, salt deposits, tidal water cycles |
| Ruins | Crumbled towers | Dense ancient ruins, more relics, guardian encounters |

### Difficulty Scaling
- **Ring 1** (adjacent to Mountain Home): Easiest sites. Shallow depth, gentle water cycle, basic creatures.
- **Ring 2–3**: Moderate. Deeper terrain layers available, tougher creatures, more complex objectives.
- **Ring 4+**: Hard. Full depth, harsh water cycles, rare resources, dangerous guardians.
- Difficulty is visible on the hex (star rating or color intensity) so players can plan their expansion path.

### Site Persistence
- Each hex is a **persistent site**. Once generated, its seed is fixed.
- **Cleared sites** show a completion badge and can be revisited. The terrain regenerates from the same seed, but previously discovered rooms and built infrastructure are gone — it's a fresh expedition on familiar ground.
- **Revisiting** is useful for farming known-good terrain types or practicing before pushing to harder rings.
- **New sites** unlock as you complete missions in adjacent hexes, expanding your reach outward.

### Hex Interaction
- **Hover** a hex to see: terrain type, difficulty rating, available objectives preview, completion status
- **Click** a hex to open the mission briefing (objectives, terrain details, estimated rewards) with a "Depart" button
- **Click Mountain Home** to enter the upgrade screen (tech tree, dwarf roster, stockpile review)

### Map Progression
The map starts mostly shrouded. Only the Mountain Home and Ring 1 hexes are visible. Completing a site reveals adjacent hexes in the next ring. This creates a natural expansion pattern — you choose *which direction* to grow, and each direction offers different terrain and resources.

---

## The Run Loop

### 1. Departure
From the Expedition Map, select a hex to launch a mission. Each site is procedurally generated based on its terrain type, ring distance, and seed:
- Terrain composition determined by hex biome (forest = root-heavy, desert = sandstone, etc.)
- Depth and difficulty scale with ring distance from Mountain Home
- Objectives (drawn from a mixed pool — see Objectives below)
- Hidden features (ruins, caverns, creature lairs)

### 2. The Expedition
Arrive at the surface of your site. The world is a tall vertical column (2-3 screens wide) with depth as the primary axis. You dig downward, haul materials to the surface, build infrastructure both underground and topside, discover secrets, and manage your dwarves — all while the water table rises and falls. The surface becomes your logistics hub: sorting yard, stonecutter, trade post, and stockpile all live here.

### 3. Return Home
Complete your objectives (or choose to evacuate early at reduced reward). Whatever is physically in your **Stockpile** is what you bring home. Coin earned from the Trade Post carries over. Knowledge from ruins is remembered. Everything else stays at the site.

---

## Movement & Traversal

**No free jumping.** Your dwarf is a climber and digger. Traversal requires building infrastructure:

- **Walk** on flat ground and constructed floors
- **Climb** ladders, ropes, and scaffolding (must be built/placed)
- **Dig** in any cardinal direction with your pickaxe (breaks terrain blocks)
- **Slide** down slopes and loose terrain
- **Fall** if unsupported (with a short survivable distance; longer falls cause injury)

This means every vertical shaft needs a ladder. Every gap needs a bridge. Every expedition route is a deliberate investment in infrastructure. Combined with rising water, your tunnel network becomes a living system you must maintain and defend.

### Tool Progression (Meta-Unlocks)
- **Basic pickaxe** — slow dig, stone and soil only
- **Steel pickaxe** — faster, can break hard rock
- **Runic pickaxe** — breaks crystal, reveals hidden chambers
- **Rope kit** — place climbable ropes (cheaper than ladders, temporary)
- **Scaffolding kit** — quick temporary platforms
- **Reinforced supports** — prevent cave-ins in unstable terrain

---

## Material Handling — "No Magic Pockets"

**The standout mechanic.** There is no traditional inventory. When you mine a block, it drops as a physical object in the world. Getting it to the surface is the real work. This transforms every dig into a logistics puzzle: it's not just *where* you dig, but *how you'll get the goods out*.

### Core Principle
Materials exist physically in the game world. They obey gravity (fall off ledges), take up space, block paths, and must be moved through the infrastructure you build. Your "inventory" is your gear belt (pickaxe, rope kit, lantern) — nothing else.

### Design Feel: Cozy with Depth
Logistics should never feel punishing. Early game materials (topsoil, clay) are light and distances are short — hauling is easy, almost automatic. As you dig deeper, materials get heavier and distances grow. The challenge scales naturally with your ambition, not through punishment. Smart infrastructure makes you *feel* clever, not just survive. A poorly-planned mine is slower, never a fail state.

### Moving Materials

**By Hand (Main Dwarf)**
- **Push** — Shove a block along flat ground in the direction you face
- **Drag** — Pull a block behind you (slower, works on slopes)
- **Carry** — Pick up small items (gems, relics, mushrooms) and walk with them. One at a time.
- **Drop/Toss** — Release carried items. Toss them short distances (across a gap, down a shaft)

**By Band (Haulers)**
- Dispatch a Band member: "haul this block to the sorting yard"
- They pick it up, pathfind through your tunnel network, deliver it, and return
- Porters carry faster and can carry larger loads
- Multiple haulers can work a chain: one digs, one ferries to the lift, one runs the lift

**By Infrastructure**
- **Ramps & Slides** — Angled surfaces that blocks slide down via gravity. Cheap to build, one-directional (downhill only). Great for moving waste rock away from your dig face.
- **Lifts** — Vertical pulley systems. A dwarf (or you) cranks a wheel to raise/lower a platform. Haul materials up shafts, lower supplies down. The backbone of your vertical logistics.
- **Minecart Tracks** — Horizontal rail transport (meta-unlock). Lay tracks through tunnels, load a cart, give it a push. Faster than hauling, requires infrastructure investment.
- **Rope Buckets** — Simple vertical hauling. Attach a bucket to a rope, fill it, crank it up. Cheaper than a full lift, slower, smaller capacity.
- **Chutes** — Gravity-fed tubes for dropping material downward. Fast disposal, but material arrives at the bottom (careful near water level!).

### Surface Operations

The surface isn't just where you enter — it's your logistics hub:

- **Sorting Yard** — Designated area to stack materials by type. Ore here, stone there, gems in the lockbox. Organization affects efficiency.
- **Stonecutter's Bench** — Process raw stone blocks into cut building stone or sellable goods. Turns waste into value.
- **Trade Post** — Load formed goods onto a cart, dispatch a dwarf to sell. Returns coin after a delay. Your primary way to convert excess material into expedition earnings.
- **Waste Heap** — Dump filler rock you don't need. Takes up surface space. Letting it pile up clutters your operations and blocks paths. Managing waste is a real constraint.
- **Stockpile** — Secure storage for valuable materials earmarked for return to the mountain home. What's in the stockpile at run end is what you keep.

### Waste Management

Most of what you dig is **filler** — common dirt and rock, not valuable ore. This filler is a real problem:

- It takes up space in your tunnels if you don't move it
- It clutters the surface if you just dump it
- It blocks your logistics routes if it piles up

**Options for dealing with waste:**
- **Sell it** — Stonecutter processes it into cheap building material. Low value, but clears space.
- **Use it** — Backfill unstable tunnels, build walls, reinforce structures, create waterproof seals
- **Dump it** — Waste heap on surface. Quick but takes space. Overflow penalty if it gets too large.
- **Chute it** — Drop it into a deep shaft or flooded area (careful: blocks displace water!)

This creates a constant tension: every block you dig to go deeper creates a block you have to deal with. Efficient miners plan their waste routes before they start digging.

### Fantasy Logistics (Unlockable)

Later upgrades add magical/fantastical hauling options:
- **Enchanted Cart** — Self-propelled minecart that follows a set track loop automatically
- **Gravity Runes** — Placed on walls, they pull nearby blocks in a direction (conveyor-like)
- **Golem Porter** — A small stone construct that autonomously hauls between two points
- **Shrinking Powder** — Temporarily miniaturize a block for easier carrying (rare consumable)

---

## The Companion System

### Your Expedition Dwarves
You control one **main dwarf** directly. Other dwarves are recruited during runs or unlocked via meta-progression.

Companion dwarves exist in two states:

**The Band** (Following)
- Trail behind you in single-file with staggered movement lag (snake/Pikmin train)
- Each is a tiny 8px sprite with a colored hat/tool icon showing specialty
- Can be dispatched on errands: "mine this vein," "haul this block to the sorting yard," "run the lift," "build this ladder"
- Dispatched dwarves peel off the train, complete their task, then pathfind back to rejoin the tail
- Hauling is their bread and butter — a well-managed Band keeps materials flowing while you focus on digging
- Band size is limited (starts at 2, expandable through meta-unlocks)

**The Stewards** (Stationed)
- Assigned to buildings or defensive posts
- Provide bonuses while manning their post (forge Steward = faster smelting, wall Steward = defense bonus)
- Can be reassigned by visiting them or from a management UI
- Idle Stewards wait at the expedition base camp

### Dwarf Specialties
Each dwarf has a specialty that makes them better at certain tasks:
- **Miner** — digs faster, finds bonus ore
- **Builder** — constructs faster, structures are more durable
- **Porter** — carries more, moves faster with loads
- **Warden** — better at defense posts, spots creatures earlier
- **Brewer** — production buildings work faster (cozy dwarf priorities)

---

## The Underground

### Terrain Layers (Top to Bottom)
1. **Topsoil** — Soft, fast to dig. Roots, clay, earthworms. Surface structures here.
2. **Stone** — Standard rock. Iron and copper veins. Cave spider nests.
3. **Deep Stone** — Harder rock. Silver, gold, gems. Underground rivers. Mushroom grottos.
4. **Crystal Depths** — Glowing crystal formations. Rare minerals. Ancient ruins more common. Strange creatures.
5. **The Roots** — Deepest layer. Magma pockets, mythic artifacts, greatest rewards and dangers.

Each layer has:
- Unique block types and visual style
- Layer-specific resources
- Appropriate creatures and hazards
- Increasing difficulty and reward

### Hidden Discoveries
Embedded in the terrain are procedurally placed features you dig into accidentally:

- **Resource Caches** — Small pockets of concentrated ore or gems
- **Mushroom Grottos** — Underground gardens, source of food and rare ingredients
- **Ancient Ruins** — Stone chambers with artifacts, inscriptions, and sometimes guardians
- **Creature Lairs** — Nests that trigger combat encounters
- **Underground Springs** — Water sources (useful for base, dangerous during wet season)
- **Relic Vaults** — Major discoveries with powerful artifacts and tough guardians

---

## Encounters & Combat

### Discovery Flow
When you break into a hidden chamber:
1. The cavern is revealed — you can freely explore the space
2. Interacting with the main feature (artifact pedestal, creature nest, ruin entrance) triggers a prompt
3. **Non-combat:** Choose to take the artifact (may have a tradeoff), read the inscription (lore + small bonus), or leave it
4. **Combat:** If the room has hostile creatures, entering their territory triggers tactical combat

### Plan-and-Execute Combat
Combat is **turn-based and strategic**, not real-time:

1. **Assessment Phase** — See the enemies, terrain, and your dwarves' positions
2. **Planning Phase** — Give orders to each dwarf:
   - Main dwarf: fight, flee (set path), use item, take position
   - Band members: fight (hold position), flee to safety, guard a chokepoint, distract enemies
   - Stewards (if nearby): reinforce, hold walls, retreat to base
3. **Execution Phase** — Orders play out over a chunk of rounds (3-5 rounds)
4. **Reassess** — See results, give new orders
5. **Repeat** until enemies are defeated, you flee, or you're overwhelmed

Combat emphasizes:
- Positioning and chokepoints (use your tunnel infrastructure!)
- Protecting key dwarves (losing your Porter means abandoned loot)
- Knowing when to cut losses and run
- Using the environment (collapse a tunnel on enemies, flood a chamber)

### Creatures (Cozy-Scale Threats)
- **Cave Beetles** — Pesky, swarm in groups, easy individually
- **Rock Crabs** — Armored, slow, block tunnels
- **Mushroom Sprites** — Mischievous, steal items, flee when confronted
- **Crystal Bats** — Fast, annoying, attracted to light sources
- **Deep Worms** — Burrow through terrain, appear unexpectedly
- **Stone Golems** — Rare, tough, guard relic vaults. Respect the ancient protectors.

---

## The Water Cycle

The defining mechanic. Each expedition has a **seasonal water table** that rises and falls:

### Dry Season
- Water table is at its lowest
- Deep tunnels are accessible
- Best time for deep exploration and mining
- Springs are calm, underground rivers are shallow

### Wet Season
- Water table rises steadily from below
- Lower tunnels flood — anything not waterproofed is submerged
- Must retreat to higher ground or waterproofed areas
- Creatures flee upward too (increased surface encounters)
- Good time for building, crafting, and managing your base

### Water Mechanics
- **Flooding** — Water fills connected spaces from the bottom up. Sealed rooms stay dry.
- **Waterproofing** — Certain buildings and materials resist water. Upgraded walls hold back flooding.
- **Drainage** — Build pumps and channels to manage water in key areas
- **Diving** — Late-game unlock: diving gear lets you explore flooded areas briefly during wet season
- **Water damage** — Unprotected structures degrade when submerged. Repair during dry season.

The cycle creates a natural rhythm:
> Dry → Dig deep, explore, push limits → Water rises → Retreat, build, fortify → Water falls → Push deeper with better infrastructure → Repeat

---

## Buildings

### Production Buildings
Transform raw resources into useful goods. Materials must be physically delivered to input bays and collected from output bays — no teleportation.

| Building | Input | Output | Notes |
|----------|-------|--------|-------|
| Smelter | Raw ore blocks | Metal ingots | Foundation of tool crafting |
| Forge | Ingots | Tools, equipment | Upgrade pickaxes, build gear |
| Mushroom Farm | Spores + soil | Food | Feeds your dwarves |
| Kitchen | Raw food | Meals | Better food = better morale |
| Brewery | Grain + water | Ale | Peak dwarf happiness |
| Stonecutter | Raw stone blocks | Cut building stone | Also processes waste into sellable goods |
| Loom | Fibers | Rope, cloth | For ladders, bags, waterproofing |
| Trade Post | Cut stone, ingots, goods | Coin (delayed) | Dispatches a cart to sell. Clears material from site. |

### Perk Buildings
Provide passive bonuses when built and manned:

| Building | Bonus | Steward Effect |
|----------|-------|----------------|
| Watchtower | Reveals nearby hidden features | Extended detection range |
| Tavern | +Morale for all dwarves | Band works faster |
| Library | Identifies artifacts automatically | Bonus knowledge on return |
| Infirmary | Dwarves heal over time | Faster healing |
| Barracks | +Defense for all stationed dwarves | Stewards fight better |
| Stockpile | Secure storage for return haul | Porter bonus stacks |
| Sorting Yard | Organized surface storage, faster hauling | Steward auto-sorts incoming blocks |

### Building Placement
- Dig out a space in the terrain (freeform)
- Select a building blueprint from your unlocked set
- Place it in the carved space (must meet minimum room size)
- Assign a Steward to activate bonuses (optional but recommended)

---

## Meta-Progression: The Mountain Home

Between runs, you return to the Expedition Map. Clicking the **Mountain Home** hex opens the upgrade screen — a persistent **tech tree** where you spend expedition earnings.

### Currency
What's physically in your **Stockpile** at run end is what you bring home:
- **Cut Stone** — Processed at the Stonecutter. Common building material for the mountain home.
- **Ingots** — Smelted ore. Valuable, versatile.
- **Gems** — Found in veins, carried by hand. Rare, high value.
- **Relics** — From ruins and vaults. Unique items that unlock specific upgrades.
- **Coin** — Earned from Trade Post sales during the run. Liquid currency.
- **Knowledge** — From artifacts and inscriptions. Not physical — earned by interacting with ruins.

### Tech Tree Branches

**Tools & Equipment**
- Better pickaxes (faster dig, harder materials)
- Rope and scaffolding kits
- Waterproofing materials
- Diving gear
- Lanterns (reveal hidden features passively)

**Buildings**
- Unlock new building blueprints for expeditions
- Upgrade existing buildings (Smelter II, etc.)

**Dwarves**
- Increase max Band size
- Unlock new dwarf specialties
- Improve dwarf stats globally

**Expeditions**
- Unlock deeper/harder expedition sites
- Choose site modifiers (more ruins, richer ore, harsher water cycle)
- Unlock new objective types

---

## Objectives (Per-Run Goals)

Each expedition has 2-3 objectives drawn from a mixed pool:

### Resource Quotas
- "Deliver 20 iron ingots to the Stockpile" (mine ore → haul to smelter → smelt → haul ingots to stockpile)
- "Return with 5 gems in the Stockpile"
- "Sell 50 coin worth of goods through the Trade Post"

### Build Milestones
- "Establish a Forge at this site"
- "Build a Tavern and serve 10 meals"
- "Construct waterproof housing for your expedition"

### Depth & Discovery
- "Reach the Crystal Depths layer"
- "Discover and explore 3 hidden ruins"
- "Recover the site's Relic"

Completing all objectives = full reward. Partial completion = partial reward. Evacuating early = keep what you've already stockpiled.

---

## MVP Scope (v1)

The minimum playable slice:

### Included
- **Expedition Map:** Top-down hex grid with Mountain Home center, 2 rings of sites, 3-4 terrain types (Mountain, Forest, Plains, + one more), difficulty scaling by ring distance, site persistence and revisiting
- **Mountain Home screen:** Accessed by clicking center hex, shows tech tree (1 branch: Tools) and stockpile review
- Procedural expedition site generation (column + embedded caverns), seeded per hex
- 2 terrain layers (Topsoil + Stone) with basic block types
- Main dwarf with climber/digger movement
- **Physical material handling:** push/drag blocks, build lifts, rope buckets. No magic inventory.
- **Surface logistics:** sorting yard, waste heap, stonecutter, trade post
- 2 Band companions with basic dispatch (mine, haul blocks, run lifts)
- 3-4 underground buildings (Smelter, Forge, Mushroom Farm, Stockpile)
- Water cycle (simplified: 2 phases, steady rise/fall)
- 2-3 hidden room types (resource cache, small ruin with event prompt, creature lair)
- Basic plan-and-execute combat (1-2 creature types: Cave Beetles, Rock Crabs)
- 8-16px pixel art with simple tileset
- Gear belt (equipped tools only — pickaxe, rope kit, lantern)

### Deferred to Later Versions
- Outer hex rings (Ring 3+) and remaining terrain types (Desert, Swamp, Ocean Coast, Ruins)
- Deep terrain layers (Crystal Depths, The Roots)
- Full creature bestiary
- All building types
- Complete tech tree
- Minecart tracks and advanced logistics (enchanted carts, gravity runes, golem porters)
- Diving mechanics
- Environmental hazards (cave-ins, gas)
- Dwarf specialties beyond basic
- Music / ambient audio
- Save system persistence

---

## Technical Notes

- **Framework:** Vite + Phaser 3
- **Rendering:** Phaser tilemap for terrain, sprite sheets for dwarves/creatures/buildings
- **World Gen:** Seed-based procedural generation using noise functions for terrain + random placement for features
- **Source:** `tarron/dwarfstead/` (Vite project)
- **Build Output:** `docs/tarron/dwarfstead/`
- **Base Path:** `/tarron/dwarfstead/`

---

*Dwarfstead — Dig deep. Build well. Honor the mountain.*
