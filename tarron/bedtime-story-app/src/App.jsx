import { useState } from 'react';
import * as general from './data/general';
import * as fantasy from './data/fantasy';
import * as scifi from './data/scifi';
import * as modern from './data/modern';
import {
  NUM_CHARACTERS, NUM_CONFLICTS, NUM_ITEMS, NUM_MORALS,
  NUM_TONES, NUM_OPENINGS, NUM_STORY_SHAPES,
} from './config';
import { flavorLines } from './data/general/flavorLines';
import './App.css';

const genres = { fantasy, scifi, modern };

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
// Dot-suffixed keys (e.g. "storyShape.bare") inherit from the base name.
const placeholderColors = {
  setting: 'label-settings',
  weather: 'label-weather',
  aWeatherAdj: 'label-weather',
  character1: 'label-characters',
  character2: 'label-characters',
  item: 'label-items',
  hook: 'label-conflicts',
  opening: 'label-openings',
  storyShape: 'label-storyShapes',
  tone: 'label-tones',
  aTone: 'label-tones',
  moral: 'label-morals',
};

// Parse a template string into an array of JSX elements with color-coded values.
// Supports dot notation: {storyShape.bare} resolves the "bare" form.
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
  const [selectedGenres, setSelectedGenres] = useState({
    fantasy: true,
    scifi: true,
    modern: true,
  });
  const [singleGenre, setSingleGenre] = useState(false);
  const [useTemplate, setUseTemplate] = useState(true);

  function toggleGenre(genre) {
    setSelectedGenres((prev) => ({ ...prev, [genre]: !prev[genre] }));
  }

  function generate() {
    const checked = Object.entries(selectedGenres)
      .filter(([, on]) => on)
      .map(([key]) => key);

    let activeMods;
    if (checked.length === 0) {
      activeMods = [general];
    } else if (singleGenre) {
      const pick = checked[Math.floor(Math.random() * checked.length)];
      activeMods = [general, genres[pick]];
    } else {
      activeMods = [general, ...checked.map((k) => genres[k])];
    }

    const allPeople = mergeArrays(activeMods, 'people');
    const allAnimals = mergeArrays(activeMods, 'animals');
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
    const useEvent = Math.random() < 0.35;
    let settingVal;
    if (useEvent) {
      settingVal = pickRandom(allEvents, 1)[0];
    } else {
      settingVal = pickRandom(allSettings, 1)[0];
    }

    const opening = pickRandom(general.openings, 1)[0];

    setResult({
      tones: pickRandom(general.tones, NUM_TONES),
      storyShapes: pickRandom(general.storyShapes, NUM_STORY_SHAPES),
      openings: [opening],
      characters,
      emotion: pickedEmotion,
      setting: settingVal,
      weather: weatherVal,
      items: pickRandom(allItems, NUM_ITEMS).map((item) =>
        `${pickRandom(allDescriptors, 1)[0]} ${item}`
      ),
      hookType,
      hooks: pickRandom(hookPool, NUM_CONFLICTS),
      morals: pickRandom(general.morals, NUM_MORALS),
      template: pickRandom(general.templates, 1)[0],
      flavorLine: pickRandom(flavorLines, 1)[0],
    });
  }

  function renderTemplate() {
    const template = result.template;
    const values = {};

    // Data-driven values — addForms gives each one a default + .bare form,
    // plus any custom forms defined as object properties in the data file.
    addForms(values, 'setting', result.setting);
    addForms(values, 'weather', result.weather);
    // Computed: "a stormy" or "an overcast" — for "{AWeatherAdj} {setting.bare}".
    const weatherAdj = values['weather.adj'] || values.weather;
    values.aWeatherAdj = `${aOrAn(weatherAdj)} ${weatherAdj}`;
    addForms(values, 'hook', result.hooks[0]);
    addForms(values, 'opening', result.openings[0]);
    addForms(values, 'storyShape', result.storyShapes[0]);
    addForms(values, 'tone', result.tones[0]);
    // Computed: "a cozy" or "an adventurous" — for templates that need "A {tone} tale".
    const toneWord = values.tone;
    values.aTone = `${aOrAn(toneWord)} ${toneWord}`;
    addForms(values, 'moral', result.morals[0]);
    // For single-word morals (strings), "about" = bare (just the lowercase word).
    if (!values['moral.about']) values['moral.about'] = values['moral.bare'];

    // Characters: plain and emotional variants.
    // Templates choose which character gets the emotion via {character1.emotional}.
    values.character1 = formatCharacterPlain(result.characters[0]);
    values['character1.emotional'] = formatCharacterEmotional(result.characters[0], result.emotion);
    values.character2 = formatCharacterPlain(result.characters[1]);
    values['character2.emotional'] = formatCharacterEmotional(result.characters[1], result.emotion);

    const bareItem = stripArticle(result.items[0]).toLowerCase();
    values.item = `${aOrAn(bareItem)} ${bareItem}`;

    const colors = {
      ...placeholderColors,
      hook: result.hookType === 'Mystery' ? 'label-mysteries' : 'label-conflicts',
    };

    const paragraphs = template.split('\n\n');
    return (
      <div className="template-narrative">
        {paragraphs.map((para, i) => (
          <p key={i}>{applyTemplate(para, values, colors)}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Bedtime Story Ideas</h1>

      <div className="genre-section">
        <div className="genre-row">
          {[
            ['fantasy', 'Fantasy'],
            ['modern', 'Modern'],
            ['scifi', 'Sci-Fi'],
          ].map(([key, label]) => (
            <label key={key} className="genre-checkbox">
              <input
                type="checkbox"
                checked={selectedGenres[key]}
                onChange={() => toggleGenre(key)}
              />
              {label}
            </label>
          ))}
        </div>
        <label className="genre-checkbox genre-single">
          <input
            type="checkbox"
            checked={singleGenre}
            onChange={() => setSingleGenre((v) => !v)}
          />
          Stick to one genre
        </label>
        <label className="genre-checkbox genre-single">
          <input
            type="checkbox"
            checked={useTemplate}
            onChange={() => setUseTemplate((v) => !v)}
          />
          Use narrative template
        </label>
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
            </>
          ) : (
            <>
              <div className="section">
                <h2 className="section-heading">Hook</h2>
                <p className="section-sub">Draw them in to what is happening</p>
                <div className="line-list">
                  <p className="line-item"><span className="line-label label-storyShapes">Story Shape:</span> {displayValue(result.storyShapes[0])}</p>
                  <p className="line-item"><span className={`line-label label-${result.hookType === 'Mystery' ? 'mysteries' : 'conflicts'}`}>{result.hookType}:</span> {displayValue(result.hooks[0])}</p>
                  <p className="line-item"><span className="line-label label-openings">Opening:</span> {displayValue(result.openings[0])}</p>
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
                  <p className="line-item"><span className="line-label label-emotions">Emotion:</span> {result.emotion.text}</p>
                  <p className="line-item"><span className="line-label label-settings">Setting:</span> {displayValue(result.setting)}</p>
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
