import { useState } from 'react';
import * as general from './data/general';
import * as fantasy from './data/fantasy';
import * as scifi from './data/scifi';
import * as modern from './data/modern';
import {
  NUM_CHARACTERS, NUM_CONFLICTS, NUM_ITEMS, NUM_MORALS,
  NUM_TONES, NUM_OPENINGS, NUM_STORY_SHAPES,
} from './config';
import './App.css';

const genres = { fantasy, scifi, modern };

function pickRandom(array, count) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function mergeArrays(modules, key) {
  return modules.flatMap((mod) => mod[key] || []);
}

export default function App() {
  const [result, setResult] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState({
    fantasy: true,
    scifi: true,
    modern: true,
  });
  const [singleGenre, setSingleGenre] = useState(false);

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

    const characters = pickRandom([...allPeople, ...allAnimals], NUM_CHARACTERS);
    const emotion = pickRandom(general.emotions, 1)[0];
    const emotionIdx = Math.floor(Math.random() * characters.length);
    const taggedCharacters = characters.map((c, i) =>
      i === emotionIdx ? { name: c, emotion } : { name: c, emotion: null }
    );

    const weather = pickRandom(allWeather, 1)[0];
    const useEvent = Math.random() < 0.35;
    let settingDisplay;
    if (useEvent) {
      const event = pickRandom(allEvents, 1)[0];
      settingDisplay = `${event}, ${weather}`;
    } else {
      const setting = pickRandom(allSettings, 1)[0];
      settingDisplay = `${setting}, ${weather}`;
    }

    const opening = pickRandom(general.openings, 1)[0];

    setResult({
      tones: pickRandom(general.tones, NUM_TONES),
      storyShapes: pickRandom(general.storyShapes, NUM_STORY_SHAPES),
      openings: [opening],
      characters: taggedCharacters,
      setting: settingDisplay,
      items: pickRandom(allItems, NUM_ITEMS).map((item) =>
        `${pickRandom(allDescriptors, 1)[0]} ${item}`
      ),
      hookType,
      hooks: pickRandom(hookPool, NUM_CONFLICTS),
      morals: pickRandom(general.morals, NUM_MORALS),
    });
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
      </div>

      <button className="generate-btn" onClick={generate}>
        {result ? 'Generate Again' : 'Generate Story Idea'}
      </button>

      {result && (
        <div className="results">
          <div className="section">
            <h2 className="section-heading">Hook</h2>
            <p className="section-sub">Draw them in to what is happening</p>
            <div className="line-list">
              <p className="line-item"><span className="line-label label-storyShapes">Story Shape:</span> {result.storyShapes[0]}</p>
              <p className="line-item"><span className={`line-label label-${result.hookType === 'Mystery' ? 'mysteries' : 'conflicts'}`}>{result.hookType}:</span> {result.hooks[0]}</p>
              <p className="line-item"><span className="line-label label-openings">Opening:</span> {result.openings[0]}</p>
            </div>
          </div>
          <div className="section">
            <h2 className="section-heading">Pieces</h2>
            <p className="section-sub">Make them care about who it happens to</p>
            <div className="line-list">
              {result.characters.map((c) => (
                <p key={c.name} className="line-item">
                  <span className="line-label label-characters">Character:</span> {c.name}{c.emotion && <span className="sub-tag label-emotions"> ({c.emotion})</span>}
                </p>
              ))}
              <p className="line-item"><span className="line-label label-settings">Setting:</span> {result.setting}</p>
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
                <p key={m} className="line-item"><span className="line-label label-morals">Moral:</span> {m}</p>
              ))}
              {result.tones.map((t) => (
                <p key={t} className="line-item"><span className="line-label label-tones">Tone:</span> {t}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
