import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Global rules for all source files
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      // Keep files small so AI can edit/parse them without blowing context
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
    },
  },

  // ── src/sim/ — pure TS, no Phaser, no Node, no CLI/renderer imports ──
  {
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['phaser', 'phaser/*'], message: 'sim/ must not import Phaser — keep it pure TS.' },
          { group: ['node:*'], message: 'sim/ must not import Node builtins.' },
          { group: ['**/cli/*', '**/cli/**'], message: 'sim/ must not import from cli/.' },
          { group: ['**/renderer/*', '**/renderer/**'], message: 'sim/ must not import from renderer/.' },
        ],
      }],
    },
  },

  // ── src/cli/ — can use sim + Node, no Phaser or renderer ──
  {
    files: ['src/cli/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['phaser', 'phaser/*'], message: 'cli/ must not import Phaser.' },
          { group: ['**/renderer/*', '**/renderer/**'], message: 'cli/ must not import from renderer/.' },
        ],
      }],
    },
  },

  // ── src/renderer/ — can use sim + Phaser, no Node or CLI ──
  {
    files: ['src/renderer/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['node:*'], message: 'renderer/ must not import Node builtins.' },
          { group: ['**/cli/*', '**/cli/**'], message: 'renderer/ must not import from cli/.' },
        ],
      }],
    },
  },

  // Ignore build output
  { ignores: ['../../docs/**'] },
);
