// Root-level shims so `@itinervate/core/<module>` resolves by plain file path
// in every bundler (Metro in Expo SDK 52 has package `exports` off by default).
import { readdirSync, writeFileSync } from 'node:fs';
const mods = readdirSync('dist').filter((f) => f.endsWith('.js') && f !== 'index.js').map((f) => f.replace(/\.js$/, ''));
for (const m of mods) {
  writeFileSync(`${m}.js`, `module.exports = require('./dist/${m}.js');\n`);
  writeFileSync(`${m}.d.ts`, `export * from './dist/${m}';\n`);
}
writeFileSync('index.js', `module.exports = require('./dist/index.js');\n`);
writeFileSync('index.d.ts', `export * from './dist/index';\n`);
console.log('root shims:', mods.join(', '));
