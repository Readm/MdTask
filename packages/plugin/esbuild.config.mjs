import esbuild from 'esbuild';
import { copyFileSync } from 'node:fs';
import process from 'node:process';

const prod = process.argv[2] === 'production';

const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  // Obsidian provides these at runtime; @md-task/core is bundled in.
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
  ],
  format: 'cjs',
  target: 'es2018',
  outfile: 'dist/main.js',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  logLevel: 'info',
});

/** Copy the static plugin files next to the bundle. */
function copyStatic() {
  copyFileSync('manifest.json', 'dist/manifest.json');
}

if (prod) {
  await context.rebuild();
  await context.dispose();
  copyStatic();
  process.exit(0);
} else {
  copyStatic();
  await context.watch();
}
