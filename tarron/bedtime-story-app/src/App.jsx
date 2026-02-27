import { useState } from 'react';
import { animals } from './data/animals';
import { people } from './data/people';
import { conflicts } from './data/conflicts';
import { descriptors } from './data/descriptors';
import { items } from './data/items';
import { morals } from './data/morals';
import { settings } from './data/settings';
import { NUM_CHARACTERS, NUM_CONFLICTS, NUM_ITEMS, NUM_MORALS, NUM_SETTINGS } from './config';
import './App.css';

function pickRandom(array, count) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function App() {
  const [result, setResult] = useState(null);

  function generate() {
    setResult({
      settings: pickRandom(settings, NUM_SETTINGS),
      characters: pickRandom([...people, ...animals], NUM_CHARACTERS),
      conflicts: pickRandom(conflicts, NUM_CONFLICTS),
      items: pickRandom(items, NUM_ITEMS).map((item) =>
        Math.random() < 0.5 ? `${pickRandom(descriptors, 1)[0]} ${item}` : item
      ),
      morals: pickRandom(morals, NUM_MORALS),
    });
  }

  return (
    <div className="app">
      <h1>Bedtime Story Ideas</h1>
      <button className="generate-btn" onClick={generate}>
        {result ? 'Generate Again' : 'Generate Story Idea'}
      </button>

      {result && (
        <div className="results">
          <div className="paired-row">
            <div className="category-group">
              <h2 className="category-label label-settings">Setting</h2>
              <div className="card-row">
                {result.settings.map((s) => (
                  <div key={s} className="card card-setting">{s}</div>
                ))}
              </div>
            </div>
            <div className="category-group">
              <h2 className="category-label label-items">Item</h2>
              <div className="card-row">
                {result.items.map((i) => (
                  <div key={i} className="card card-item">{i}</div>
                ))}
              </div>
            </div>
          </div>
          <div className="category-group">
            <h2 className="category-label label-characters">Characters</h2>
            <div className="card-row">
              {result.characters.map((c) => (
                <div key={c} className="card card-character">{c}</div>
              ))}
            </div>
          </div>
          <div className="paired-row">
            <div className="category-group">
              <h2 className="category-label label-conflicts">Conflict</h2>
              <div className="card-row">
                {result.conflicts.map((c) => (
                  <div key={c} className="card card-conflict">{c}</div>
                ))}
              </div>
            </div>
            <div className="category-group">
              <h2 className="category-label label-morals">Moral</h2>
              <div className="card-row">
                {result.morals.map((m) => (
                  <div key={m} className="card card-moral">{m}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
