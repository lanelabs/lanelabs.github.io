# Template Dimensions

Every template can be described by its choices across these dimensions.
Each dimension has a short **tag** (used in template comments for quick scanning)
and a description of what it means in practice.

When designing new templates, pick dimensions that are underrepresented
in the current set. See the template comments in `src/data/general/templates.js`
for which tags are already in use.

Dimensions are grouped into four families:
- **Narrative Voice** (1-3): How the story is told
- **Characters & Relationships** (4-6): Who's in it and how they relate
- **Story Mechanics** (7-13): How the plot and elements work
- **Style & Feel** (14-18): The texture and tradition

---

# NARRATIVE VOICE

## 1. Voice

How is the prompt "spoken"? Who's narrating, and what's their stance?

| Tag               | Description                                                       |
|-------------------|-------------------------------------------------------------------|
| `classic`         | Third-person narrator: "In a castle, a fox and a wizard..."       |
| `direct-address`  | Speaks to the listener: "Imagine a fox — scared, alone..."        |
| `campfire`        | Oral storyteller energy: "Let me tell you about the time..."      |
| `bedtime-whisper` | Soft, intimate: "Tonight's story begins with..."                  |
| `legend`          | Mythic distance: "They say that long ago..."                      |
| `in-medias-res`   | Drops you in the middle: "It was already too late when..."        |
| `rhetorical`      | Poses a question: "What happens when a fox meets a wizard?"       |
| `warning`         | Reverse psychology: "This is not a gentle story..."               |
| `instructional`   | Practical authority: "If you ever need to befriend a troll..."    |
| `confessional`    | Narrator admits: "I should tell you something first..."           |
| `laconic`         | Dry understatement: "Tuesday was mostly uneventful, apart from the dragon" |

---

## 2. Opening Technique

The structural mechanism of the first words — distinct from voice.
Voice is WHO is speaking; opening technique is HOW they hook you.

| Tag                | Description                                                      |
|--------------------|------------------------------------------------------------------|
| `declarative`      | States what's happening directly: "In a castle..."               |
| `question-hook`    | Opens with a question that demands an answer                     |
| `rule-to-break`    | States a rule the reader knows will be violated                  |
| `everyone-knows`   | "Everyone knew X" — reader suspects X is wrong                   |
| `impossible-image` | A surreal or dreamlike image, stated matter-of-factly            |
| `interrupted-routine`| A pattern established and immediately broken                   |
| `catalog`          | A list of vivid details before narrative begins                  |
| `false-start`      | Narrator corrects themselves: "Actually, no — it begins with..." |
| `scalar-shift`     | Zooms from tiny to vast (or vast to tiny)                        |
| `dialogue-cold`    | A line of speech before any scene-setting                        |
| `sensory`          | A sound, smell, or texture before context                        |
| `contrast`         | Two sharply different images juxtaposed                          |

---

## 3. Temporal Structure

What order does the reader learn things in?

| Tag           | Description                                                       |
|---------------|-------------------------------------------------------------------|
| `linear`      | Events unfold in order: first this, then that                     |
| `end-first`   | We see the outcome, then rewind: "It all ended at..."            |
| `middle-first`| Starts in the thick of it: "They were already deep in..."        |
| `flashback`   | Frame story: "Looking back, it started with..."                   |
| `countdown`   | Urgency up front: "There wasn't much time..."                    |
| `parallel`    | Two threads shown separately before converging                    |
| `circular`    | Ends where it began, but everything has changed                   |

---

# CHARACTERS & RELATIONSHIPS

## 4. Character Dynamic

How do the two characters relate to each other?

| Tag                  | Description                                                   |
|----------------------|---------------------------------------------------------------|
| `strangers`          | Meeting for the first time                                    |
| `reluctant-partners` | Forced together: "neither wanted this"                        |
| `seeker`             | One goes looking for the other                                |
| `reuniting`          | They know each other: "hadn't seen each other in ages"        |
| `mentor-student`     | One has knowledge/experience the other needs                  |
| `rivals`             | They're at odds: "couldn't stand each other — until..."       |
| `helper`             | One finds the other in need                                   |
| `fragile-alliance`   | They need each other but don't trust each other               |
| `former-enemies`     | History between them: "last time, things ended badly"         |
| `protector-ward`     | One guards the other; the other resists protection            |
| `believer-skeptic`   | One is sure it's real; the other thinks it's nonsense         |
| `secret-between`     | They share everything except the one thing that matters       |

---

## 5. Character Agency

How actively do the characters drive the story?
This is the difference between "things happen to them" and
"they make things happen." A huge lever for feel.

| Tag              | Description                                                     |
|------------------|-----------------------------------------------------------------|
| `passive`        | Events happen to them: "drawn together" / "stumble into"        |
| `compelled`      | Forced to act: "must" / "have no choice but to"                 |
| `reluctant`      | Could act but doesn't want to: "the only one who can help"      |
| `proactive`      | Choosing to act: "sets out to" / "decides to"                   |
| `reactive`       | Responding to events as they unfold: "when X happens, they..."  |

---

## 6. Emotional Arc

The trajectory of feeling across the prompt. For two-paragraph
templates, this describes how P1's feeling relates to P2's.

| Tag              | Description                                                     |
|------------------|-----------------------------------------------------------------|
| `light-to-dark`  | Starts cheerful, trouble creeps in                              |
| `dark-to-light`  | Starts bleak, hope emerges                                      |
| `steady-build`   | Tension or wonder escalates throughout                          |
| `peak-resolve`   | Big moment in the middle, calm landing                          |
| `calm`           | Gentle throughout — a cozy wander, no sharp turns               |
| `surprise-pivot` | Everything points one way, then flips                           |
| `man-in-hole`    | Things start fine, get worse, then recover (most common shape)  |
| `cinderella`     | Rise, fall, rise higher — the ultimate feel-good arc            |
| `wind-down`      | Energy decreases throughout — scope narrows toward rest/sleep   |

---

# STORY MECHANICS

## 7. Tension Mechanism

What creates the pull — why does the reader lean forward?
Current templates mostly use `discovery`. This is the biggest
gap in the existing set.

| Tag                | Description                                                    |
|--------------------|----------------------------------------------------------------|
| `discovery`        | Curiosity about what they'll find: "stumble into" / "uncover"  |
| `ticking-clock`    | A deadline forces action: "before it's too late"               |
| `impossible-choice`| Two options, both costly: "they can't do both"                 |
| `secret`           | Something hidden is about to be exposed                        |
| `pursuit`          | Something is chasing or closing in                             |
| `scarcity`         | The last of something: "if it breaks, there won't be another"  |
| `forbidden`        | Rules exist to be broken: "never open the third door"          |
| `mismatch`         | Character and situation are ironically mismatched               |
| `question`         | A mystery posed directly: "Why does X only happen in Y?"       |
| `promise`          | A vow at stake: "they made a promise — keeping it costs"       |
| `rivalry`          | Someone else wants the same thing                              |

---

## 8. Stakes

What could be lost? Current templates leave stakes entirely
implied. Naming them makes stories feel personal and urgent.

| Tag              | Description                                                     |
|------------------|-----------------------------------------------------------------|
| `implied`        | Stakes exist but aren't spelled out                             |
| `personal-loss`  | A friendship, a home, a memory                                  |
| `identity`       | Who the character is or might become                            |
| `promise`        | Keeping one's word: "am I someone who follows through?"         |
| `scarcity`       | The last of something precious                                  |
| `belonging`      | A place that feels like home, about to change                   |
| `trust`          | A relationship that could break if the truth comes out          |
| `missed-moment`  | A chance that won't come again                                  |

---

## 9. Connection Logic

How do the random elements get stitched together narratively?

| Tag              | Description                                                     |
|------------------|-----------------------------------------------------------------|
| `discovery`      | They find/stumble upon things: "stumble into" / "uncover"       |
| `causal`         | Cause and effect: "Because of X, Y happened"                    |
| `coincidence`    | Fate or luck: "By chance, both arrived at..."                   |
| `inheritance`    | Something left behind: "Passed down" / "Left behind was..."    |
| `collision`      | Separate paths converge: "Two paths, one destination"           |
| `prophecy`       | Foretold or rumored: "It was said that..."                      |
| `trade`          | Exchange: "In exchange for X, they received Y"                  |
| `contradictory`  | Elements clash on purpose: tension from mismatch                |
| `symbolic`       | The item/setting stands for the theme                           |
| `assertion`      | "It's no coincidence that..." — narrator claims connection      |

---

## 10. Hook Role

What narrative job does the conflict/mystery play?

| Tag              | Description                                                     |
|------------------|-----------------------------------------------------------------|
| `central`        | The hook IS the story — everything revolves around it           |
| `background`     | The hook is the world they live in, not a single event          |
| `surprise-twist` | Everything seems fine, then the hook hits                       |
| `looming-threat` | The hook is coming and they know it                             |
| `past-event`     | The hook already happened — now they deal with consequences     |
| `shared-burden`  | Both characters carry the hook differently                      |
| `catalyst`       | The hook transforms who they are / kicks off change             |
| `reframed`       | The hook turns out to not be what it seemed                     |

---

## 11. Moral Integration

How the lesson/theme is delivered in the prompt.
Currently all templates use `label`. This is a big
opportunity for variety.

| Tag           | Description                                                        |
|---------------|--------------------------------------------------------------------|
| `label`       | Stated at the end as a tag: "a tale about courage"                 |
| `frame`       | Opens with the theme: "This is a story about what it means to..."  |
| `woven`       | Thread through the narrative: elements connect to the moral        |
| `question`    | Posed as something to discover: "...and whether courage is enough" |
| `implied`     | Never stated — the reader infers it from the story elements        |
| `tested`      | Moral is challenged: "...but is courage enough when..."            |

---

## 12. Mystery Level

How much does the prompt reveal vs. withhold?

| Tag              | Description                                                     |
|------------------|-----------------------------------------------------------------|
| `laid-out`       | All elements clearly stated — the reader sees everything        |
| `teaser`         | Some elements hinted but not fully revealed                     |
| `withhold-hook`  | P1 builds tension; the problem is only revealed in P2           |
| `withhold-moral` | Story described without stating the lesson — reader infers      |
| `question-based` | Prompt asks "What would you do if...?" — reader imagines        |

---

## 13. Spotlight

Which element anchors the opening and sets the tone for the whole prompt?

| Tag                  | Description                                                    |
|----------------------|----------------------------------------------------------------|
| `setting`            | The location grounds everything — we see the place first       |
| `character-emotional`| The emotional character's inner state leads the way            |
| `character-plain`    | The non-emotional character's ordinary life gets disrupted     |
| `character-both`     | Both characters introduced together, equal weight              |
| `weather`            | Atmosphere/conditions dominate — weather is a force, not decor |
| `weather-adj`        | Weather modifies the setting as a combined image               |
| `hook`               | The conflict or mystery opens the story                        |
| `item`               | A mysterious object kicks everything off                       |
| `opening`            | The opening moment/scene is described richly before anything   |
| `moral`              | The theme or lesson frames the story up front                  |
| `tone`               | The mood is established before characters or events            |
| `story-shape`        | The type of journey is declared before we meet the players     |

---

# STYLE & FEEL

## 14. Structure

The physical shape of the prompt text.

| Tag              | Description                                                     |
|------------------|-----------------------------------------------------------------|
| `two-para`       | Two paragraphs: setup / evolution                               |
| `three-beat`     | Three sections: scene / complication / stakes                   |
| `single-turn`    | One flowing paragraph with an internal pivot                    |
| `hook-plus-para` | One punchy opening line, then a paragraph                       |
| `bookend`        | Opens and closes with the same image or phrase                  |
| `list-like`      | Fragmented beats: "A fox. A castle. A secret. Between them..." |
| `dialogue`       | Opens with a line of speech or thought                          |
| `wind-down`      | Scope and energy narrow progressively — toward sleep            |

---

## 15. Sentence Rhythm

The cadence and length of the writing itself.

| Tag              | Description                                                     |
|------------------|-----------------------------------------------------------------|
| `flowing`        | Long, connected sentences with clauses that build on each other |
| `short-punchy`   | Brief declarative sentences: "A fox. A castle. A storm."        |
| `mixed`          | Short setup, long payoff (or vice versa)                        |
| `fragmented`     | Poetic, incomplete: "Moonlit. Cold. Two strangers. One secret." |
| `long-then-short`| Flowing paragraph capped by a punchy kicker                     |
| `rhythmic`       | Musical quality: repetition, parallel structure, alliteration   |

---

## 16. Item Role

What does the item DO in the story?

| Tag        | Description                                                         |
|------------|---------------------------------------------------------------------|
| `key`      | Unlocks or solves: "holds the key" / "opens the way"                |
| `symbol`   | Represents something larger: "everything they're fighting for"      |
| `catalyst` | Triggers change: "the moment they touched it, everything changed"   |
| `comfort`  | Grounding: "the only familiar thing in a strange place"             |
| `clue`     | Reveals information: "hidden inside was the answer"                 |
| `gift`     | Received or inherited: "left behind by someone who came before"     |
| `burden`   | A weight to carry: "they had to protect it, no matter the cost"     |
| `last`     | The last of its kind: scarcity gives it weight                      |

---

## 17. Scale

How big does the story feel?

| Tag          | Description                                                        |
|--------------|--------------------------------------------------------------------|
| `intimate`   | Small and personal: "two friends, one garden, one afternoon"       |
| `local`      | A contained adventure: "across the village" / "through the forest" |
| `epic`       | Sweeping: "across the realm" / "the fate of..."                    |
| `internal`   | Psychological: "inside their mind..." / "a battle with themselves" |
| `microscopic`| A single moment magnified: "in the space of a heartbeat..."       |

Scope can also have a trajectory:
- `expanding`: starts small, grows outward (home → world)
- `contracting`: starts wide, narrows inward (world → home → sleep)
- `stable`: stays at one level throughout

---

## 18. Genre Feel

The storytelling tradition the prompt evokes — independent of tone.

| Tag               | Description                                                    |
|-------------------|----------------------------------------------------------------|
| `neutral`         | No specific tradition — modern narrative prose                 |
| `fairy-tale`      | "Once upon a time..." / "Long ago and far away..."            |
| `fable`           | Moral-forward, animal characters feel intentional              |
| `tall-tale`       | Exaggeration, humor: "you won't believe this"                 |
| `ghost-story`     | Atmospheric, slow reveal, creeping dread                       |
| `adventure-serial`| Episode energy: "Chapter one:" / cliffhanger feel             |
| `lullaby`         | Soft, rhythmic, repetitive phrasing                            |
| `myth`            | Origin story: "This is the story of how [X] came to be"       |
| `campfire-legend` | Passed down orally: "They say..." / "The old stories tell..." |
| `anti-fairy-tale` | Subverts the expected: "She's a princess. She'd rather not be."|
