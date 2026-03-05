import { useState } from 'react';
import * as general from './data/general';
import * as fantasy from './data/fantasy';
import * as scifi from './data/scifi';
import * as modern from './data/modern';
import * as ocean from './data/ocean';
import { getCreatureNames } from '@data/creatures';
import {
  NUM_CHARACTERS, NUM_CONFLICTS, NUM_ITEMS, NUM_MORALS,
  NUM_TONES, NUM_WISHES, NUM_ROLES,
} from './config';
import { flavorLines } from './data/general/flavorLines';
import './App.css';

const worlds = { fantasy, scifi, modern, ocean };

const worldLabels = {
  fantasy: 'Fantasy',
  modern: 'Modern',
  scifi: 'Sci-Fi',
  ocean: 'Under the Ocean',
};

function pickRandom(array, count) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function mergeArrays(modules, key) {
  return modules.flatMap((mod) => mod[key] || []);
}

// Strip a leading article ("A ", "An ", "The ") from a string.
function stripArticle(str) {
  return str.replace(/^(a |an |the )/i, '');
}

// Pick "a" or "an" based on the first letter of the following word.
function aOrAn(word) {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

// Format a character name with article: "a farmer", "an owl".
function formatCharacterPlain(name) {
  const lower = name.toLowerCase();
  return `${aOrAn(lower)} ${lower}`;
}

// Format a character name with emotion baked in.
// Pre-emotions go before: "a scared farmer" / "an embarrassed farmer"
// Post-emotions go after: "a farmer who is afraid of the dark"
function formatCharacterEmotional(name, emotion) {
  const lower = name.toLowerCase();
  if (emotion.position === 'before') {
    return `${aOrAn(emotion.text)} ${emotion.text} ${lower}`;
  }
  return `${aOrAn(lower)} ${lower} who is ${emotion.text}`;
}

// Display a value that may be a string or an object with forms.
// Used by the list view to show the primary text.
function displayValue(val) {
  if (val != null && typeof val === 'object') return val.full;
  return val;
}

// Expand a picked data value into the flat values map with all its forms.
// - Strings are treated as { full: str } with 'bare' auto-computed by
//   stripping the leading article.
// - Objects define explicit forms; 'bare' is still auto-computed if missing.
// Template authors can add custom forms to data objects when needed.
function addForms(values, key, rawValue) {
  const isObj = rawValue != null && typeof rawValue === 'object';
  const full = (isObj ? rawValue.full : rawValue).toLowerCase();
  const bare = isObj && rawValue.bare != null
    ? rawValue.bare.toLowerCase()
    : stripArticle(full);

  values[key] = full;
  values[`${key}.bare`] = bare;

  if (isObj) {
    for (const [form, val] of Object.entries(rawValue)) {
      if (form !== 'full' && form !== 'bare') {
        values[`${key}.${form}`] = val.toLowerCase();
      }
    }
  }
}

// Default placeholder → CSS label-color class mapping.
// Dot-suffixed keys (e.g. "wish.bare") inherit from the base name.
const placeholderColors = {
  setting: 'label-settings',
  event: 'label-settings',
  weather: 'label-weather',
  aWeatherAdj: 'label-weather',
  character1: 'label-characters',
  character2: 'label-characters',
  item: 'label-items',
  hook: 'label-conflicts',
  role: 'label-roles',

  wish: 'label-wishes',
  tone: 'label-tones',
  aTone: 'label-tones',
  moral: 'label-morals',
};

// Parse a template string into an array of JSX elements with color-coded values.
// Supports dot notation: {wish.bare} resolves the "bare" form.
// Capitalised first letter (e.g. {Character1}) auto-capitalises the value.
// Optional `colors` override lets the caller customise per-placeholder classes.
function applyTemplate(template, values, colors) {
  const parts = [];
  let lastIndex = 0;
  const regex = /\{([\w.]+)\}/g;
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push(template.slice(lastIndex, match.index));
    }
    const key = match[1];
    const isCapitalised = key[0] === key[0].toUpperCase();
    const lowerKey = key[0].toLowerCase() + key.slice(1);
    const baseName = lowerKey.split('.')[0];
    const value = values[lowerKey];
    if (value == null) {
      parts.push(`{${key}}`);
    } else {
      const display = isCapitalised
        ? value[0].toUpperCase() + value.slice(1)
        : value;
      const colorMap = colors || placeholderColors;
      const colorClass = colorMap[baseName] || '';
      parts.push(
        <span key={match.index} className={`template-value ${colorClass}`}>
          {display}
        </span>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < template.length) {
    parts.push(template.slice(lastIndex));
  }

  // Auto-fix a/an before resolved placeholders so templates don't need to
  // worry about whether a value starts with a vowel or consonant.
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof parts[i] !== 'string') continue;
    const next = parts[i + 1];
    if (!next || typeof next === 'string') continue;
    const nextText = next.props?.children;
    if (typeof nextText !== 'string' || !nextText) continue;
    const startsWithVowel = /^[aeiou]/i.test(nextText);
    parts[i] = parts[i].replace(/\b(an?)([\s]+)$/i, (_, article, space) => {
      const upper = article[0] === 'A';
      if (startsWithVowel) return (upper ? 'An' : 'an') + space;
      return (upper ? 'A' : 'a') + space;
    });
  }

  return parts;
}

export default function App() {
  const [result, setResult] = useState(null);
  const [selectedWorlds, setSelectedWorlds] = useState({
    fantasy: true,
    scifi: true,
    modern: true,
    ocean: true,
  });
  const [singleWorld, setSingleWorld] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [useTemplate, setUseTemplate] = useState(true);
  const [copied, setCopied] = useState(false);

  function toggleWorld(world) {
    setSelectedWorlds((prev) => ({ ...prev, [world]: !prev[world] }));
  }

  function generate() {
    const checked = Object.entries(selectedWorlds)
      .filter(([, on]) => on)
      .map(([key]) => key);

    let activeMods;
    let picked;
    if (checked.length === 0) {
      activeMods = [general];
    } else if (singleWorld) {
      picked = checked[Math.floor(Math.random() * checked.length)];
      activeMods = [general, worlds[picked]];
    } else {
      activeMods = [general, ...checked.map((k) => worlds[k])];
    }

    const creatureWorlds = ['general'];
    if (singleWorld && picked) {
      creatureWorlds.push(picked);
    } else {
      creatureWorlds.push(...checked);
    }
    const allAnimals = getCreatureNames(creatureWorlds);

    const allPeople = mergeArrays(activeMods, 'people');
    const allSettings = mergeArrays(activeMods, 'settings');
    const allItems = mergeArrays(activeMods, 'items');
    const allDescriptors = mergeArrays(activeMods, 'descriptors');
    const allWeather = mergeArrays(activeMods, 'weather');
    const allEvents = mergeArrays(activeMods, 'events');

    const isMystery = Math.random() < 0.5;
    const hookType = isMystery ? 'Mystery' : 'Conflict';
    const hookPool = isMystery ? general.mysteries : general.conflicts;

    // Pick emotion from combined pre + post list (equal odds per item).
    const allEmotions = [
      ...general.preEmotions.map((e) => ({ text: e, position: 'before' })),
      ...general.postEmotions.map((e) => ({ text: e, position: 'after' })),
    ];
    const pickedEmotion = pickRandom(allEmotions, 1)[0];

    const characters = pickRandom([...allPeople, ...allAnimals], NUM_CHARACTERS);

    const weatherVal = pickRandom(allWeather, 1)[0];
    const settingVal = pickRandom(allSettings, 1)[0];
    const eventVal = pickRandom(allEvents, 1)[0];

    // Resolve pipe choices in the template (e.g. {setting|event} → {setting}
    // or {event}). This runs once at generation time so the choice is stable
    // across re-renders.
    let templateStr = pickRandom(general.templates, 1)[0];
    templateStr = templateStr.replace(
      /\{([\w.]+(?:\|[\w.]+)+)\}/g,
      (_, pipeGroup) => {
        const options = pipeGroup.split('|');
        return `{${options[Math.floor(Math.random() * options.length)]}}`;
      },
    );

    setResult({
      tones: pickRandom(general.tones, NUM_TONES),
      wishes: pickRandom(general.wishes, NUM_WISHES),
      characters,
      emotion: pickedEmotion,
      setting: settingVal,
      event: eventVal,
      weather: weatherVal,
      items: pickRandom(allItems, NUM_ITEMS).map((item) =>
        `${pickRandom(allDescriptors, 1)[0]} ${item}`
      ),
      hookType,
      hooks: pickRandom(hookPool, NUM_CONFLICTS),
      morals: pickRandom(general.morals, NUM_MORALS),
      role: pickRandom(general.roles, NUM_ROLES)[0],
      template: templateStr,
      flavorLine: pickRandom(flavorLines, 1)[0],
    });
    setCopied(false);
  }

  function buildTemplateValues() {
    const values = {};
    addForms(values, 'setting', result.setting);
    addForms(values, 'event', result.event);
    addForms(values, 'weather', result.weather);
    const weatherAdj = values['weather.adj'] || values.weather;
    values.aWeatherAdj = `${aOrAn(weatherAdj)} ${weatherAdj}`;
    addForms(values, 'hook', result.hooks[0]);
    addForms(values, 'wish', result.wishes[0]);
    addForms(values, 'tone', result.tones[0]);
    const toneWord = values.tone;
    values.aTone = `${aOrAn(toneWord)} ${toneWord}`;
    addForms(values, 'role', result.role);
    addForms(values, 'moral', result.morals[0]);
    if (!values['moral.about']) values['moral.about'] = values['moral.bare'];
    values.character1 = formatCharacterPlain(result.characters[0]);
    values['character1.emotional'] = formatCharacterEmotional(result.characters[0], result.emotion);
    values['character1.bare'] = stripArticle(values.character1);
    values['character1.emotional.bare'] = stripArticle(values['character1.emotional']);
    values.character2 = formatCharacterPlain(result.characters[1]);
    values['character2.emotional'] = formatCharacterEmotional(result.characters[1], result.emotion);
    values['character2.bare'] = stripArticle(values.character2);
    values['character2.emotional.bare'] = stripArticle(values['character2.emotional']);
    const bareItem = stripArticle(result.items[0]).toLowerCase();
    values.item = `${aOrAn(bareItem)} ${bareItem}`;
    values['item.bare'] = bareItem;
    return values;
  }

  function renderTemplate() {
    const values = buildTemplateValues();
    const colors = {
      ...placeholderColors,
      hook: result.hookType === 'Mystery' ? 'label-mysteries' : 'label-conflicts',
    };
    const paragraphs = result.template.split('\n\n');
    return (
      <div className="template-narrative">
        {paragraphs.map((para, i) => (
          <p key={i}>{applyTemplate(para, values, colors)}</p>
        ))}
      </div>
    );
  }

  function getPlainTextPrompt() {
    const values = buildTemplateValues();
    let text = result.template.replace(/\{([\w.]+)\}/g, (_, key) => {
      const isCapitalised = key[0] === key[0].toUpperCase();
      const lowerKey = key[0].toLowerCase() + key.slice(1);
      const value = values[lowerKey];
      if (value == null) return `{${key}}`;
      return isCapitalised ? value[0].toUpperCase() + value.slice(1) : value;
    });
    // Fix a/an before resolved values.
    text = text.replace(/\b(an?)\s+([a-z])/gi, (_, article, nextChar) => {
      const upper = article[0] === article[0].toUpperCase();
      const needsN = /[aeiou]/i.test(nextChar);
      return (needsN ? (upper ? 'An' : 'an') : (upper ? 'A' : 'a')) + ' ' + nextChar;
    });
    return text;
  }

  function buildElementList() {
    const lines = [];
    lines.push(`${result.hookType}: ${displayValue(result.hooks[0])}`);
    lines.push(`Wish: ${displayValue(result.wishes[0])}`);
    result.characters.forEach((c) => lines.push(`Character: ${c}`));
    lines.push(`Role: ${result.role}`);
    lines.push(`Emotion: ${result.emotion.text}`);
    lines.push(`Setting: ${displayValue(result.setting)}`);
    lines.push(`Event: ${displayValue(result.event)}`);
    lines.push(`Weather: ${displayValue(result.weather)}`);
    result.items.forEach((i) => lines.push(`Item: ${i}`));
    result.morals.forEach((m) => lines.push(`Moral: ${displayValue(m)}`));
    result.tones.forEach((t) => lines.push(`Tone: ${displayValue(t)}`));
    return lines.join('\n');
  }

  async function handleCopyForAI() {
    const prompt = getPlainTextPrompt();
    const elements = buildElementList();
    const fullText = `Write a bedtime story for a young child (ages 3\u20137) based on the story prompt below.

Guidelines:
- Keep it around 500\u2013800 words, a comfortable 5-minute read-aloud.
- The prompt below is a back-cover-style teaser. Use it as a springboard, not a script \u2014 surprise me with where the story actually goes.
- Read the entire prompt first so you have the full picture before writing. Establish the setting, weather, and atmosphere from the very first scene \u2014 don\u2019t introduce them halfway through and make the reader re-imagine everything. If it\u2019s a rainy night, the reader should feel that from sentence one, not get blindsided five paragraphs in.
- The prompt was generated randomly, so its elements may not obviously connect. Your job is to weave them into a story that feels like it was planned from the start \u2014 find the thread that ties everything together into one cohesive narrative.
- Every element in the prompt (characters, role, setting, event, weather, item, emotion, moral) must matter to the plot. Don\u2019t just mention them in passing \u2014 let their unique qualities shape what happens. The item should do something only that item could do. The setting should create problems or possibilities that wouldn\u2019t exist anywhere else. The weather should change how a scene feels or what\u2019s possible. The story should feel like it couldn\u2019t exist with different elements swapped in.
- Give the characters distinct voices and at least one small, specific detail that makes them feel real (a habit, a favorite thing, a way of speaking).
- Let the story breathe. Not every sentence needs to advance the plot \u2014 a moment of wonder, a silly aside, or a quiet pause can make a story feel alive.
- Avoid AI-story clich\u00e9s: no \u201clittle did they know,\u201d no \u201cand from that day on,\u201d no tidy moral bow at the end. If the theme comes through, the reader will feel it without being told.
- Write in a warm, natural voice \u2014 as if a parent were telling this story from memory, not reading from a script.
- End in a way that feels settling and satisfying. This is a bedtime story \u2014 the child should feel ready to close their eyes.
- Take your time. Write a draft, then re-read it against the prompt and the craft checklist below. If something feels cheap, disjointed, or formulaic, revise it. Go through as many iterations as you need until the story feels compelling, cohesive, and worth telling. Only give me the final version.

Craft checklist (use these as inspiration for making the story effective, not rigid rules \u2014 vary your approach so stories stay fresh and different each time):
- Start close to the action. No wasted setup \u2014 open with something happening.
- Every sentence must reveal character or advance the story. In 500\u2013800 words there is zero room for filler.
- Use the Rule of Three: three attempts, three events. The first two set the pattern, the third breaks it. Children crave the rhythm and love the payoff.
- The character must solve their own problem. No parent, wizard, or narrator swooping in.
- Make the reader care within the first two sentences \u2014 give the character a want, a quirk, or a vulnerability right away.
- Give the character a specific, concrete desire ("find her lost stuffed bear") not an abstract one ("be brave"). The concrete desire reveals the theme.
- Put real, age-appropriate obstacles in the way. Without friction there is no story, just a sequence of events.
- Write for the ear. These stories are read aloud \u2014 every sentence must sound good spoken. If it\u2019s clunky in your mouth, rewrite it.
- Use rhythm, repetition, and refrains. A recurring phrase gives children handholds and creates musicality.
- Use specific sensory details. "The cave smelled like wet rocks and old leaves" is alive. "The cave was dark and scary" is dead. Engage smell, touch, sound \u2014 not just sight.
- Prefer strong concrete nouns and verbs over adjectives and adverbs. "She crept" beats "she walked quietly."
- Never be preachy. If the moral is woven into action, children absorb it. The moment you state it, the story dies.
- Balance adventure with calm \u2014 energy arcs downward toward the end. Curiosity builds, challenge is met, world settles into peace.
- Earn the emotion, don\u2019t assert it. Don\u2019t say "she felt happy" \u2014 show her laughing, spinning, hugging.
- No info-dumping. Drop the reader into the scene; let them piece it together.
- Avoid generic, interchangeable language. The details that make THIS story different are what make it memorable.
- Avoid "and then" plotting. Events must connect through causation or conflict, not just sequence. "Because of that\u2026" not "And then\u2026"
- One main character, one clear problem, one setting. No subplots.

Story elements:
${elements}

Narrative prompt:
${prompt}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="app">
      <h1>Bedtime Story Ideas</h1>

      <div className="settings-wrapper">
        <button
          className="settings-btn"
          onClick={() => setSettingsOpen((v) => !v)}
        >
          Settings {settingsOpen ? '\u25B2' : '\u25BC'}
        </button>
        {settingsOpen && (
          <div className="settings-dropdown">
            <h3 className="settings-heading">Worlds</h3>
            {Object.keys(worlds).map((key) => (
              <label key={key} className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={selectedWorlds[key]}
                  onChange={() => toggleWorld(key)}
                />
                {worldLabels[key]}
              </label>
            ))}
            <h3 className="settings-heading settings-heading-gap">Other</h3>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={singleWorld}
                onChange={() => setSingleWorld((v) => !v)}
              />
              Stick to one world
            </label>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={useTemplate}
                onChange={() => setUseTemplate((v) => !v)}
              />
              Use narrative template
            </label>
          </div>
        )}
      </div>

      <button className="generate-btn" onClick={generate}>
        {result ? 'Generate Again' : 'Generate Story Idea'}
      </button>

      {result && (
        <div className="results">
          {useTemplate ? (
            <>
              <p className="template-flavor">{result.flavorLine}</p>
              {renderTemplate()}
              <button className="copy-ai-btn" onClick={handleCopyForAI}>
                {copied ? 'Copied!' : 'Copy for AI'}
              </button>
            </>
          ) : (
            <>
              <div className="section">
                <h2 className="section-heading">Hook</h2>
                <p className="section-sub">Draw them in to what is happening</p>
                <div className="line-list">
                  <p className="line-item"><span className={`line-label label-${result.hookType === 'Mystery' ? 'mysteries' : 'conflicts'}`}>{result.hookType}:</span> {displayValue(result.hooks[0])}</p>

                </div>
              </div>
              <div className="section">
                <h2 className="section-heading">Pieces</h2>
                <p className="section-sub">Make them care about who it happens to</p>
                <div className="line-list">
                  {result.characters.map((c) => (
                    <p key={c} className="line-item">
                      <span className="line-label label-characters">Character:</span> {c}
                    </p>
                  ))}
                  <p className="line-item"><span className="line-label label-roles">Role:</span> {result.role}</p>
                  <p className="line-item"><span className="line-label label-emotions">Emotion:</span> {result.emotion.text}</p>
                  <p className="line-item"><span className="line-label label-settings">Setting:</span> {displayValue(result.setting)}</p>
                  <p className="line-item"><span className="line-label label-settings">Event:</span> {displayValue(result.event)}</p>
                  <p className="line-item"><span className="line-label label-weather">Weather:</span> {displayValue(result.weather)}</p>
                  {result.items.map((i) => (
                    <p key={i} className="line-item"><span className="line-label label-items">Item:</span> {i}</p>
                  ))}
                </div>
              </div>
              <div className="section">
                <h2 className="section-heading">Impact</h2>
                <p className="section-sub">Make them feel the right things</p>
                <div className="line-list">
                  {result.morals.map((m) => (
                    <p key={displayValue(m)} className="line-item"><span className="line-label label-morals">Moral:</span> {displayValue(m)}</p>
                  ))}
                  {result.wishes.map((w) => (
                    <p key={displayValue(w)} className="line-item"><span className="line-label label-wishes">Wish:</span> {displayValue(w)}</p>
                  ))}
                  {result.tones.map((t) => (
                    <p key={displayValue(t)} className="line-item"><span className="line-label label-tones">Tone:</span> {displayValue(t)}</p>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
