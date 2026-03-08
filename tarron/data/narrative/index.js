import conflictsData from './general/conflicts.json';
import mysteriesData from './general/mysteries.json';
import moralsData from './general/morals.json';
import tonesData from './general/tones.json';
import wishesData from './general/wishes.json';
import emotionsData from './general/emotions.json';

// conflicts: [{ full, verb }, ...]
export const conflicts = conflictsData.conflicts.map(
  ([full, verb]) => ({ full, verb })
);

// mysteries: [{ full, verb }, ...]
export const mysteries = mysteriesData.mysteries.map(
  ([full, verb]) => ({ full, verb })
);

// morals: string | { full, about }
export const morals = moralsData.morals.map((entry) => {
  if (typeof entry === 'string') return entry;
  const [full, about] = entry;
  return { full, about };
});

// tones: [{ full, noun }, ...]
export const tones = tonesData.tones.map(
  ([full, noun]) => ({ full, noun })
);

// wishes: [{ full, bare }, ...]
export const wishes = wishesData.wishes.map(
  ([full, bare]) => ({ full, bare })
);

// emotions: string arrays
export const preEmotions = emotionsData.preEmotions.map(([text]) => text);
export const postEmotions = emotionsData.postEmotions.map(([text]) => text);
