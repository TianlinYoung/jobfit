// ESLint flat config: type-aware TypeScript rules plus the React Hooks rules, for all source, tests and scripts.
import { registerHooks } from 'node:module';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

// Why this hook exists (see DECISIONS D15):
// The project compiles with TypeScript 7, the native (Go) compiler. Its npm package has no
// JavaScript compiler API, but typescript-eslint needs that API to parse and type-check code.
// So typescript-eslint alone is pointed at TypeScript 6 (`@typescript/typescript6`, same
// language, JavaScript API intact). Every other tool, including `npm run typecheck`, still uses 7.
// The hook only rewrites `typescript` (and subpaths such as `typescript/lib/tsserverlibrary`)
// when the import comes from typescript-eslint's own packages.
const TS_ESLINT_PACKAGES = ['/node_modules/typescript-eslint/', '/node_modules/@typescript-eslint/', '/node_modules/ts-api-utils/'];

registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL ?? '';
    const fromTsEslint = TS_ESLINT_PACKAGES.some((dir) => parent.includes(dir));
    const isTypeScript = specifier === 'typescript' || specifier.startsWith('typescript/');
    if (isTypeScript && fromTsEslint) {
      return nextResolve(specifier.replace('typescript', '@typescript/typescript6'), context);
    }
    return nextResolve(specifier, context);
  },
});

// Imported after the hook is registered; a static import would load before the hook runs.
const { default: tseslint } = await import('typescript-eslint');

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Type information comes from the same tsconfig that `npm run typecheck` uses.
        projectService: { allowDefaultProject: ['eslint.config.js', 'scripts/*.mjs'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    // Rule options and the two overrides below are explained in DECISIONS D15.
    rules: {
      // `_name` marks a parameter that must exist for the signature but is not used
      // (every importIssue message takes the same arguments). tsc's noUnusedParameters
      // already follows this convention.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Static methods such as CalendarDate.isValid never use `this`, so passing them
      // as callbacks is safe. Instance methods are still checked.
      '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
      // `never` only appears in branches the type checker has proven unreachable,
      // where the message is a last-resort safety net (CalendarDate.toUtcMillis).
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNever: true }],
    },
  },

  {
    // Plain JavaScript has no type information, so the type-aware rules cannot work there
    // and would flag every value as `any`. The non-type rules still apply.
    files: ['**/*.{js,mjs}'],
    ...tseslint.configs.disableTypeChecked,
  },

  {
    // The Repository interface is Promise-based so a server-backed version can be added later.
    // The browser and in-memory versions are synchronous inside, so their `async` methods have
    // nothing to await. `async` is kept on purpose: a thrown error (e.g. storage full) becomes a
    // rejected Promise, which is what callers of the interface expect.
    files: ['src/storage/**/*.ts'],
    rules: { '@typescript-eslint/require-await': 'off' },
  },

  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/main.tsx'],
    ...reactHooks.configs.flat.recommended,
    languageOptions: { globals: globals.browser },
  },

  {
    // Node-only files: config and the screenshot script.
    files: ['eslint.config.js', 'vite.config.ts', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
);
